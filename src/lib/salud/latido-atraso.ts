/**
 * Atraso del latido (22/11). El latido corre cada minuto desde pg_cron. Hasta
 * hoy Salud solo ponía rojo cuando pasaban más de 5 minutos sin latido y no
 * dejaba rastro de un corte que ya se había resuelto. Acá, reglas puras:
 *  - amarillo cuando el latido lleva entre 3 y 5 minutos sin correr (todavía
 *    no es rojo, pero ya se atrasa);
 *  - amarillo durante una hora cuando el último latido llegó después de un
 *    hueco de más de 4 minutos (el corte ya pasó, pero conviene saberlo);
 *  - aviso a los dispositivos cuando el hueco fue de 10 minutos o más.
 */
import type { ItemSalud } from "./reglas";

const MIN = 60_000;

/** Desde cuánto sin latido se avisa en amarillo (antes del rojo, que es a los 5 minutos). */
export const ATRASO_AMARILLO_MS = 3 * MIN;
/** Un hueco entre dos latidos mayor a esto se recuerda en Salud durante una hora. */
export const HUECO_RECIENTE_MS = 4 * MIN;
export const RECUERDO_HUECO_MS = 60 * MIN;
/** Un hueco de este tamaño o mayor se avisa a los dispositivos del equipo. */
export const HUECO_AVISO_MS = 10 * MIN;

/** Cuánto pasó entre el latido anterior y este (null si no había anterior). Pura. */
export function huecoEntreLatidos(anteriorAt: string | null | undefined, ahora: Date): number | null {
  if (!anteriorAt) return null;
  const t = Date.parse(anteriorAt);
  if (!Number.isFinite(t)) return null;
  return Math.max(0, ahora.getTime() - t);
}

export interface HuecoRegistrado {
  /** Cuánto duró el hueco, en milisegundos. */
  ms: number;
  /** Cuándo volvió el latido (ISO). */
  at: string;
}

/**
 * Qué hueco queda anotado en el registro del latido: el de esta vez si fue
 * largo; si no, el anterior mientras no pase una hora; si no, ninguno. Pura.
 */
export function huecoParaRegistrar(previo: { at?: string | null; hueco?: HuecoRegistrado | null } | null | undefined, ahora: Date): HuecoRegistrado | null {
  const ms = huecoEntreLatidos(previo?.at, ahora);
  if (ms !== null && ms > HUECO_RECIENTE_MS) return { ms, at: ahora.toISOString() };
  const h = previo?.hueco;
  if (h && Number.isFinite(Date.parse(h.at)) && ahora.getTime() - Date.parse(h.at) < RECUERDO_HUECO_MS) return h;
  return null;
}

/** ¿Merece un aviso a los dispositivos? Pura. */
export function huecoParaAvisar(huecoMs: number | null): boolean {
  return huecoMs !== null && huecoMs >= HUECO_AVISO_MS;
}

function minutos(ms: number): number {
  return Math.round(ms / MIN);
}

/**
 * Control de Salud por atraso del latido. Devuelve null si no hay nada que
 * decir (o si no hay registro: de eso se ocupa el control del latido). Pura.
 */
export function itemAtrasoLatido(d: { ahora: Date; ultimoLatido: string | null; hueco?: HuecoRegistrado | null }): ItemSalud | null {
  if (!d.ultimoLatido) return null;
  const ult = Date.parse(d.ultimoLatido);
  if (!Number.isFinite(ult)) return null;
  const atraso = d.ahora.getTime() - ult;
  // Más de 5 minutos: ya es rojo en el control del latido; no se duplica.
  if (atraso > 5 * MIN) return null;
  if (atraso > ATRASO_AMARILLO_MS) {
    return {
      clave: "latido_atraso",
      estado: "amarillo",
      titulo: "El latido del servidor se está atrasando",
      detalle: `Lleva ${minutos(atraso)} min sin correr (debería correr cada minuto). Si pasa de 5 minutos se pone en rojo.`,
      accion: "Revisar la tarea «campaigns-tick» (pg_cron) y los registros de Vercel",
      href: "/configuracion#tareas",
    };
  }
  const h = d.hueco;
  if (h && h.ms > HUECO_RECIENTE_MS && Number.isFinite(Date.parse(h.at)) && d.ahora.getTime() - Date.parse(h.at) < RECUERDO_HUECO_MS) {
    return {
      clave: "latido_atraso",
      estado: "amarillo",
      titulo: "El latido del servidor se atrasó hace poco",
      detalle: `Hubo ${minutos(h.ms)} min sin latido (debería ser 1) y volvió a correr. Lo que dependía del latido (campañas, seguimientos, recontacto) se demoró en ese lapso.`,
      accion: "Revisar la tarea «campaigns-tick» (pg_cron) y los registros de Vercel",
      href: "/configuracion#tareas",
    };
  }
  return null;
}
