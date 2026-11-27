/**
 * Jarvis · historial de lo confirmado hoy (22/11). Funciones puras: sin navegador ni reloj propio.
 * Se guarda en el navegador (ver `almacen.ts`) y solo cuenta lo que la persona confirmó con «Sí»
 * (hecho o con error); lo descartado no es parte del historial.
 */

export interface HechoJarvis {
  id: string;
  titulo: string;
  /** Qué pasó, en una frase (el texto del resultado). */
  detalle: string;
  estado: "ejecutada" | "error";
  /** ISO de cuando se confirmó. */
  hora: string;
}

const MAX_HECHOS = 40;

/** Día (AAAA-MM-DD) en hora de Argentina. */
export function diaArgentina(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Suma o actualiza un hecho (misma propuesta = mismo lugar) y deja los más nuevos primero, hasta 40. */
export function agregarHecho(lista: readonly HechoJarvis[], h: HechoJarvis): HechoJarvis[] {
  const sin = lista.filter((x) => x.id !== h.id);
  return [h, ...sin].sort((a, b) => b.hora.localeCompare(a.hora)).slice(0, MAX_HECHOS);
}

/** Solo lo de hoy (hora de Argentina). */
export function hechosDeHoy(lista: readonly HechoJarvis[], ahora: Date): HechoJarvis[] {
  const hoy = diaArgentina(ahora);
  return lista.filter((h) => {
    const t = new Date(h.hora);
    return !Number.isNaN(t.getTime()) && diaArgentina(t) === hoy;
  });
}

/** «14:35» en hora de Argentina. */
export function horaCorta(iso: string): string {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return "";
  return new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(t);
}

/** Valida lo leído del almacenamiento: descarta cualquier cosa que no tenga la forma de un hecho. */
export function hechosValidos(v: unknown): HechoJarvis[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is HechoJarvis => !!x && typeof x.id === "string" && typeof x.titulo === "string" && typeof x.detalle === "string" && (x.estado === "ejecutada" || x.estado === "error") && typeof x.hora === "string")
    .slice(0, MAX_HECHOS);
}
