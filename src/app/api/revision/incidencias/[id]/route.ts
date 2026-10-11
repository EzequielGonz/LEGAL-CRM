import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Resolver o descartar una incidencia (queda la nota y el momento; nunca se borra). */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  const accion = body?.accion;
  const nota = typeof body?.nota === "string" ? body.nota.trim() : "";
  if (accion !== "resolver" && accion !== "descartar" && accion !== "reabrir") {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }
  if (accion !== "reabrir" && !nota) {
    return NextResponse.json({ error: "Escribí una nota breve de lo que se hizo." }, { status: 400 });
  }
  const supabase = createAdminClient();
  const update =
    accion === "reabrir"
      ? { status: "abierta", resolved_at: null, resolved_by: null, resolution_note: nota || null }
      : {
          status: accion === "resolver" ? "resuelta" : "descartada",
          resolved_at: new Date().toISOString(),
          resolved_by: "operador",
          resolution_note: nota,
        };
  const { data, error } = await supabase.from("incidences").update(update).eq("id", params.id).select("id, opportunity_id, kind").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Incidencia no encontrada" }, { status: 404 });

  if (data.opportunity_id) {
    await supabase.from("opportunity_events").insert({
      opportunity_id: data.opportunity_id,
      actor: "operador",
      dimension: "revision",
      to_value: update.status,
      reason: `Incidencia: ${data.kind}`,
      detail: { incidencia: data.id, nota },
    });
  }
  return NextResponse.json({ ok: true });
}
