"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Escena de bienvenida del ingreso («Lamp Login», versión premium 16/10).
 *
 * Una lámpara de pie con cordón que se puede tirar de verdad: el cordón sigue
 * al puntero (o al dedo), vuelve con un resorte con rebote y, si se tiró lo
 * suficiente, prende o apaga la luz. Con la luz prendida hay un cono de luz
 * volumétrico, polvo flotando en el haz y un resplandor que ilumina la
 * tarjeta del PIN. Con teclado funciona como un interruptor (Enter o Espacio).
 *
 * Es solo visual: no cambia nada del ingreso con PIN. Con «reducir
 * movimiento» no hay resorte, ni polvo, ni balanceo: el cordón se acciona
 * igual y la luz cambia sin animaciones.
 */

const UMBRAL_TIRON = 14; // unidades del dibujo (viewBox) para que cuente como tirón
const MAX_TIRON = 46;
const CORDON_Y0 = 124; // donde nace el cordón (borde inferior de la pantalla)
const CORDON_LARGO = 62;

// Polvo en suspensión: valores fijos (sin azar) para que el servidor y el
// navegador dibujen lo mismo.
const MOTAS = Array.from({ length: 18 }, (_, i) => ({
  left: 24 + ((i * 37) % 52),
  top: 34 + ((i * 53) % 56),
  tam: 2 + ((i * 7) % 3),
  dur: 9 + ((i * 5) % 8),
  delay: -((i * 3) % 11),
  dx: ((i * 13) % 30) - 15,
}));

