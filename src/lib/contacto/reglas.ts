/**
 * Etapa 2 · Bloque 2.0 — Reglas de contacto y calendario (sin dependencias:
 * se prueba solo).
 *
 * Reglas aprobadas:
 *  - Todo envío automático que inicia o retoma un contacto (campañas,
 *    seguimientos, reagendamientos) sale de lunes a sábado de 8 a 21, hora de
 *    Argentina, aunque sea feriado; los domingos no (pregunta 39).
 *  - El calendario admite excepciones cargadas a mano: un día cerrado o un
 *    horario más corto ese día. Una excepción solo restringe: no abre domingos
 *    ni extiende el horario general.
 *  - Al programar un seguimiento se elige una franja válida dentro de 48 a 72
 *    horas, la más cercana al valor objetivo (60 por defecto, editable entre 48
 *    y 72). Las franjas son horas enteras desde el momento de referencia: el
 *    caso aprobado (jueves 20:15 + 60 h = domingo 8:15) se programa el sábado a
 *    las 20:15 (48 h), nunca el domingo ni el lunes a las 8 (83 h 45 min).
 *  - Si no hay ninguna franja válida, se registra un conflicto visible y no se
 *    envía. Al ejecutar se repite la comprobación; una tarea vencida sin
 *    franja válida queda como conflicto, sin ampliar el plazo.
 *  - Ventana de 24 horas del canal: fuera de las 24 horas desde el último
 *    mensaje de la persona, WhatsApp solo admite plantillas aprobadas.
 */

/** Argentina está en UTC-3 todo el año (sin horario de verano desde 2009). */
export const ARGENTINA_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** Horario general: lunes a sábado de 8 a 21 (21 no incluido), hora de Argentina. */
export const GENERAL_HOURS = { startHour: 8, endHour: 21 } as const;

/** Seguimiento: entre 48 y 72 horas, 60 por defecto. */
export const FOLLOWUP_RANGE = { minHours: 48, maxHours: 72, defaultTargetHours: 60 } as const;

/** Ventana de atención del canal (WhatsApp): 24 horas desde el último mensaje de la persona. */
export const CHANNEL_WINDOW_HOURS = 24;

export interface CalendarException {
  /** Día en hora Argentina, YYYY-MM-DD. */
  day: string;
  /** true: ese día no sale ningún envío automático. */
  closed: boolean;
  /** Si no está cerrado: horario de ese día (dentro del general). */
  startHour?: number | null;
  endHour?: number | null;
  note?: string | null;
}

export interface ContactCalendar {
  startHour: number;
  endHour: number;
  exceptions: CalendarException[];
}

export const DEFAULT_CALENDAR: ContactCalendar = {
  startHour: GENERAL_HOURS.startHour,
  endHour: GENERAL_HOURS.endHour,
  exceptions: [],
};

export function calendarWith(exceptions: CalendarException[]): ContactCalendar {
  return { ...DEFAULT_CALENDAR, exceptions };
}

/** Partes de un instante en hora de pared de Argentina. */
export function argentinaParts(instant: Date) {
  const a = new Date(instant.getTime() - ARGENTINA_UTC_OFFSET_MS);
  const y = a.getUTCFullYear();
  const m = a.getUTCMonth() + 1;
  const d = a.getUTCDate();
  return {
    day: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    weekday: a.getUTCDay(), // 0 = domingo
    hour: a.getUTCHours(),
    minute: a.getUTCMinutes(),
  };
}

/** Instante UTC de la medianoche argentina del día YYYY-MM-DD. */
export function argentinaMidnight(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + ARGENTINA_UTC_OFFSET_MS);
}

