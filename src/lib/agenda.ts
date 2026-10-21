import { createAdminClient } from "@/lib/supabase/admin";
import type { Area } from "@/lib/supabase/database.types";
import { argentinaMidnight, argentinaParts } from "@/lib/contacto/reglas";

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

  const slots: Slot[] = [];
  const rulesByWeekday = new Map<number, typeof rules>();
  for (const rule of rules ?? []) {
    const arr = rulesByWeekday.get(rule.weekday) ?? [];
    arr.push(rule);
    rulesByWeekday.set(rule.weekday, arr);
  }

  // Las reglas están en hora de Argentina y el servidor (Vercel) corre en UTC:
  // los días y horarios se calculan con el offset fijo de Argentina (21/10).
  let dia = argentinaParts(now).day;
  while (argentinaMidnight(dia) < horizon && slots.length < limit) {
    const medianoche = argentinaMidnight(dia).getTime();
    const weekday = argentinaParts(new Date(medianoche + 12 * 3_600_000)).weekday;
    const dayRules = rulesByWeekday.get(weekday) ?? [];

    for (const rule of dayRules) {
      const [startH, startM] = rule.start_time.split(":").map(Number);
      const [endH, endM] = rule.end_time.split(":").map(Number);

      const dayStart = new Date(medianoche + (startH * 60 + (startM || 0)) * 60_000);
      const dayEnd = new Date(medianoche + (endH * 60 + (endM || 0)) * 60_000);

      for (
        let slotStart = new Date(dayStart);
        slotStart.getTime() + rule.slot_duration_minutes * 60000 <= dayEnd.getTime();
        slotStart = new Date(slotStart.getTime() + rule.slot_duration_minutes * 60000)
      ) {
        if (slotStart < now) continue;
        const slotEnd = new Date(slotStart.getTime() + rule.slot_duration_minutes * 60000);

        // Las citas de IA (Fase 2) no consumen turnos humanos.
        const overlapsAppointment = (appointments ?? []).filter((a: any) => a.kind !== "ia").some(
          (a: any) => new Date(a.starts_at) < slotEnd && new Date(a.ends_at) > slotStart
        );
        const overlapsBlock = (blocks ?? []).some(
          (b) => new Date(b.starts_at) < slotEnd && new Date(b.ends_at) > slotStart
        );

        if (!overlapsAppointment && !overlapsBlock) {
          slots.push({ starts_at: slotStart.toISOString(), ends_at: slotEnd.toISOString() });
          if (slots.length >= limit) break;
        }
      }
      if (slots.length >= limit) break;
    }

    dia = argentinaParts(new Date(medianoche + 36 * 3_600_000)).day;
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
