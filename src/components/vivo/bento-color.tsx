import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { formatoNumero } from "@/lib/premium/anillo";

/**
 * Bento de colores (vuelta 6, marcado por el dueño): cajas de distintos tamaños con colores
 * planos vivos, esquinas redondeadas y la etiqueta chica arriba a la izquierda. Se arman
 * animadas: cada caja entra creciendo, escalonada. Texto oscuro sobre color (contraste AA).
 */
export type ColorBento = "violeta" | "rosa" | "amarillo" | "agua" | "lila" | "rosa-claro" | "celeste";

export function BentoColor({ children, className, etiqueta }: { children: ReactNode; className?: string; etiqueta?: string }) {
  return (
    <div className={`vv-bento${className ? ` ${className}` : ""}`} role={etiqueta ? "group" : undefined} aria-label={etiqueta}>
      {children}
    </div>
  );
}

export interface CeldaColorProps {
  color: ColorBento;
  etiqueta: string;
  /** Orden de entrada (0, 1, 2…). */
  orden?: number;
  /** Clases de área de la grilla, por ejemplo «vv-c-grande». */
  area?: string;
  href?: string;
  children?: ReactNode;
  className?: string;
  como?: "div" | "section" | "li";
}

export function CeldaColor({ color, etiqueta, orden = 0, area, href, children, className, como: E = "div" }: CeldaColorProps) {
  const clases = `vv-celda vv-celda--${color}${area ? ` ${area}` : ""}${className ? ` ${className}` : ""}`;
  const estilo = { "--vv-i": orden } as CSSProperties;
  const cuerpo = (
    <>
      <span className="vv-celda__etiqueta">{etiqueta}</span>
      <div className="vv-celda__cuerpo">{children}</div>
    </>
  );
  if (href) {
    return (
      <E className={clases} style={estilo}>
        <Link prefetch={false} href={href} className="vv-celda__enlace">
          {cuerpo}
        </Link>
      </E>
    );
  }
  return (
    <E className={clases} style={estilo}>
      {cuerpo}
    </E>
  );
}

/** Barras chicas animadas (crecen desde abajo, escalonadas). `null` se dibuja como «—», nunca cero. */
export function BarrasMini({ datos, etiqueta }: { datos: { nombre: string; valor: number | null; resaltar?: boolean }[]; etiqueta: string }) {
  const max = Math.max(1, ...datos.map((d) => d.valor ?? 0));
  return (
    <ul className="vv-barras" aria-label={etiqueta}>
      {datos.map((d, i) => {
        const alto = d.valor === null ? 4 : Math.max(6, Math.round((d.valor / max) * 100));
        return (
          <li key={d.nombre} className={d.resaltar ? "vv-barras__i vv-barras__i--fuerte" : "vv-barras__i"}>
            <span className="vv-barras__n">{d.valor === null ? "—" : formatoNumero(d.valor)}</span>
            <span className="vv-barras__riel" aria-hidden="true">
              <span className="vv-barras__b" style={{ height: `${alto}%`, animationDelay: `${300 + i * 90}ms` }} />
            </span>
            <span className="vv-barras__nombre">{d.nombre}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Línea chica (sparkline) dibujada sola de izquierda a derecha. */
export function LineaMini({ valores, etiqueta }: { valores: number[]; etiqueta: string }) {
  if (valores.length < 2) return null;
  const max = Math.max(1, ...valores);
  const ancho = 120;
  const alto = 36;
  const pts = valores.map((v, i) => `${((i / (valores.length - 1)) * ancho).toFixed(1)},${(alto - 3 - (v / max) * (alto - 6)).toFixed(1)}`);
  return (
    <svg className="vv-linea" viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label={etiqueta} preserveAspectRatio="none">
      <polyline points={pts.join(" ")} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
    </svg>
  );
}
