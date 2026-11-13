/**
 * Geometría del gráfico del período en Resultados (13/11). Funciones puras:
 * reciben la serie por día y devuelven los trazos ya calculados, así el
 * componente solo dibuja y esto se prueba sin navegador.
 */
export interface DiaSerie {
  dia: string; // AAAA-MM-DD
  contactados: number;
  respondieron: number;
  captados: number;
}

export interface Punto {
  x: number;
  y: number;
}

/** Tope del eje: un número redondo apenas por encima del máximo. Pura. */
export function topeDeEje(max: number): number {
  if (max <= 4) return 4;
  const paso = Math.pow(10, Math.floor(Math.log10(max)));
  for (const m of [1, 2, 2.5, 5, 10]) if (paso * m >= max) return paso * m;
  return paso * 10;
}

/** Posición de cada día dentro del lienzo. Con un solo día, va al centro. Pura. */
export function puntosDeSerie(valores: number[], ancho: number, alto: number, tope: number, margen = { izq: 0, der: 0, arriba: 0, abajo: 0 }): Punto[] {
  const w = ancho - margen.izq - margen.der;
  const h = alto - margen.arriba - margen.abajo;
  const n = valores.length;
  return valores.map((v, i) => ({
    x: Number((margen.izq + (n <= 1 ? w / 2 : (i / (n - 1)) * w)).toFixed(2)),
    y: Number((margen.arriba + h - (tope > 0 ? Math.min(1, Math.max(0, v / tope)) : 0) * h).toFixed(2)),
  }));
}

/** Línea suave que pasa por todos los puntos sin pasarse de ellos (curva monótona). Pura. */
export function trazoSuave(p: Punto[]): string {
  if (!p.length) return "";
  if (p.length === 1) return `M${p[0].x},${p[0].y}`;
  let d = `M${p[0].x},${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const medio = Number(((p[i].x + p[i + 1].x) / 2).toFixed(2));
    d += ` C${medio},${p[i].y} ${medio},${p[i + 1].y} ${p[i + 1].x},${p[i + 1].y}`;
  }
  return d;
}

/** El mismo trazo, cerrado contra la base, para el relleno. Pura. */
export function areaSuave(p: Punto[], base: number): string {
  if (p.length < 2) return "";
  return `${trazoSuave(p)} L${p[p.length - 1].x},${base} L${p[0].x},${base} Z`;
}

const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

/** Etiqueta corta del día: «lun 9» en una semana, «9» en un mes. Pura. */
export function etiquetaDeDia(dia: string, corta: boolean): string {
  const [a, m, d] = dia.split("-").map(Number);
  const fecha = new Date(Date.UTC(a, m - 1, d));
  return corta ? String(d) : `${DIAS[fecha.getUTCDay()]} ${d}`;
}

/** Normaliza lo que devuelve la base. Lo que no sea un día válido se descarta. Pura. */
export function leerSerie(filas: unknown): DiaSerie[] {
  if (!Array.isArray(filas)) return [];
  return filas
    .filter((f: any) => typeof f?.dia === "string" && /^\d{4}-\d{2}-\d{2}/.test(f.dia))
    .map((f: any) => ({ dia: String(f.dia).slice(0, 10), contactados: Number(f.contactados) || 0, respondieron: Number(f.respondieron) || 0, captados: Number(f.captados) || 0 }));
}
