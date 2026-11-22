/**
 * Bento grid: la grilla tiene 12 columnas en escritorio, 6 en tablet y 1 en celular.
 * Cada celda pide un ancho (columnas de 12) y un alto (filas); acá se resuelve cuánto ocupa en cada ancho de pantalla.
 */
export interface SpansBento {
  /** Columnas en escritorio (de 12): 1 a 12. */
  lg: number;
  /** Columnas en tablet (de 6): 1 a 6. */
  md: number;
  /** Filas: 1 a 3. */
  filas: number;
}

const entero = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(Number.isFinite(n) ? n : min)));

export function spansBento(columnas: number, filas = 1, columnasMedio?: number): SpansBento {
  const lg = entero(columnas, 1, 12);
  // En tablet, sin pedido explícito: la mitad redondeada hacia arriba (las anchas ocupan toda la fila).
  const md = entero(columnasMedio ?? Math.ceil(lg / 2), 1, 6);
  return { lg, md, filas: entero(filas, 1, 3) };
}

/** Clases CSS de una celda: `pm-c-8 pm-m-4 pm-f-2`. */
export function clasesBento(columnas: number, filas = 1, columnasMedio?: number): string {
  const s = spansBento(columnas, filas, columnasMedio);
  return `pm-c-${s.lg} pm-m-${s.md} pm-f-${s.filas}`;
}
