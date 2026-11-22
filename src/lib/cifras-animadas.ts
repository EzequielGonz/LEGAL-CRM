/**
 * Lógica pura del contador de cifras (`EfectosVidrio`). El formato fija el locale
 * es-AR a propósito: el texto que sube tiene que verse igual que el que dibuja
 * el servidor (`valor.toLocaleString("es-AR")`), sea cual sea el idioma del equipo.
 */

/** El número que muestra una cifra «limpia» (`1.234` o `1234`), o null si hay algo más, es cero o es enorme. */
export function numeroDeCifra(texto: string): number | null {
  const t = texto.trim();
  if (!/^\d{1,3}(\.\d{3})*$|^\d+$/.test(t)) return null;
  const n = Number(t.replace(/\./g, ""));
  return Number.isFinite(n) && n > 0 && n < 10_000_000 ? n : null;
}

/** Milisegundos que tarda en subir: entre 420 y 900, más para cifras más grandes. */
export function duracionCuenta(fin: number): number {
  return Math.min(900, 420 + Math.log10(fin + 1) * 160);
}

/** El texto de un paso de la cuenta (`avance` de 0 a 1), con separador de miles argentino. */
export function textoDeCuenta(fin: number, avance: number): string {
  return Math.round(fin * avance).toLocaleString("es-AR");
}
