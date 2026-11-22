/**
 * Decisiones y órdenes del dueño (22/11). Función pura: parte `cerebro/02-ordenes-vigentes.md` en entradas
 * por título. Las que tienen fecha en el título («Órdenes del 22/11 (tarde)») salen primero, de la más
 * nueva a la más vieja; las demás son las reglas de fondo, sin fecha.
 */

export interface Decision {
  id: string;
  /** AAAA-MM-DD si el título trae fecha. */
  fecha: string | null;
  titulo: string;
  puntos: string[];
}

const ANIO = 2026;

function limpiar(l: string): string {
  return l.replace(/^\s*(?:[-*]|\d+\.)\s+/, "").replace(/\*\*/g, "").replace(/`/g, "").trim();
}

export function decisionesDe(md: string): Decision[] {
  const crudas: { titulo: string; lineas: string[]; orden: number }[] = [];
  let actual: { titulo: string; lineas: string[]; orden: number } | null = null;
  for (const linea of md.split("\n")) {
    const m = /^#{2,3}\s+(.*)$/.exec(linea);
    if (m) {
      actual = { titulo: m[1].trim(), lineas: [], orden: crudas.length };
      crudas.push(actual);
    } else if (actual && linea.trim() && !/^\s*\|?[-| :]+\|?\s*$/.test(linea)) actual.lineas.push(linea);
  }
  const out = crudas
    .map((c) => {
      const f = /(\d{1,2})\/(\d{1,2})/.exec(c.titulo);
      const fecha = f && Number(f[2]) >= 1 && Number(f[2]) <= 12 && Number(f[1]) >= 1 && Number(f[1]) <= 31 ? `${ANIO}-${f[2].padStart(2, "0")}-${f[1].padStart(2, "0")}` : null;
      const puntos = c.lineas.map(limpiar).filter((p) => p.length > 3).slice(0, 8).map((p) => (p.length > 280 ? `${p.slice(0, 279)}…` : p));
      return { id: `d${c.orden}`, fecha, titulo: c.titulo.replace(/\*\*/g, ""), puntos, orden: c.orden };
    })
    .filter((d) => d.puntos.length > 0);
  // Fechadas: más nueva primero (a igual fecha, la que está más abajo en el archivo es la más reciente).
  const con = out.filter((d) => d.fecha).sort((a, b) => (b.fecha as string).localeCompare(a.fecha as string) || b.orden - a.orden);
  const sin = out.filter((d) => !d.fecha).sort((a, b) => a.orden - b.orden);
  return [...con, ...sin].map(({ id, fecha, titulo, puntos }) => ({ id, fecha, titulo, puntos }));
}

/** «22 de noviembre». */
export function fechaLarga(fecha: string | null): string {
  if (!fecha) return "Reglas de fondo";
  const d = new Date(`${fecha}T12:00:00Z`);
  return new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", day: "numeric", month: "long" }).format(d);
}
