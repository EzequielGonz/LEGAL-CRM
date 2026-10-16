import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/acceso/autorizacion";

export const dynamic = "force-dynamic";

/**
 * Etapa 2 · Bloque 2.0 — Archivar una excepción del calendario (no se borra).
 * PATCH { archive: true, reason?: string }
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  if (body?.archive !== true) {
    return NextResponse.json({ error: "Solo se puede archivar una excepción." }, { status: 400 });
  }
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) {
    return NextResponse.json({ error: "Excepción no encontrada." }, { status: 404 });
  }
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 300) || null : null;
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("contact_calendar_exceptions")
    .update({ archived_at: now, archived_by: "panel", archive_reason: reason })
    .eq("id", params.id)
    .is("archived_at", null)
    .select("*")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "La excepción no existe o ya estaba archivada." }, { status: 404 });

  await supabase.from("ops_change_log").insert({
    actor: "panel",
    action: "calendario_excepcion_archivada",
    target: `contact_calendar_exceptions.${data.id}`,
    before: { day: data.day, closed: data.closed, start_hour: data.start_hour, end_hour: data.end_hour },
    after: { archived_at: now },
    note: reason,
  });
  return NextResponse.json({ ok: true, exception: data });
}
