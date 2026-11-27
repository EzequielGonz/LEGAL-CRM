/**
 * Lógica pura de los anillos y medidores de la fundación visual (22/11).
 * Sin DOM, sin fecha ni azar: lo que calcula el servidor es idéntico a lo que
 * calcula el navegador (así no hay diferencias de hidratación).
 */

export type TamanoAnillo = "grande" | "medio" | "chico";

/** Medidas del brief (sección 5): diámetro, grosor del trazo, tamaño de la cifra y duración del llenado. */
export const TAMANOS_ANILLO: Record<TamanoAnillo, { diametro: number; trazo: number; cifra: number; ms: number }> = {
  grande: { diametro: 160, trazo: 12, cifra: 48, ms: 900 },
  medio: { diametro: 120, trazo: 10, cifra: 36, ms: 900 },
  chico: { diametro: 64, trazo: 6, cifra: 16, ms: 600 },
};

const redondear = (n: number) => Math.round(n * 1000) / 1000;

/** Fracción llenada (0 a 1). Meta nula, negativa o inválida: 0. Pasarse de la meta cierra el arco. */
export function fraccion(valor: number, meta: number): number {
  if (!Number.isFinite(valor) || !Number.isFinite(meta) || meta <= 0 || valor <= 0) return 0;
  return Math.min(1, valor / meta);
}

/** Porcentaje entero (0 a 100) de lo llenado. */
export function porcentaje(valor: number, meta: number): number {
  return Math.round(fraccion(valor, meta) * 100);
}

/** True si se llegó a la meta (muestra la tilde chica). Sin meta válida, nunca. */
export function llegoALaMeta(valor: number, meta: number): boolean {
  return Number.isFinite(valor) && Number.isFinite(meta) && meta > 0 && valor >= meta;
}

/** Geometría del círculo: el trazo se dibuja hacia adentro del diámetro, así el SVG no recorta. */
export function geometriaAnillo(diametro: number, trazo: number) {
  const radio = (diametro - trazo) / 2;
  return { radio: redondear(radio), centro: redondear(diametro / 2), largo: redondear(2 * Math.PI * radio) };
}

/** `stroke-dashoffset` para llenar `frac` de un trazo de largo `largo` (lleno = 0, vacío = largo). */
export function desplazamiento(largo: number, frac: number): number {
  const f = Math.min(1, Math.max(0, frac));
  return redondear(largo * (1 - f));
}

/** Geometría del semicírculo del medidor: el arco va de izquierda a derecha por arriba. */
export function geometriaMedidor(ancho: number, trazo: number) {
  const radio = (ancho - trazo) / 2;
  const cy = radio + trazo / 2;
  return {
    radio: redondear(radio),
    cx: redondear(ancho / 2),
    cy: redondear(cy),
    alto: redondear(cy + trazo / 2),
    largo: redondear(Math.PI * radio),
    trazado: `M ${trazo / 2} ${redondear(cy)} A ${redondear(radio)} ${redondear(radio)} 0 0 1 ${redondear(ancho - trazo / 2)} ${redondear(cy)}`,
  };
}

/** Número entero con punto de miles (es-AR), sin depender de ICU: 1234 pasa a «1.234». */
export function formatoNumero(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const r = Math.round(n);
  const con = Math.abs(r).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return r < 0 ? `-${con}` : con;
}

/** Texto para el lector de pantalla: «Jurídico: 12 de 20 consultas hoy». */
export function etiquetaAnillo(p: { nombre: string; valor: number; meta?: number; unidad?: string; sufijo?: string }): string {
  const u = p.unidad ? ` ${p.unidad}` : "";
  if (p.meta !== undefined && p.meta > 0 && p.sufijo !== "%") {
    return `${p.nombre}: ${formatoNumero(p.valor)} de ${formatoNumero(p.meta)}${u}`;
  }
  return `${p.nombre}: ${formatoNumero(p.valor)}${p.sufijo ?? ""}${u}`;
}
