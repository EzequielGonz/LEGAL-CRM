import { GENERAL_SCHEDULE } from "@/lib/plantillas/catalogo";

/**
 * Horario de envío en hora Argentina, sin dependencias (se prueba solo).
 * Pregunta 39: lunes a sábado de 8 a 21, aunque sea feriado; los domingos no
 * se envía. El calendario con excepciones cargadas a mano llega con el
 * bloque 2.0.
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
 * Antes esto no existía: el cron mandaba mensajes a cualquier hora,
 * incluida la madrugada (3-4am), porque nada se lo impedía — el límite
 * diario de envíos (`daily_send_limit`) solo limita CUÁNTOS mensajes manda
 * por día, no A QUÉ HORA los manda. Ahora, además, el horario de la campaña
 * nunca sale del horario general (lunes a sábado de 8 a 21) y los domingos
 * no se envía.
 *
 * No depende de la zona horaria del servidor (Vercel corre en UTC): se
 * calcula todo a mano con el offset fijo de Argentina.
 */
export function getSendWindow(
  campaign: { send_window_start_hour: number; send_window_end_hour: number },
  now: Date
): { withinWindow: boolean; opensAt: Date } {
  // Truco: restamos el offset y leemos con los getters "UTC" — así, sin
  // importar en qué zona horaria corra el proceso, esos getters devuelven
  // la hora de pared de Argentina.
  const artNow = new Date(now.getTime() - ARGENTINA_UTC_OFFSET_MS);
  const currentHour = artNow.getUTCHours();
  const isSunday = artNow.getUTCDay() === 0;
  const { start, end } = effectiveSendHours(campaign);

  if (!isSunday && start < end && currentHour >= start && currentHour < end) {
    return { withinWindow: true, opensAt: now };
  }

  // Instante UTC real que corresponde a la medianoche de Argentina del día
  // de `artNow`, más las horas de `start` — así calculamos el próximo
  // horario de apertura sin depender de la zona horaria del servidor.
  const argentinaMidnightUtcMs =
    Date.UTC(artNow.getUTCFullYear(), artNow.getUTCMonth(), artNow.getUTCDate()) +
    ARGENTINA_UTC_OFFSET_MS;
  const day = 24 * 60 * 60 * 1000;
  // Si hoy todavía no abrió (y no es domingo), abre hoy; si no, el próximo día que no sea domingo.
  let opensAtMs = argentinaMidnightUtcMs + start * 60 * 60 * 1000;
  if (isSunday || currentHour >= start) opensAtMs += day;
  if (new Date(opensAtMs - ARGENTINA_UTC_OFFSET_MS).getUTCDay() === 0) opensAtMs += day;

  return { withinWindow: false, opensAt: new Date(opensAtMs) };
}

/** Medianoche de hoy en Argentina (UTC-3), como instante UTC. */
export function startOfArgentinaDay(now: Date): Date {
  const art = new Date(now.getTime() - ARGENTINA_UTC_OFFSET_MS);
  return new Date(Date.UTC(art.getUTCFullYear(), art.getUTCMonth(), art.getUTCDate()) + ARGENTINA_UTC_OFFSET_MS);
}
