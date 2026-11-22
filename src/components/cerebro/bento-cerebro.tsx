"use client";

import { Fragment, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { formatoNumero } from "@/lib/premium/anillo";

/**
 * Piezas del video de diseño que marcó el dueño (vuelta 6): carteles con la palabra clave en serif
 * itálica recuadrada que aparecen palabra por palabra, números que cuentan, el anillo circular de
 * las estadísticas, la tarjeta de vidrio sobre círculos de color (los círculos viven DENTRO de la
 * tarjeta, no en el fondo) y la tarjeta con degradé de colores que se mezclan como nubes.
 * Todo en SVG y CSS (nítido en cualquier pantalla) y quieto si la persona pidió menos movimiento.
 */

const menosMovimiento = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Cartel: «antes [clave] después». La clave va en serif itálica dentro de un recuadro fino con esquinas. */
export function Cartel({ antes, clave, despues = "", como: Etiqueta = "h2", className, demoraMs = 0, id }: { antes: string; clave: string; despues?: string; como?: "h1" | "h2" | "h3" | "p"; className?: string; demoraMs?: number; id?: string }) {
  const palabras: { w: string; clave?: boolean }[] = [];
  antes.split(" ").filter(Boolean).forEach((w) => palabras.push({ w }));
  palabras.push({ w: clave, clave: true });
  despues.split(" ").filter(Boolean).forEach((w) => palabras.push({ w }));
  return (
    <Etiqueta id={id} className={`cz-cartel ${className ?? ""}`.trim()} aria-label={`${antes} ${clave}${despues ? ` ${despues}` : ""}`.replace(/\s+([.,:;])/g, "$1")}>
      {palabras.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && !/^[.,:;!?]/.test(p.w) ? " " : ""}
          <span aria-hidden="true" className={p.clave ? "cz-cartel__clave" : "cz-cartel__w"} style={{ ["--d" as string]: `${demoraMs + i * 90}ms` }}>
            {p.w}
          </span>
        </Fragment>
      ))}
    </Etiqueta>
  );
}

/** Número que cuenta desde cero al aparecer. Se dibuja ya con el valor final (igual en servidor y navegador). */
export function Cuenta({ valor, demoraMs = 0 }: { valor: number | null; demoraMs?: number }) {
  const [v, setV] = useState(valor);
  useEffect(() => {
    if (valor == null || menosMovimiento()) {
      setV(valor);
      return;
    }
    let raf = 0;
    let t0 = 0;
    const T = 1200;
    setV(0);
    const arrancar = window.setTimeout(() => {
      const tick = (t: number) => {
        if (!t0) t0 = t;
        const p = Math.min(1, (t - t0) / T);
        setV(Math.round(valor * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, demoraMs);
    return () => {
      window.clearTimeout(arrancar);
      cancelAnimationFrame(raf);
    };
  }, [valor, demoraMs]);
  return (
    <span className="cz-cuenta">
      {v == null ? "—" : formatoNumero(v)}
    </span>
  );
}

/** Estadística circular (la que pidió el dueño): arco proporcional, con relieve. */
export function Circulo({ parte, tam = 56, grosor = 7, color = "currentColor", etiqueta }: { parte: number | null; tam?: number; grosor?: number; color?: string; etiqueta: string }) {
  const r = (tam - grosor) / 2;
  const c = 2 * Math.PI * r;
  const p = parte == null || !Number.isFinite(parte) ? 0 : Math.max(0, Math.min(1, parte));
  return (
    <svg className="cz-circulo" width={tam} height={tam} viewBox={`0 0 ${tam} ${tam}`} role="img" aria-label={etiqueta}>
      <circle cx={tam / 2} cy={tam / 2} r={r} fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth={grosor} />
      <circle
        cx={tam / 2}
        cy={tam / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={grosor}
        strokeLinecap="round"
        strokeDasharray={`${c} ${c}`}
        style={{ ["--lleno" as string]: `${c * (1 - p)}`, ["--vacio" as string]: `${c}` }}
        className="cz-circulo__arco"
        transform={`rotate(-90 ${tam / 2} ${tam / 2})`}
      />
    </svg>
  );
}

/** Tarjeta de vidrio esmerilado apoyada sobre círculos de color que se mueven lento (dentro de la tarjeta). */
export function VidrioCirculos({ children, className, tonos = ["#ff7eb6", "#7c6cff", "#ffd23f"] }: { children: ReactNode; className?: string; tonos?: [string, string, string] }) {
  return (
    <div className={`cz-vidrio-c ${className ?? ""}`.trim()}>
      <div className="cz-vidrio-c__fondo" aria-hidden="true">
        <i style={{ background: tonos[0] }} />
        <i style={{ background: tonos[1] }} />
        <i style={{ background: tonos[2] }} />
      </div>
      <div className="cz-vidrio-c__vidrio">{children}</div>
    </div>
  );
}

/** Tarjeta con degradé de colores que se mezclan como nubes (un componente, no el fondo del panel). */
export function Malla({ children, tonos, className, style }: { children: ReactNode; tonos: [string, string, string]; className?: string; style?: CSSProperties }) {
  return (
    <div className={`cz-malla ${className ?? ""}`.trim()} style={{ ["--m1" as string]: tonos[0], ["--m2" as string]: tonos[1], ["--m3" as string]: tonos[2], ...style }}>
      <div className="cz-malla__nubes" aria-hidden="true" />
      <div className="cz-malla__txt">{children}</div>
    </div>
  );
}

/** Etiqueta píldora amarilla (como «NOMBRES» del video). */
export function Pildora({ children }: { children: ReactNode }) {
  return <span className="cz-pildora">{children}</span>;
}
