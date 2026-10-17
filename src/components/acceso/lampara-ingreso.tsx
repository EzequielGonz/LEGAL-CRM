"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnclaSala, LamparaCuerpo, LamparaDefs, LamparaLuz, SalaLampara } from "@/components/ui/lampara-dibujo";

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
    <div data-tema="neutro" className={`lampara-escena escena-3d${prendida ? " esta-prendida" : ""}${encendiendo ? " encendiendo" : ""}`}>
      {/* Sala: pared con boiserie y grano; el piso y la luz se anclan a la lámpara */}
      <SalaLampara />

      <div className="lampara-contenido">
        <div className="lampara-columna">
          <div className="lampara-marco">
            <AnclaSala />
            <svg
              ref={svgRef}
              viewBox="0 0 220 440"
              className="lampara-svg"
              role="group"
              aria-label="Lámpara de pie con cordón"
            >
              <LamparaDefs p="lp" />
              <LamparaLuz p="lp" />
              <LamparaCuerpo p="lp" />

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
                  <circle className="lampara-anillo" cx="160" cy={y2 + 8} r="13" fill="none" stroke="#fff2cf" strokeWidth="1.6" />
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