export function isValidDay(day: unknown): day is string {
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Problemas de una excepción cargada a mano (vacío = válida). */
export function exceptionProblems(e: Partial<CalendarException>, calendar: Pick<ContactCalendar, "startHour" | "endHour"> = DEFAULT_CALENDAR): string[] {
  const problems: string[] = [];
  if (!isValidDay(e.day)) problems.push("La fecha no es válida (AAAA-MM-DD).");
  if (e.closed) return problems;
  const s = e.startHour;
  const t = e.endHour;
  if (!Number.isInteger(s) || !Number.isInteger(t)) {
    problems.push("Indicá el horario de ese día (hora de inicio y de fin) o marcalo como cerrado.");
    return problems;
  }
  if ((s as number) < calendar.startHour || (t as number) > calendar.endHour) {
    problems.push(`El horario de una excepción tiene que quedar dentro del general (${calendar.startHour} a ${calendar.endHour}).`);
  }
  if ((s as number) >= (t as number)) problems.push("La hora de inicio tiene que ser anterior a la de fin.");
  return problems;
}

/**
 * Horario de un día (hora Argentina): null si ese día no se envía.
 * Domingo: siempre cerrado. Excepción cerrada: cerrado. Excepción con
 * horario: la intersección con el general.
 */
export function hoursForDay(day: string, weekday: number, calendar: ContactCalendar): { start: number; end: number } | null {
  if (weekday === 0) return null;
  let start = calendar.startHour;
  let end = calendar.endHour;
  for (const e of calendar.exceptions) {
    if (e.day !== day) continue;
    if (e.closed) return null;
    if (Number.isInteger(e.startHour) && Number.isInteger(e.endHour)) {
      start = Math.max(start, e.startHour as number);
      end = Math.min(end, e.endHour as number);
    }
  }
  return start < end ? { start, end } : null;
}

/** ¿Se puede mandar un envío automático en este instante? */
export function isContactAllowed(instant: Date, calendar: ContactCalendar = DEFAULT_CALENDAR): boolean {
  const p = argentinaParts(instant);
  const h = hoursForDay(p.day, p.weekday, calendar);
  return !!h && p.hour >= h.start && p.hour < h.end;
}

/**
 * Próximo instante permitido a partir de `from` (incluido), dentro de
 * `maxDays` días. null si no hay ninguno (por ejemplo, muchos días cerrados).
 */
export function nextAllowedInstant(from: Date, calendar: ContactCalendar = DEFAULT_CALENDAR, maxDays = 30): Date | null {
  if (isContactAllowed(from, calendar)) return from;
  const p = argentinaParts(from);
  let midnight = argentinaMidnight(p.day).getTime();
  for (let i = 0; i <= maxDays; i++) {
    const day = argentinaParts(new Date(midnight + 12 * HOUR_MS)).day; // mediodía: evita bordes
    const weekday = argentinaParts(new Date(midnight + 12 * HOUR_MS)).weekday;
    const h = hoursForDay(day, weekday, calendar);
    if (h) {
      const open = midnight + h.start * HOUR_MS;
      const close = midnight + h.end * HOUR_MS;
      if (from.getTime() < close) return new Date(Math.max(open, from.getTime()));
    }
    midnight += DAY_MS;
  }
  return null;
}

/** Valor objetivo del seguimiento: entero entre 48 y 72 (60 si no es válido). */
export function normalizeTargetHours(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n === "number" && Number.isInteger(n) && n >= FOLLOWUP_RANGE.minHours && n <= FOLLOWUP_RANGE.maxHours) return n;
  return FOLLOWUP_RANGE.defaultTargetHours;
}

export type SlotResult =
  | { ok: true; at: Date; offsetHours: number }
  | { ok: false; conflict: "sin_franja_valida"; detail: string };

/**
 * Elige la franja del seguimiento: `base` + k horas (k entero entre 48 y 72),
 * permitida por el calendario y no anterior a `notBefore`, con k lo más cerca
 * posible del objetivo (empate: la más temprana). Sin franja: conflicto.
 */
