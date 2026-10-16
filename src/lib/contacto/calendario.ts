import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_CALENDAR,
  argentinaParts,
  type CalendarException,
  type ContactCalendar,
} from "@/lib/contacto/reglas";

/**
 * Etapa 2 · Bloque 2.0 — Lectura del calendario de contacto (servidor).
 *
 * Si no se puede leer, quien envía no envía (`error` con el motivo): una
 * excepción cargada a mano (un día cerrado) nunca se pasa por alto por una
 * falla de lectura.
 */

export interface CalendarExceptionRow {
  id: string;
  day: string;
  closed: boolean;
  start_hour: number | null;
  end_hour: number | null;
  note: string | null;
  created_at: string;
  created_by: string;
  archived_at: string | null;
  archived_by: string | null;
  archive_reason: string | null;
}

export function rowToException(r: Pick<CalendarExceptionRow, "day" | "closed" | "start_hour" | "end_hour" | "note">): CalendarException {
  return { day: r.day, closed: r.closed, startHour: r.start_hour, endHour: r.end_hour, note: r.note };
}

/** Días hacia atrás y hacia adelante que se leen (alcanza para plazos de 72 h y campañas). */
const LOOKBACK_DAYS = 2;
const LOOKAHEAD_DAYS = 120;

export async function loadContactCalendar(
  now: Date = new Date()
): Promise<{ calendar: ContactCalendar; error: string | null }> {
  const supabase = createAdminClient();
  const from = argentinaParts(new Date(now.getTime() - LOOKBACK_DAYS * 86_400_000)).day;
  const to = argentinaParts(new Date(now.getTime() + LOOKAHEAD_DAYS * 86_400_000)).day;
  const { data, error } = await supabase
    .from("contact_calendar_exceptions")
    .select("day, closed, start_hour, end_hour, note")
    .is("archived_at", null)
    .gte("day", from)
    .lte("day", to)
    .order("day", { ascending: true });
  if (error) {
    return { calendar: DEFAULT_CALENDAR, error: `No se pudo leer el calendario de contacto: ${error.message}` };
  }
  return { calendar: { ...DEFAULT_CALENDAR, exceptions: (data ?? []).map(rowToException) }, error: null };
}

/** Excepciones para el panel: las vigentes desde hoy y, aparte, las archivadas recientes. */
export async function listCalendarExceptions(now: Date = new Date()) {
  const supabase = createAdminClient();
  const today = argentinaParts(now).day;
  const [vigentes, archivadas] = await Promise.all([
    supabase
      .from("contact_calendar_exceptions")
      .select("*")
      .is("archived_at", null)
      .gte("day", today)
      .order("day", { ascending: true })
      .limit(200),
    supabase
      .from("contact_calendar_exceptions")
      .select("*")
      .not("archived_at", "is", null)
      .order("archived_at", { ascending: false })
      .limit(20),
  ]);
  return {
    upcoming: (vigentes.data ?? []) as CalendarExceptionRow[],
    archived: (archivadas.data ?? []) as CalendarExceptionRow[],
    error: vigentes.error?.message ?? archivadas.error?.message ?? null,
  };
}
