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
      .select("starts_at, ends_at")
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

  const cursor = new Date(now);
  cursor.setMinutes(cursor.getMinutes() >= 30 ? 60 : 30, 0, 0); // redondeo a la próxima media hora

  while (cursor < horizon && slots.length < limit) {
    const weekday = cursor.getDay();
    const dayRules = rulesByWeekday.get(weekday) ?? [];

    for (const rule of dayRules) {
      const [startH, startM] = rule.start_time.split(":").map(Number);
      const [endH, endM] = rule.end_time.split(":").map(Number);

      const dayStart = new Date(cursor);
      dayStart.setHours(startH, startM, 0, 0);
      const dayEnd = new Date(cursor);
      dayEnd.setHours(endH, endM, 0, 0);

      for (
        let slotStart = new Date(dayStart);
        slotStart.getTime() + rule.slot_duration_minutes * 60000 <= dayEnd.getTime();
        slotStart = new Date(slotStart.getTime() + rule.slot_duration_minutes * 60000)
      ) {
        if (slotStart < now) continue;
        const slotEnd = new Date(slotStart.getTime() + rule.slot_duration_minutes * 60000);

        const overlapsAppointment = (appointments ?? []).some(
          (a) => new Date(a.starts_at) < slotEnd && new Date(a.ends_at) > slotStart
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

    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(0, 0, 0, 0);
    if (slots.length >= limit) break;
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
