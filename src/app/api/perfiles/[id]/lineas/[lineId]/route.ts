import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Editar o desactivar una línea (no se eliminan). */
export async function PATCH(request: Request, { params }: { params: { id: string; lineId: string } }) {
  const body = await request.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  if (typeof body?.label === "string") {
    const label = body.label.trim().slice(0, 80);
    if (!label) return NextResponse.json({ error: "La línea necesita un nombre." }, { status: 400 });
    update.label = label;
  }
  if (typeof body?.phone_display === "string") update.phone_display = body.phone_display.trim().slice(0, 40) || null;
  for (const k of ["answers_with_agent", "use_for_campaigns", "active"]) {
    if (typeof body?.[k] === "boolean") update[k] = body[k];
  }
  if (body?.daily_limit !== undefined) {
    const v = body.daily_limit === null || body.daily_limit === "" ? null : Number(body.daily_limit);
    if (v !== null && (!Number.isInteger(v) || v <= 0)) {
      return NextResponse.json({ error: "El límite diario tiene que ser un número entero positivo." }, { status: 400 });
    }
    update.daily_limit = v;
  }
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nada para guardar" }, { status: 400 });
  update.updated_at = new Date().toISOString();

  const supabase = createAdminClient();
  const { data: before } = await supabase
    .from("profile_lines")
    .select("*")
    .eq("id", params.lineId)
    .eq("rubro_id", params.id)
    .maybeSingle();
  if (!before) return NextResponse.json({ error: "Línea no encontrada" }, { status: 404 });
  const { error } = await supabase.from("profile_lines").update(update).eq("id", params.lineId);
  if (error) {
    const msg = (error as any).code === "23505" ? "Esa conexión ya está activa en otra línea." : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  await supabase.from("ops_change_log").insert({
    actor: "panel",
    action: "editar_linea",
    target: `profile_lines:${params.lineId}`,
    before,
    after: update,
  });
  return NextResponse.json({ ok: true });
}
