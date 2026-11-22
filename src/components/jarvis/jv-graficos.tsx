"use client";

import { useEffect, useId, useRef, useState } from "react";
import { caminoArea, proporcion, type PuntoSerie } from "@/lib/jarvis/tablero";

/**
 * Gráficos de Jarvis (vuelta 6): SVG livianos, animados una sola vez al entrar (el área se dibuja, las
 * barras crecen, los aros se llenan y las cifras cuentan). Cada gráfico lleva su texto para lectores de
 * pantalla con los números reales; con «reducir movimiento» aparecen quietos en su valor final.
 * Usan `currentColor`, así toman el color de la baldosa donde están.
 */

const FORMATO = new Intl.NumberFormat("es-AR");
export const fmt = (n: number | null | undefined) => (typeof n === "number" && Number.isFinite(n) ? FORMATO.format(n) : "—");

function quieto(): boolean {
  return typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Cifra que cuenta de 0 al valor una vez (ease-out). */
export function Cifra({ valor, className }: { valor: number | null | undefined; className?: string }) {
  const final = typeof valor === "number" && Number.isFinite(valor) ? valor : null;
  const [v, setV] = useState(final);
  const hecho = useRef(false);
  useEffect(() => {
    if (final === null) return setV(null);
    if (hecho.current || quieto()) {
      setV(final);
      return;
    }
    hecho.current = true;
    let cuadro = 0;
    const t0 = performance.now();
    const paso = (ahora: number) => {
      const k = Math.min(1, (ahora - t0) / 900);
      setV(Math.round(final * (1 - Math.pow(2, -10 * k))));
      if (k < 1) cuadro = requestAnimationFrame(paso);
    };
    setV(0);
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [final]);
  return <span className={className}>{fmt(v)}</span>;
}

/** Área de 7 días con puntos, la etiqueta de cada día y el último valor destacado. */
export function Area({ serie, alto = 92, titulo }: { serie: PuntoSerie[]; alto?: number; titulo: string }) {
  const id = useId().replace(/:/g, "");
  const ancho = 300;
  const { linea, area, puntos } = caminoArea(
    serie.map((p) => p.valor),
    ancho,
    alto
  );
  const resumen = serie.map((p) => `${p.etiqueta} ${fmt(p.valor)}`).join(", ");
  return (
    <figure className="jv-g-area" role="img" aria-label={`${titulo}: ${resumen}`}>
      <svg viewBox={`0 0 ${ancho} ${alto}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.45" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((k) => (
          <line key={k} x1="0" x2={ancho} y1={alto * k} y2={alto * k} className="jv-g-guia" />
        ))}
        <path d={area} fill={`url(#a${id})`} className="jv-g-relleno" />
        <path d={linea} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" pathLength={1} className="jv-g-trazo" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="jv-g-puntos" aria-hidden="true">
        {puntos.map(([x, y], i) => (
          <span key={i} className={i === puntos.length - 1 ? "jv-g-punto jv-g-punto-hoy" : "jv-g-punto"} style={{ left: `${(x / ancho) * 100}%`, top: `${(y / alto) * 100}%`, animationDelay: `${500 + i * 60}ms` }} />
        ))}
      </div>
      <figcaption className="jv-g-dias" aria-hidden="true">
        {serie.map((p, i) => (
          <span key={p.dia} className={i === serie.length - 1 ? "jv-g-hoy" : undefined}>
            {i === serie.length - 1 ? "hoy" : p.etiqueta}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

/** Barritas verticales de 7 días (captados por día). */
export function Columnas({ serie, titulo }: { serie: PuntoSerie[]; titulo: string }) {
  const max = Math.max(1, ...serie.map((p) => p.valor ?? 0));
  return (
    <div className="jv-g-cols" role="img" aria-label={`${titulo}: ${serie.map((p) => `${p.etiqueta} ${fmt(p.valor)}`).join(", ")}`}>
      {serie.map((p, i) => (
        <span key={p.dia} className="jv-g-col" aria-hidden="true">
          <span className="jv-g-col-barra" style={{ height: `${Math.max(6, ((p.valor ?? 0) / max) * 100)}%`, animationDelay: `${200 + i * 70}ms` }} />
          <span className="jv-g-col-dia">{i === serie.length - 1 ? "hoy" : p.etiqueta}</span>
        </span>
      ))}
    </div>
  );
}

/** Aro con relieve: el número al centro, el arco se llena una vez. */
export function Aro({ valor, total, etiqueta, centro, tamano = 92 }: { valor: number | null; total: number | null; etiqueta: string; centro?: string; tamano?: number }) {
  const grosor = 9;
  const r = (tamano - grosor) / 2;
  const circ = 2 * Math.PI * r;
  const objetivo = proporcion(valor, total);
  const [prop, setProp] = useState(objetivo);
  useEffect(() => {
    if (quieto()) return setProp(objetivo);
    setProp(0);
    const c = requestAnimationFrame(() => requestAnimationFrame(() => setProp(objetivo)));
    return () => cancelAnimationFrame(c);
  }, [objetivo]);
  return (
    <div className="jv-g-aro" style={{ width: tamano, height: tamano }} role="img" aria-label={`${etiqueta}: ${fmt(valor)}${total ? ` de ${fmt(total)}` : ""}`}>
      <svg width={tamano} height={tamano} viewBox={`0 0 ${tamano} ${tamano}`} aria-hidden="true" focusable="false">
        <circle cx={tamano / 2} cy={tamano / 2} r={r} fill="none" strokeWidth={grosor} className="jv-g-aro-pista" />
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={r}
          fill="none"
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - prop)}
          transform={`rotate(-90 ${tamano / 2} ${tamano / 2})`}
          className="jv-g-aro-arco"
        />
      </svg>
      <span className="jv-g-aro-centro" aria-hidden="true">
        {centro ?? <Cifra valor={valor} />}
      </span>
    </div>
  );
}

/** Esta semana contra la anterior, en barras pareadas horizontales. */
export function Comparacion({ filas, titulo }: { filas: { etiqueta: string; actual: number | null; anterior: number | null }[]; titulo: string }) {
  // Cada fila con su propia escala: así 8 contra 5 se ve igual de claro que 385 contra 252.
  return (
    <ul className="jv-g-comp" aria-label={titulo}>
      {filas.map((f, i) => {
        const max = Math.max(1, f.actual ?? 0, f.anterior ?? 0);
        return (
        <li key={f.etiqueta}>
          <span className="jv-g-comp-et">{f.etiqueta}</span>
          <span className="jv-g-comp-barras" aria-hidden="true">
            <span className="jv-g-comp-b jv-g-comp-act" style={{ width: `${Math.max(2, ((f.actual ?? 0) / max) * 100)}%`, animationDelay: `${150 + i * 90}ms` }} />
            <span className="jv-g-comp-b jv-g-comp-ant" style={{ width: `${Math.max(2, ((f.anterior ?? 0) / max) * 100)}%`, animationDelay: `${220 + i * 90}ms` }} />
          </span>
          <span className="jv-g-comp-n">
            {fmt(f.actual)}
            <span className="sr-only">
              {" "}
              esta semana; la anterior {fmt(f.anterior)}
            </span>
            <small aria-hidden="true"> / {fmt(f.anterior)}</small>
          </span>
        </li>
        );
      })}
    </ul>
  );
}

/** Barras horizontales simples (tarjetas de resultado y campañas). */
export function Barras({ datos, titulo, segundo }: { datos: { etiqueta: string; valor: number; segundo?: number }[]; titulo: string; segundo?: string }) {
  const max = Math.max(1, ...datos.map((d) => d.valor));
  return (
    <ul className="jv-g-barras" aria-label={titulo}>
      {datos.map((d, i) => (
        <li key={`${d.etiqueta}-${i}`}>
          <span className="jv-g-barras-et" title={d.etiqueta}>
            {d.etiqueta}
          </span>
          <span className="jv-g-barras-carril" aria-hidden="true">
            <span className="jv-g-barras-b" style={{ width: `${Math.max(2, (d.valor / max) * 100)}%`, animationDelay: `${120 + i * 80}ms` }} />
            {typeof d.segundo === "number" && <span className="jv-g-barras-b2" style={{ width: `${Math.max(0, (d.segundo / max) * 100)}%`, animationDelay: `${200 + i * 80}ms` }} />}
          </span>
          <span className="jv-g-barras-n">
            {fmt(d.valor)}
            {typeof d.segundo === "number" && segundo ? <small> · {fmt(d.segundo)} {segundo}</small> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
