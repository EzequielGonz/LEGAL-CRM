/** Contraste WCAG 2.x entre dos colores hex (#RRGGBB). Sirve para comprobar la paleta, no para el render. */
function canal(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function luminancia(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Color inválido: ${hex}`);
  const n = parseInt(m[1], 16);
  return 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
}

export function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Color resultante de poner `capa` (con transparencia `alfa`, 0 a 1) sobre `base` (hex). */
export function mezclar(capa: string, alfa: number, base: string): string {
  const a = Math.min(1, Math.max(0, alfa));
  const n = (h: string) => {
    const m = /^#([0-9a-f]{6})$/i.exec(h.trim());
    if (!m) throw new Error(`Color inválido: ${h}`);
    const v = parseInt(m[1], 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  };
  const [c, b] = [n(capa), n(base)];
  const hex = c.map((x, i) => Math.round(x * a + b[i] * (1 - a)).toString(16).padStart(2, "0")).join("");
  return `#${hex}`;
}
