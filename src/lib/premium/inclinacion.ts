/**
 * Inclinación 3D suave de las tarjetas con relieve (lógica pura, sin DOM).
 * Con el cursor a la derecha el borde derecho se «hunde» (rotateY positivo);
 * con el cursor abajo se hunde el borde de abajo (rotateX negativo).
 */

export interface Inclinacion {
  /** Grados sobre el eje X (CSS rotateX). */
  rx: number;
  /** Grados sobre el eje Y (CSS rotateY). */
  ry: number;
  /** Posición del brillo, en porcentaje del ancho y del alto (0 a 100). */
  bx: number;
  by: number;
}

/** Máximo permitido: más de 6° deja de ser sobrio. */
export const INCLINACION_MAX = 6;
export const INCLINACION_POR_DEFECTO = 5;

const acotar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const redondear = (n: number) => Math.round(n * 100) / 100;

/** `x` e `y` son la posición del puntero dentro de la tarjeta (px); `ancho` y `alto`, su tamaño. */
export function calcularInclinacion(x: number, y: number, ancho: number, alto: number, max = INCLINACION_POR_DEFECTO): Inclinacion {
  if (!(ancho > 0) || !(alto > 0) || !Number.isFinite(x) || !Number.isFinite(y)) return { rx: 0, ry: 0, bx: 50, by: 50 };
  const tope = acotar(Number.isFinite(max) ? max : INCLINACION_POR_DEFECTO, 0, INCLINACION_MAX);
  const fx = acotar(x / ancho, 0, 1);
  const fy = acotar(y / alto, 0, 1);
  // `+ 0` evita el -0 cuando el puntero está justo en el centro.
  return {
    rx: redondear(-(fy * 2 - 1) * tope) + 0,
    ry: redondear((fx * 2 - 1) * tope) + 0,
    bx: redondear(fx * 100),
    by: redondear(fy * 100),
  };
}
