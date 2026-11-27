/**
 * Parallax sutil (lógica pura, sin DOM): convierte la posición del puntero y el desplazamiento
 * de la página en tres números que `premium.css` multiplica por la «distancia» de cada capa.
 *  - `px`, `py`: puntero respecto del centro de la ventana, de -1 a 1.
 *  - `sy`: desplazamiento vertical en centenas de px (500 px de scroll = 5), acotado a ±8.
 */
export interface Paralaje {
  px: number;
  py: number;
  sy: number;
}

const acotar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const redondear = (n: number) => Math.round(n * 1000) / 1000;

export const PARALAJE_NULO: Paralaje = { px: 0, py: 0, sy: 0 };

export function calcularParalaje(p: { x: number; y: number; ancho: number; alto: number; scroll: number }): Paralaje {
  if (!(p.ancho > 0) || !(p.alto > 0)) return PARALAJE_NULO;
  const fx = Number.isFinite(p.x) ? p.x : p.ancho / 2;
  const fy = Number.isFinite(p.y) ? p.y : p.alto / 2;
  const sc = Number.isFinite(p.scroll) ? p.scroll : 0;
  return {
    px: redondear(acotar((fx / p.ancho) * 2 - 1, -1, 1)) + 0,
    py: redondear(acotar((fy / p.alto) * 2 - 1, -1, 1)) + 0,
    sy: redondear(acotar(sc / 100, -8, 8)) + 0,
  };
}

/** Desplazamiento en px de una capa a «distancia» `k` (0 a 60): lo mismo que calcula el CSS. Sirve para acotar y probar. */
export function desplazamientoCapa(v: Paralaje, k: number): { x: number; y: number } {
  const kk = acotar(Number.isFinite(k) ? k : 0, 0, 60);
  return { x: redondear(v.px * kk) + 0, y: redondear(v.py * kk - v.sy * kk * 0.5) + 0 };
}
