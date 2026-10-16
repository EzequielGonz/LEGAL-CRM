import { GENERAL_SCHEDULE } from "@/lib/plantillas/catalogo";
import { isContactAllowed, nextAllowedInstant, type CalendarException } from "@/lib/contacto/reglas";

/**
 * Horario de envío en hora Argentina, sin dependencias (se prueba solo).
 * Pregunta 39: lunes a sábado de 8 a 21, aunque sea feriado; los domingos no
 * se envía. Las excepciones cargadas a mano (bloque 2.0) se aplican a través
 * de src/lib/contacto/reglas.ts.
 */

// Argentina está en UTC-3 todo el año (no tiene horario de verano desde
// 2009), así que alcanza con un offset fijo — no hace falta lidiar con
// cambios de hora.
const ARGENTINA_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;

/**
 * Horario efectivo de una campaña: el suyo, dentro del horario general de
 * lunes a sábado de 8 a 21 (pregunta 39). Los feriados no se excluyen; los
 * domingos no se envía.
 */
export function effectiveSendHours(campaign: { send_window_start_hour: number; send_window_end_hour: number }) {
  const start = Math.max(campaign.send_window_start_hour, GENERAL_SCHEDULE.startHour);
  const end = Math.min(campaign.send_window_end_hour, GENERAL_SCHEDULE.endHour);
  return { start, end: Math.max(start, end) };
}

/**
 * Determina si `now` cae dentro del horario permitido de envío de la
 * campaña (en hora Argentina) y, si no, calcula cuándo vuelve a abrir.
 *
 * El horario de la campaña nunca sale del general (lunes a sábado de 8 a 21,
 * domingos no) y, desde el bloque 2.0, respeta las excepciones del
 * calendario cargadas a mano (un día cerrado o un horario más corto).
 *
 * No depende de la zona horaria del servidor (Vercel corre en UTC): todo se
 * calcula con el offset fijo de Argentina (src/lib/contacto/reglas.ts).
 */
export function getSendWindow(
  campaign: { send_window_start_hour: number; send_window_end_hour: number },
  now: Date,
  exceptions: CalendarException[] = []
): { withinWindow: boolean; opensAt: Date } {
  const { start, end } = effectiveSendHours(campaign);
  const calendar = { startHour: start, endHour: end, exceptions };
  if (start < end && isContactAllowed(now, calendar)) {
    return { withinWindow: true, opensAt: now };
  }
  const next = start < end ? nextAllowedInstant(now, calendar, 60) : null;
  return { withinWindow: false, opensAt: next ?? new Date(now.getTime() + 24 * 60 * 60 * 1000) };
}

/** Medianoche de hoy en Argentina (UTC-3), como instante UTC. */
export function startOfArgentinaDay(now: Date): Date {
  const art = new Date(now.getTime() - ARGENTINA_UTC_OFFSET_MS);
  return new Date(Date.UTC(art.getUTCFullYear(), art.getUTCMonth(), art.getUTCDate()) + ARGENTINA_UTC_OFFSET_MS);
}