export function chooseFollowupSlot(
  base: Date,
  opts: { targetHours?: number; calendar?: ContactCalendar; notBefore?: Date } = {}
): SlotResult {
  const target = normalizeTargetHours(opts.targetHours ?? FOLLOWUP_RANGE.defaultTargetHours);
  const calendar = opts.calendar ?? DEFAULT_CALENDAR;
  let best: { at: Date; k: number } | null = null;
  for (let k = FOLLOWUP_RANGE.minHours; k <= FOLLOWUP_RANGE.maxHours; k++) {
    const at = new Date(base.getTime() + k * HOUR_MS);
    if (opts.notBefore && at.getTime() < opts.notBefore.getTime()) continue;
    if (!isContactAllowed(at, calendar)) continue;
    if (!best || Math.abs(k - target) < Math.abs(best.k - target)) best = { at, k };
  }
  if (best) return { ok: true, at: best.at, offsetHours: best.k };
  return {
    ok: false,
    conflict: "sin_franja_valida",
    detail: `No hay ninguna franja de lunes a sábado de ${calendar.startHour} a ${calendar.endHour} entre las ${FOLLOWUP_RANGE.minHours} y las ${FOLLOWUP_RANGE.maxHours} horas: no se envía y queda para revisión.`,
  };
}

export type ExecutionDecision =
  | { action: "enviar" }
  | { action: "esperar"; until: Date }
  | { action: "reprogramar"; at: Date; offsetHours: number }
  | { action: "conflicto"; conflict: "sin_franja_valida" | "plazo_vencido"; detail: string };

/**
 * Comprobación al ejecutar una tarea programada con `chooseFollowupSlot`:
 *  - antes de su hora: esperar;
 *  - en su hora y dentro del calendario y del plazo: enviar;
 *  - si ya no es válida (una excepción nueva, el proceso se demoró): se busca
 *    otra franja del mismo plazo que todavía no pasó; si no hay, conflicto.
 * Nunca se amplía el plazo de 72 horas desde la referencia.
 */
export function decideAtExecution(
  task: { base: Date; scheduledAt: Date; targetHours?: number },
  now: Date,
  calendar: ContactCalendar = DEFAULT_CALENDAR
): ExecutionDecision {
  if (now.getTime() < task.scheduledAt.getTime()) return { action: "esperar", until: task.scheduledAt };
  const deadline = task.base.getTime() + FOLLOWUP_RANGE.maxHours * HOUR_MS;
  const earliest = task.base.getTime() + FOLLOWUP_RANGE.minHours * HOUR_MS;
  if (now.getTime() <= deadline && now.getTime() >= earliest && isContactAllowed(now, calendar)) {
    return { action: "enviar" };
  }
  const retry = chooseFollowupSlot(task.base, { targetHours: task.targetHours, calendar, notBefore: now });
  if (retry.ok) return { action: "reprogramar", at: retry.at, offsetHours: retry.offsetHours };
  if (now.getTime() > deadline) {
    return {
      action: "conflicto",
      conflict: "plazo_vencido",
      detail: `Venció el plazo de ${FOLLOWUP_RANGE.maxHours} horas sin una franja válida: no se envía y queda para revisión.`,
    };
  }
  return { action: "conflicto", conflict: "sin_franja_valida", detail: retry.detail };
}

/** Ventana de 24 horas del canal desde el último mensaje de la persona. */
export function channelWindow(lastInboundAt: Date | null | undefined, at: Date): { open: boolean; closesAt: Date | null } {
  if (!lastInboundAt) return { open: false, closesAt: null };
  const closesAt = new Date(lastInboundAt.getTime() + CHANNEL_WINDOW_HOURS * HOUR_MS);
  return { open: at.getTime() < closesAt.getTime(), closesAt };
}

/** Qué tipo de mensaje admite el canal en ese momento. */
export function messageKindAllowed(lastInboundAt: Date | null | undefined, at: Date): "texto_libre" | "plantilla" {
  return channelWindow(lastInboundAt, at).open ? "texto_libre" : "plantilla";
}

/** Texto corto para mostrar una franja en el panel (hora Argentina). */
export function formatArgentina(instant: Date): string {
  const p = argentinaParts(instant);
  const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const [y, m, d] = p.day.split("-");
  return `${dias[p.weekday]} ${d}/${m}/${y} ${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}
