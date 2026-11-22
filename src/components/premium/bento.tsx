import type { ReactNode } from "react";
import { clasesBento } from "@/lib/premium/bento";

export interface BentoProps {
  children: ReactNode;
  /** Etiqueta contenedora (por defecto div). */
  como?: "div" | "section" | "ul";
  className?: string;
}

/**
 * Bento grid: 12 columnas en escritorio (gap 18 px), 6 en tablet y 1 en celular. Las celdas piden su
 * tamaño con `BentoCelda`: una grande protagonista, medianas y una franja ancha.
 */
export function Bento({ children, como = "div", className }: BentoProps) {
  const Caja = como;
  return <Caja className={`pm-bento${className ? ` ${className}` : ""}`}>{children}</Caja>;
}

export interface BentoCeldaProps {
  children: ReactNode;
  /** Ancho en escritorio, de 1 a 12 columnas. */
  columnas?: number;
  /** Ancho en tablet, de 1 a 6 columnas (por defecto, la mitad redondeada hacia arriba). */
  columnasMedio?: number;
  /** Alto: 1 a 3 filas. */
  filas?: number;
  como?: "div" | "section" | "article" | "li";
  className?: string;
}

/** Celda del bento: solo ocupa lugar; la tarjeta (con vidrio y relieve) va adentro y la llena. */
export function BentoCelda({ children, columnas = 4, columnasMedio, filas = 1, como = "div", className }: BentoCeldaProps) {
  const Caja = como;
  return <Caja className={`pm-bento__celda ${clasesBento(columnas, filas, columnasMedio)}${className ? ` ${className}` : ""}`}>{children}</Caja>;
}
