"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as PE, type ReactNode } from "react";
import { EsferaCerebro } from "@/components/cerebro/escena-cerebro";
import { BarraMando } from "@/components/cerebro/barra-mando";
import { Cartel, Circulo, Cuenta } from "@/components/cerebro/bento-cerebro";
import { PANTALLAS, ajustar, giroHacia, indiceAlFrente, pantallaDeAncla, paso, posicion, radioAnillo, type IdPantalla } from "@/lib/cerebro/anillo";
import { formatoNumero } from "@/lib/premium/anillo";

/**
 * Centro de mando del Cerebro (vuelta 6, pedido del dueño: «el cerebro no tiene funciones, está todo
 * abajo, tiene que ser distinto»). Arriba de todo, la barra para hablarle (Preguntale · Enseñale ·
 * Ordenale). Debajo, un anillo 3D de pantallas de vidrio de colores alrededor del núcleo (la esfera
 * de puntos, que late cuando piensa): cada pantalla es una función viva con su dato. Se gira
 * arrastrando, con la rueda o con las flechas; tocar la de adelante la abre a pantalla completa con
 * su función operable. En el celular y con «menos movimiento» se ve como un bento en lista.
 */

export interface DatoPantalla {
  id: IdPantalla;
  numero: number | null;
  unidad: string;
  contexto: string;
  /** 0 a 1 para la estadística circular; null si no aplica. */
  parte: number | null;
}

const ANCHO = 246;
const ALTO = 300;

/** Partículas sutiles del fondo: posiciones fijas (iguales en servidor y navegador). */
const PARTICULAS = (() => {
  let s = 7;
  const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: 70 }, () => ({ x: r() * 100, y: r() * 100, t: 0.6 + r() * 1.6, d: r() * 6, o: 0.25 + r() * 0.55 }));
})();

