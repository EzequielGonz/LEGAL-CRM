import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Reemplaza las reglas de disponibilidad de un área (días/horarios/duración). */
export async function POST(request: Request) {
  const { area, rules } = await request.json();

  if (area !== "civil" && area !== "penal") {
    return NextResponse.json({ error: "Área inválida" }, { status: 400 });
  }

  const supabase = createAdminClient();

  await supabase.from("availability_rules").delete().eq("area", area);

  if (Array.isArray(rules) && rules.length > 0) {
    const { error } = await supabase.from("availability_rules").insert(
      rules.map((r: any) => ({
        area,
        weekday: r.weekday,
        start_time: r.start_time,
        end_time: r.end_time,
        slot_duration_minutes: r.slot_duration_minutes ?? 30,
        active: true,
      }))
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