export function LamparaIngreso({ children }: { children: React.ReactNode }) {
  const [prendida, setPrendida] = useState(true);
  const [encendiendo, setEncendiendo] = useState(false);
  const [tiron, setTiron] = useState(0);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const pos = useRef(0);
  const vel = useRef(0);
  const arrastrando = useRef(false);
  const inicioY = useRef(0);
  const movio = useRef(false);
  const raf = useRef<number | null>(null);
  const ultimo = useRef(0);
  const reducido = useRef(false);

  useEffect(() => {
    reducido.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  const alternar = useCallback(() => {
    if (!prendida) {
      setEncendiendo(true);
      window.setTimeout(() => setEncendiendo(false), 900);
    }
    setPrendida(!prendida);
  }, [prendida]);

  // Resorte con rebote: el cordón vuelve a su lugar y se pasa un poco.
  const correr = useCallback((t: number) => {
    const dt = Math.min(0.032, (t - ultimo.current) / 1000 || 0.016);
    ultimo.current = t;
    if (!arrastrando.current) {
      const k = 210;
      const c = 8.5;
      const a = -k * pos.current - c * vel.current;
      vel.current += a * dt;
      pos.current += vel.current * dt;
      if (Math.abs(pos.current) < 0.04 && Math.abs(vel.current) < 0.06) {
        pos.current = 0;
        vel.current = 0;
        setTiron(0);
        raf.current = null;
        return;
      }
      setTiron(pos.current);
    }
    raf.current = requestAnimationFrame(correr);
  }, []);

  const arrancar = useCallback(() => {
    if (raf.current) return;
    ultimo.current = performance.now();
    raf.current = requestAnimationFrame(correr);
  }, [correr]);

  function unidadesPorPixel() {
    const r = svgRef.current?.getBoundingClientRect();
    return r && r.height ? 440 / r.height : 1;
  }

  function alPresionar(e: React.PointerEvent<SVGGElement>) {
    arrastrando.current = true;
    movio.current = false;
    inicioY.current = e.clientY;
    vel.current = 0;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }
  function alMover(e: React.PointerEvent<SVGGElement>) {
    if (!arrastrando.current) return;
    const d = (e.clientY - inicioY.current) * unidadesPorPixel();
    if (Math.abs(d) > 2) movio.current = true;
    pos.current = Math.max(0, Math.min(MAX_TIRON, d));
    setTiron(pos.current);
  }
  function alSoltar(e: React.PointerEvent<SVGGElement>) {
    if (!arrastrando.current) return;
    arrastrando.current = false;
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    const tiroSuficiente = pos.current >= UMBRAL_TIRON;
    if (!movio.current) {
      // Un toque o un clic sin arrastrar: tirón corto automático.
      accionar();
      return;
    }
    if (tiroSuficiente) alternar();
    if (reducido.current) {
      pos.current = 0;
      setTiron(0);
    } else {
      arrancar();
    }
  }

  function accionar() {
    alternar();
    if (reducido.current) return;
    pos.current = 30;
    vel.current = 0;
    setTiron(30);
    arrancar();
  }

  function alTeclado(e: React.KeyboardEvent<SVGGElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      accionar();
    }
  }

  const y2 = CORDON_Y0 + CORDON_LARGO + tiron;

  return (
    <div className={`lampara-escena escena-3d${prendida ? " esta-prendida" : ""}${encendiendo ? " encendiendo" : ""}`}>
      {/* Fondo: luz ambiente, viñeta y grano fino */}
      <div aria-hidden="true" className="lampara-ambiente" />
      <div aria-hidden="true" className="lampara-vineta" />
      <div aria-hidden="true" className="lampara-grano" />

      <div className="lampara-contenido">
        <div className="lampara-columna">
          <div className="lampara-marco">
            <svg
              ref={svgRef}
              viewBox="0 0 220 440"
              className="lampara-svg"
              role="group"
              aria-label="Lámpara de pie con cordón"
            >
              <defs>
                <linearGradient id="lp-laton" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0" stopColor="#6e5326" />
                  <stop offset="0.35" stopColor="#e3c27b" />
                  <stop offset="0.6" stopColor="#b8924a" />
                  <stop offset="1" stopColor="#59421d" />
                </linearGradient>
                <linearGradient id="lp-base" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#d9b873" />
                  <stop offset="1" stopColor="#4b3716" />
                </linearGradient>
                <linearGradient id="lp-pantalla-on" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#f3d79d" />
                  <stop offset="0.55" stopColor="#f6dfae" />
                  <stop offset="1" stopColor="#ffeec8" />
                </linearGradient>
                <linearGradient id="lp-pantalla-off" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#4a3a2a" />
                  <stop offset="1" stopColor="#2f251b" />
                </linearGradient>
                <linearGradient id="lp-brillo" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0" stopColor="#000" stopOpacity="0.28" />
                  <stop offset="0.3" stopColor="#fff" stopOpacity="0.16" />
                  <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
                  <stop offset="1" stopColor="#000" stopOpacity="0.3" />
                </linearGradient>
                <radialGradient id="lp-foco" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0" stopColor="#fffaf0" />
                  <stop offset="0.45" stopColor="#ffe3a8" />
                  <stop offset="1" stopColor="#ffbd63" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="lp-halo" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0" stopColor="#ffd592" stopOpacity="0.75" />
                  <stop offset="1" stopColor="#ffb25a" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="lp-cono" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.55" />
                  <stop offset="0.55" stopColor="#ffc47a" stopOpacity="0.16" />
                  <stop offset="1" stopColor="#ffb25a" stopOpacity="0" />
                </linearGradient>
                <radialGradient id="lp-charco" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0" stopColor="#ffd08a" stopOpacity="0.5" />
                  <stop offset="1" stopColor="#ffb25a" stopOpacity="0" />
                </radialGradient>
                <filter id="lp-suave" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="7" />
                </filter>
                <filter id="lp-suave-chico" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" />
                </filter>
              </defs>

              {/* Luz: cono, charco en el piso y halo (solo con la luz prendida) */}
              <g className="lampara-luz" aria-hidden="true">
                <polygon points="40,128 180,128 340,436 -120,436" fill="url(#lp-cono)" filter="url(#lp-suave)" />
                <ellipse cx="110" cy="418" rx="170" ry="26" fill="url(#lp-charco)" />
                <circle cx="110" cy="128" r="74" fill="url(#lp-halo)" />
              </g>

              {/* Sombra y base */}
              <ellipse cx="110" cy="418" rx="62" ry="8" fill="#000" opacity="0.5" filter="url(#lp-suave-chico)" />
              <ellipse cx="110" cy="410" rx="48" ry="9" fill="url(#lp-base)" />
              <ellipse cx="110" cy="406.5" rx="46" ry="7" fill="url(#lp-laton)" />
              <ellipse cx="110" cy="404" rx="30" ry="4.6" fill="#f4dca1" opacity="0.35" />

              {/* Pie */}
              <rect x="106.5" y="148" width="7" height="258" rx="3.5" fill="url(#lp-laton)" />
              <rect x="103.5" y="236" width="13" height="7" rx="2" fill="url(#lp-laton)" />
              <rect x="104.5" y="250" width="11" height="4" rx="2" fill="url(#lp-laton)" opacity="0.85" />
              <rect x="102" y="140" width="16" height="12" rx="3" fill="#2b2118" />
              <rect x="102" y="140" width="16" height="12" rx="3" fill="url(#lp-brillo)" />

              {/* Foco */}
              <circle cx="110" cy="130" r="11" fill="#3b2f24" />
              <circle className="lampara-foco-on" cx="110" cy="130" r="22" fill="url(#lp-foco)" />
              <circle className="lampara-foco-on" cx="110" cy="130" r="8" fill="#fffdf6" />

              {/* Pantalla: apagada abajo, encendida arriba (se mezclan con opacidad) */}
              <path d="M75 34 H145 L186 124 H34 Z" fill="url(#lp-pantalla-off)" stroke="#6a563f" strokeWidth="1.2" strokeLinejoin="round" />
              <path className="lampara-pantalla-on" d="M75 34 H145 L186 124 H34 Z" fill="url(#lp-pantalla-on)" stroke="#f3d79d" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M75 34 H145 L186 124 H34 Z" fill="url(#lp-brillo)" />
              <ellipse cx="110" cy="124" rx="76" ry="7.5" fill="#1a130d" opacity="0.55" />
              <ellipse className="lampara-borde-on" cx="110" cy="124" rx="76" ry="7.5" fill="#fff2cf" opacity="0.9" />
              <ellipse cx="110" cy="34" rx="35" ry="4" fill="#cfa965" opacity="0.8" />

              {/* Cordón con cuentas */}
              <g className="lampara-cordon">
                <line x1="160" y1={CORDON_Y0} x2="160" y2={y2} stroke="#d8b472" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="0.1 4.4" />
                <line x1="160" y1={CORDON_Y0} x2="160" y2={y2} stroke="#8a6d36" strokeWidth="0.8" opacity="0.6" />
                <g
                  className="lampara-tirador"
                  role="switch"
                  aria-checked={prendida}
                  aria-label={prendida ? "Luz prendida. Tirá del cordón para apagarla" : "Luz apagada. Tirá del cordón para prenderla"}
                  tabIndex={0}
                  onPointerDown={alPresionar}
                  onPointerMove={alMover}
                  onPointerUp={alSoltar}
                  onPointerCancel={alSoltar}
                  onKeyDown={alTeclado}
                >
                  {/* Zona táctil amplia (≥ 44 px a escala normal) */}
                  <rect x="140" y={y2 - 8} width="40" height="46" fill="transparent" />
                  <circle cx="160" cy={y2 + 8} r="7.5" fill="url(#lp-laton)" stroke="#f3d79d" strokeWidth="0.8" />
                  <circle cx="158" cy={y2 + 6} r="2" fill="#fff" opacity="0.55" />
                </g>
              </g>
            </svg>

            {/* Polvo flotando dentro del haz */}
            <div aria-hidden="true" className="lampara-polvo">
              {MOTAS.map((m, i) => (
                <span
                  key={i}
                  style={
                    {
                      left: `${m.left}%`,
                      top: `${m.top}%`,
                      width: m.tam,
                      height: m.tam,
                      animationDuration: `${m.dur}s`,
                      animationDelay: `${m.delay}s`,
                      "--dx": `${m.dx}px`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          </div>
          <p className="lampara-pista" aria-hidden="true">
            {prendida ? "Tirá del cordón para apagar" : "Tirá del cordón para prender"}
          </p>
        </div>

        {/* Tarjeta del ingreso */}
        <div className="lampara-tarjeta" data-3d="suave">{children}</div>
      </div>
    </div>
  );
}