export function CentroCerebro({
  datos,
  abiertas,
  frase,
  contactos,
  fecha,
}: {
  datos: DatoPantalla[];
  abiertas: Partial<Record<IdPantalla, ReactNode>>;
  frase: [string, string, string];
  contactos: number | null;
  fecha: string;
}) {
  const n = PANTALLAS.length;
  const [giro, setGiro] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const [abierta, setAbierta] = useState<IdPantalla | null>(null);
  const [pensando, setPensando] = useState(false);
  const [pulso, setPulso] = useState(0);
  const escena = useRef<HTMLDivElement>(null);
  const raiz = useRef<HTMLDivElement>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const botones = useRef<(HTMLButtonElement | null)[]>([]);
  const arrastre = useRef<{ x: number; giro: number; movio: boolean } | null>(null);
  const ultimoArrastre = useRef(0);
  const rueda = useRef<{ acum: number; t: number | null }>({ acum: 0, t: null });
  const giroRef = useRef(0);
  giroRef.current = giro;

  const frente = indiceAlFrente(giro, n);
  const radio = radioAnillo(n, ANCHO, 30);
  const porId = useMemo(() => Object.fromEntries(datos.map((d) => [d.id, d])) as Record<IdPantalla, DatoPantalla | undefined>, [datos]);

  const ir = useCallback(
    (i: number, enfocar = false) => {
      setGiro((g) => giroHacia(((i % n) + n) % n, g, n));
      if (enfocar) window.requestAnimationFrame(() => botones.current[((i % n) + n) % n]?.focus({ preventScroll: true }));
    },
    [n]
  );

  const abrir = useCallback(
    (id: IdPantalla) => {
      const i = PANTALLAS.findIndex((p) => p.id === id);
      if (i >= 0) setGiro((g) => giroHacia(i, g, n));
      setAbierta(id);
      setPulso((p) => p + 1);
      try {
        window.history.replaceState(null, "", `#${id}`);
      } catch {
        /* sin historial */
      }
    },
    [n]
  );

  // Direcciones con #pantalla (y las secciones viejas: #alertas, #preguntas…) abren su pantalla.
  useEffect(() => {
    const leer = () => {
      const id = pantallaDeAncla(window.location.hash);
      if (id) abrir(id);
    };
    leer();
    window.addEventListener("hashchange", leer);
    return () => window.removeEventListener("hashchange", leer);
  }, [abrir]);

  // El diálogo nativo da el foco atrapado y Escape.
  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierta && !d.open) d.showModal();
    if (!abierta && d.open) d.close();
  }, [abierta]);

  const cerrar = () => {
    setAbierta(null);
    try {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    } catch {
      /* sin historial */
    }
    window.requestAnimationFrame(() => botones.current[frente]?.focus({ preventScroll: true }));
  };

  // Parallax con el mouse: variables CSS, sin volver a dibujar React.
  const mover = (e: PE<HTMLDivElement>) => {
    const el = raiz.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    el.style.setProperty("--px", (((e.clientX - b.left) / b.width) * 2 - 1).toFixed(3));
    el.style.setProperty("--py", (((e.clientY - b.top) / b.height) * 2 - 1).toFixed(3));
  };

  // Arrastrar para girar.
  const bajar = (e: PE<HTMLDivElement>) => {
    if (e.button !== 0) return;
    arrastre.current = { x: e.clientX, giro: giroRef.current, movio: false };
  };
  const arrastrar = (e: PE<HTMLDivElement>) => {
    const a = arrastre.current;
    if (!a) return;
    const dx = e.clientX - a.x;
    if (!a.movio && Math.abs(dx) > 6) {
      a.movio = true;
      setArrastrando(true);
      try {
        escena.current?.setPointerCapture(e.pointerId);
      } catch {
        /* sin captura */
      }
    }
    if (a.movio) setGiro(a.giro - dx * 0.32);
  };
  const soltar = () => {
    const a = arrastre.current;
    arrastre.current = null;
    if (a?.movio) {
      ultimoArrastre.current = Date.now();
      setArrastrando(false);
      setGiro((g) => ajustar(g, n));
    }
  };

  // Rueda: gira y encaja en la pantalla más cercana al terminar.
  useEffect(() => {
    const el = escena.current;
    if (!el) return;
    const alRodar = (e: WheelEvent) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!d) return;
      e.preventDefault();
      setGiro((g) => g + d * 0.12);
      if (rueda.current.t) window.clearTimeout(rueda.current.t);
      rueda.current.t = window.setTimeout(() => setGiro((g) => ajustar(g, n)), 160);
    };
    el.addEventListener("wheel", alRodar, { passive: false });
    return () => el.removeEventListener("wheel", alRodar);
  }, [n]);

  const teclas = (e: KeyboardEvent<HTMLButtonElement>) => {
    const k = e.key;
    let dest: number | null = null;
    if (k === "ArrowRight" || k === "ArrowDown") dest = frente + 1;
    else if (k === "ArrowLeft" || k === "ArrowUp") dest = frente - 1;
    else if (k === "Home") dest = 0;
    else if (k === "End") dest = n - 1;
    if (dest == null) return;
    e.preventDefault();
    ir(dest, true);
  };

  const tocar = (i: number) => {
    if (Date.now() - ultimoArrastre.current < 250) return;
    if (i === frente) abrir(PANTALLAS[i].id);
    else ir(i);
  };

  const alFrente = PANTALLAS[frente];
  const datoFrente = porId[alFrente.id];
  const pantallaAbierta = abierta ? PANTALLAS.find((p) => p.id === abierta) ?? null : null;
  const datoAbierta = abierta ? porId[abierta] : undefined;

  return (
    <div ref={raiz} className="cz-centro" onPointerMove={mover} data-pensando={pensando ? "1" : "0"}>
      <svg className="cz-particulas" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {PARTICULAS.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.t * 0.09} style={{ ["--d" as string]: `${p.d}s`, opacity: p.o }} />
        ))}
      </svg>

      <header className="cz-cabeza">
        <nav className="cz-nav" aria-label="Volver y accesos">
          <Link href="/perfiles" prefetch={false} className="cz-nav__a">
            <span aria-hidden="true">←</span> Perfiles
          </Link>
          <span className="cz-nav__marca">
            <i aria-hidden="true" /> Cerebro del negocio <small>· memoria al {fecha}</small>
          </span>
          <span className="cz-nav__der">
            <Link href="/oficina" prefetch={false} className="cz-nav__a">
              Oficina
            </Link>
            <Link href="/asistente" prefetch={false} className="cz-nav__a">
              Jarvis
            </Link>
            <Link href="/bandeja" prefetch={false} className="cz-nav__a">
              Bandeja
            </Link>
          </span>
        </nav>
        <h1 className="cz-sr">Cerebro del negocio</h1>
        <Cartel como="p" className="cz-cartel--grande" antes="Preguntale, enseñale u" clave="ordenale" despues="algo al cerebro." />
        <p className="cz-frase-viva">
          {frase[0]} <span className="cz-box">{frase[1]}</span>
          {frase[2]}
        </p>
        <BarraMando
          alPensar={(p) => {
            setPensando(p);
            if (p) setPulso((x) => x + 1);
          }}
        />
      </header>

      <section className="cz-escenario" aria-labelledby="cz-anillo-tit">
        <h2 id="cz-anillo-tit" className="cz-sr">
          Funciones del cerebro
        </h2>
        <div
          ref={escena}
          className="cz-escena"
          data-arrastrando={arrastrando ? "1" : "0"}
          onPointerDown={bajar}
          onPointerMove={arrastrar}
          onPointerUp={soltar}
          onPointerCancel={soltar}
          role="group"
          aria-roledescription="anillo de pantallas"
          aria-label="Funciones del cerebro. Usá las flechas para girar y Enter para abrir."
          style={{ ["--r" as string]: `${radio}px`, ["--w" as string]: `${ANCHO}px`, ["--h" as string]: `${ALTO}px` } as CSSProperties}
        >
          <div className="cz-camara">
            <div className="cz-aro" style={{ transform: `translateZ(calc(var(--r) * -1)) rotateY(${-giro}deg)` }}>
              <div className="cz-nucleo" style={{ transform: `rotateY(${giro}deg)` }} aria-hidden="true">
                <div className="cz-nucleo__halo" />
                <EsferaCerebro pulso={pulso} pensando={pensando} escala={0.62} puntos={620} />
                <div className="cz-nucleo__txt">
                  <b>{contactos == null ? "—" : formatoNumero(contactos)}</b>
                  <span>{pensando ? "pensando…" : "contactos que conoce"}</span>
                </div>
              </div>
              {PANTALLAS.map((p, i) => {
                const d = porId[p.id];
                const pos = posicion(i, giro, n);
                const alFrenteYa = i === frente;
                return (
                  <button
                    key={p.id}
                    ref={(el) => {
                      botones.current[i] = el;
                    }}
                    type="button"
                    className="cz-pant"
                    data-color={p.color}
                    data-frente={alFrenteYa ? "1" : "0"}
                    tabIndex={alFrenteYa ? 0 : -1}
                    aria-label={`${p.titulo}: ${d?.numero == null ? "sin dato" : formatoNumero(d.numero)} ${d?.unidad ?? ""}. ${d?.contexto ?? ""}. ${alFrenteYa ? "Enter para abrir" : "Traer al frente"}`}
                    onClick={() => tocar(i)}
                    onKeyDown={teclas}
                    style={{ transform: `rotateY(${i * paso(n)}deg) translateZ(var(--r))`, ["--cerca" as string]: pos.cercania.toFixed(3) } as CSSProperties}
                  >
                    <span className="cz-pant__cara">
                      <span className="cz-pant__brillo" aria-hidden="true" />
                      <span className="cz-pant__et">{p.corto}</span>
                      <span className="cz-pant__num">
                        <Cuenta valor={d?.numero ?? null} demoraMs={200 + i * 70} />
                      </span>
                      <span className="cz-pant__uni">{d?.unidad}</span>
                      <span className="cz-pant__pie">
                        {d?.parte != null && <Circulo parte={d.parte} tam={38} grosor={5} color="#15121c" etiqueta={`${Math.round(d.parte * 100)} %`} />}
                        <span className="cz-pant__ctx">{d?.contexto}</span>
                      </span>
                      <span className="cz-pant__abrir" aria-hidden="true">
                        Abrir <span>↗</span>
                      </span>
                    </span>
                    <span className="cz-pant__dorso" aria-hidden="true">
                      {p.corto}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="cz-piso" aria-hidden="true" />
        </div>

        <div className="cz-controles">
          <button type="button" className="cz-neu cz-neu--redondo" aria-label="Pantalla anterior" onClick={() => ir(frente - 1)}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path d="m14.5 6-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <p className="cz-controles__txt" aria-live="polite">
            Al frente: <b>{alFrente.titulo}</b>
            {datoFrente?.contexto ? <span> · {datoFrente.contexto}</span> : null}
          </p>
          <button type="button" className="cz-neu cz-neu--redondo" aria-label="Pantalla siguiente" onClick={() => ir(frente + 1)}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path d="m9.5 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className="cz-btn chico" onClick={() => abrir(alFrente.id)}>
            Abrir {alFrente.corto}
          </button>
        </div>
        <ul className="cz-saltos" aria-label="Ir a una función">
          {PANTALLAS.map((p, i) => (
            <li key={p.id}>
              <button type="button" data-color={p.color} aria-current={i === frente ? "true" : undefined} onClick={() => (i === frente ? abrir(p.id) : ir(i))}>
                <i aria-hidden="true" />
                {p.corto}
              </button>
            </li>
          ))}
        </ul>
        <p className="cz-pista" aria-hidden="true">
          Arrastrá, usá la rueda o las flechas · tocá la de adelante para abrirla
        </p>

        {/* Celular y «menos movimiento»: las mismas funciones en un bento de colores, en lista. */}
        <ul className="cz-lista" aria-label="Funciones del cerebro">
          {PANTALLAS.map((p, i) => {
            const d = porId[p.id];
            return (
              <li key={p.id} data-ancho={i === 0 || i === 3 || i === 6 ? "2" : "1"} style={{ ["--i" as string]: i }}>
                <button type="button" className="cz-tesela" data-color={p.color} onClick={() => abrir(p.id)}>
                  <span className="cz-pant__et">{p.corto}</span>
                  <span className="cz-pant__num">
                    <Cuenta valor={d?.numero ?? null} demoraMs={i * 60} />
                  </span>
                  <span className="cz-pant__uni">{d?.unidad}</span>
                  <span className="cz-pant__ctx">{d?.contexto}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <dialog ref={dialogo} className="cz-dialogo" data-color={pantallaAbierta?.color} aria-labelledby="cz-dialogo-tit" onClose={() => abierta && cerrar()} onCancel={(e) => { e.preventDefault(); cerrar(); }}>
        {pantallaAbierta && (
          <div className="cz-abierta" key={pantallaAbierta.id}>
            <header className="cz-abierta__cab">
              <span className="cz-abierta__chip" data-color={pantallaAbierta.color}>
                {pantallaAbierta.corto}
              </span>
              <Cartel id="cz-dialogo-tit" como="h2" antes={tituloAntes(pantallaAbierta.titulo)} clave={tituloClave(pantallaAbierta.titulo)} />
              {datoAbierta && (
                <p className="cz-abierta__dato">
                  <b>{datoAbierta.numero == null ? "—" : formatoNumero(datoAbierta.numero)}</b> {datoAbierta.unidad} · {datoAbierta.contexto}
                </p>
              )}
              <div className="cz-abierta__nav">
                <button type="button" className="cz-neu cz-neu--redondo" aria-label="Función anterior" onClick={() => abrir(PANTALLAS[(PANTALLAS.findIndex((p) => p.id === pantallaAbierta.id) - 1 + n) % n].id)}>
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                    <path d="m14.5 6-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button type="button" className="cz-neu cz-neu--redondo" aria-label="Función siguiente" onClick={() => abrir(PANTALLAS[(PANTALLAS.findIndex((p) => p.id === pantallaAbierta.id) + 1) % n].id)}>
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                    <path d="m9.5 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button type="button" className="cz-neu cz-neu--redondo cz-neu--cerrar" aria-label="Cerrar y volver al anillo" onClick={cerrar} autoFocus>
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                    <path d="m6.5 6.5 11 11m0-11-11 11" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </header>
            <div className="cz-abierta__cuerpo">{abiertas[pantallaAbierta.id] ?? <p className="cz-muted">Esta función no se pudo cargar ahora.</p>}</div>
          </div>
        )}
      </dialog>
    </div>
  );
}

/** «Pendientes de los dueños» → antes «Pendientes de los», clave «dueños». La última palabra va en el recuadro. */
function tituloAntes(t: string): string {
  const p = t.split(" ");
  return p.length > 1 ? p.slice(0, -1).join(" ") : "";
}
function tituloClave(t: string): string {
  const p = t.split(" ");
  return p[p.length - 1];
}
