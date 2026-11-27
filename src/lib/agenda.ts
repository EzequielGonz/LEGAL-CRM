import { createAdminClient } from "@/lib/supabase/admin";
import type { Area } from "@/lib/supabase/database.types";

export interface Slot {
  starts_at: string;
  ends_at: string;
}

/**
 * Calcula los próximos horarios disponibles para un área, cruzando las
 * reglas de disponibilidad semanales con las citas ya tomadas y los
 * bloqueos puntuales. Pensado para que lo use tanto el panel como el
 * agente IA (tool `consultar_disponibilidad`).
 */
export async function getAvailableSlots(
  area: Area,
  { daysAhead = 14, limit = 20 }: { daysAhead?: number; limit?: number } = {}
): Promise<Slot[]> {
  const supabase = createAdminClient();

  const now = new Date();
  const horizon = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const [{ data: rules }, { data: blocks }, { data: appointments }] = await Promise.all([
    supabase.from("availability_rules").select("*").eq("area", area).eq("active", true),
    supabase
      .from("availability_blocks")
      .select("*")
      .eq("area", area)
      .gte("ends_at", now.toISOString()),
    supabase
      .from("appointments")
      // Se lee todo y se filtra acá: así funciona antes y después de la migración 0203.
      .select("*")
      .eq("area", area)
      .neq("status", "cancelada")
      .gte("starts_at", now.toISOString()),
  ]);

  return calcularTurnos({
    reglas: rules ?? [],
    bloqueos: blocks ?? [],
    citas: appointments ?? [],
    ahora: now,
    daysAhead,
    limit,
  });
}

const OFFSET_AR_MS = 3 * 3_600_000; // Argentina: UTC−3 fijo, sin horario de verano.

export interface ReglaTurnos {
  weekday: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

/**
 * Arma los turnos libres en hora argentina (27/11, auditoría): el servidor
 * corre en UTC y antes «9 a 13» salía 06 a 10 de Argentina y el día de la
 * semana se corría desde las 21 h. Pura: recibe reglas, bloqueos, citas y
 * `ahora`, y devuelve instantes ISO (UTC) igual que antes.
 */
export function calcularTurnos({
  reglas,
  bloqueos,
  citas,
  ahora,
  daysAhead = 14,
  limit = 20,
}: {
  reglas: ReglaTurnos[];
  bloqueos: { starts_at: string; ends_at: string }[];
  citas: { starts_at: string; ends_at: string; kind?: string | null }[];
  ahora: Date;
  daysAhead?: number;
  limit?: number;
}): Slot[] {
  const slots: Slot[] = [];
  const nowMs = ahora.getTime();
  const horizonMs = nowMs + daysAhead * 24 * 60 * 60 * 1000;

  const porDia = new Map<number, ReglaTurnos[]>();
  for (const regla of reglas) {
    const arr = porDia.get(regla.weekday) ?? [];
    arr.push(regla);
    porDia.set(regla.weekday, arr);
  }

  // Las citas de IA (Fase 2) no consumen turnos humanos.
  const ocupadas = citas
    .filter((a) => a.kind !== "ia")
    .map((a) => [Date.parse(a.starts_at), Date.parse(a.ends_at)] as const);
  const bloqueadas = bloqueos.map((b) => [Date.parse(b.starts_at), Date.parse(b.ends_at)] as const);

  // Fecha de hoy en Argentina, leída con los campos UTC del instante corrido 3 h.
  const hoyAR = new Date(nowMs - OFFSET_AR_MS);
  for (let n = 0; slots.length < limit; n++) {
    const dia = new Date(Date.UTC(hoyAR.getUTCFullYear(), hoyAR.getUTCMonth(), hoyAR.getUTCDate() + n));
    // Medianoche argentina de ese día, como instante.
    const medianocheMs = dia.getTime() + OFFSET_AR_MS;
    if (medianocheMs >= horizonMs) break;

    for (const regla of porDia.get(dia.getUTCDay()) ?? []) {
      const [startH, startM] = regla.start_time.split(":").map(Number);
      const [endH, endM] = regla.end_time.split(":").map(Number);
      const durMs = regla.slot_duration_minutes * 60_000;
      if (!(durMs > 0)) continue;
      const inicioMs = medianocheMs + (startH * 60 + startM) * 60_000;
      const finMs = medianocheMs + (endH * 60 + endM) * 60_000;

      for (let t = inicioMs; t + durMs <= finMs; t += durMs) {
        if (t < nowMs || t >= horizonMs) continue;
        const tFin = t + durMs;
        const choca =
          ocupadas.some(([a, b]) => a < tFin && b > t) || bloqueadas.some(([a, b]) => a < tFin && b > t);
        if (!choca) {
          slots.push({ starts_at: new Date(t).toISOString(), ends_at: new Date(tFin).toISOString() });
          if (slots.length >= limit) break;
        }
      }
      if (slots.length >= limit) break;
    }
  }

  return slots;
}

export async function createAppointment({
  contactId,
  conversationId,
  area,
  startsAt,
  endsAt,
  consultationType,
}: {
  contactId: string;
  conversationId?: string;
  area: Area;
  startsAt: string;
  endsAt: string;
  consultationType?: string;
}) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      contact_id: contactId,
      conversation_id: conversationId,
      area,
      starts_at: startsAt,
      ends_at: endsAt,
      consultation_type: consultationType,
      status: "confirmada",
    })
    .select()
    .single();

  if (error) throw new Error(`No se pudo crear la cita: ${error.message}`);

  await supabase
    .from("contacts")
    .update({ status: "agendado", meets_criteria: true })
    .eq("id", contactId);

  return data;
}

/**
 * 15/11 (auditoría): el bot solo agenda un horario libre y futuro, igual a uno
 * de los que ofreció la agenda (con un minuto de tolerancia). Pura.
 */
export function horarioOfrecido(startsAt: unknown, slots: Slot[], ahora = new Date()): Slot | null {
  const t = typeof startsAt === "string" ? Date.parse(startsAt) : NaN;
  if (!Number.isFinite(t) || t <= ahora.getTime()) return null;
  return slots.find((s) => Math.abs(Date.parse(s.starts_at) - t) <= 60_000) ?? null;
}
