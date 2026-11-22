import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/acceso/autorizacion";
import { esUuid } from "@/lib/rutas/comprobar";
import { ensureOpportunity, logOpportunityEvent } from "@/lib/opportunities";
import { respuestaErrorInterno } from "@/lib/error-publico";
import { accionesDeCita, sePisan, validarHorario } from "@/lib/agenda-vista";

export const dynamic = "force-dynamic";

/**
 * Mueve una cita abierta a otra fecha y hora (22/11). No envía mensajes. Las citas de Fase 2 con la IA no se mueven
 * desde acá. Si el horario se pisa con otra cita del equipo del mismo perfil, avisa (409) salvo que se confirme.
 * body: { starts_at (ISO), duration_minutes?, nota?, permitir_superposicion? }
 */
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (!esUuid(params.id)) return NextResponse.json({ error: "Cita no válida." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const inicio = typeof body?.starts_at === "string" && !Number.isNaN(Date.parse(body.starts_at)) ? new Date(body.starts_at).toISOString() : null;
  const supabase = createAdminClient();
  const { data: cita } = await supabase.from("appointments").select("id, area, status, kind, contact_id, conversation_id, starts_at, ends_at").eq("id", params.id).maybeSingle();
  if (!cita) return NextResponse.json({ error: "Esa cita no existe." }, { status: 404 });
  const dur = Number(body?.duration_minutes) || Math.round((Date.parse(cita.ends_at) - Date.parse(cita.starts_at)) / 60000) || 30;
  const mal = validarHorario(inicio, dur);
  if (mal) return NextResponse.json({ error: mal }, { status: 400 });
  if (!accionesDeCita(cita as any).mover) return NextResponse.json({ error: cita.kind === "ia" ? "Las citas de Fase 2 con la IA no se mueven desde acá." : "Solo se mueve una cita pendiente o confirmada." }, { status: 400 });
  const nuevo = { starts_at: inicio!, ends_at: new Date(Date.parse(inicio!) + dur * 60000).toISOString() };

  if (!body?.permitir_superposicion) {
    const { data: otras } = await supabase.from("appointments").select("id, starts_at, ends_at, kind").eq("area", cita.area).neq("id", cita.id).not("status", "in", "(cancelada,ausente)").lt("starts_at", nuevo.ends_at).gt("ends_at", nuevo.starts_at);
    if (((otras ?? []) as any[]).some((o) => o.kind !== "ia" && sePisan(o, nuevo))) {
      return NextResponse.json({ error: "Ya hay otra cita en ese horario.", code: "superposicion" }, { status: 409 });
    }
  }
  const { error } = await supabase.from("appointments").update(nuevo).eq("id", cita.id);
  if (error) return respuestaErrorInterno(error, "appointments/[id]/mover");
  try {
    const nota = typeof body?.nota === "string" ? body.nota.trim().slice(0, 500) : "";
    const opp = await ensureOpportunity({ contactId: cita.contact_id, conversationId: cita.conversation_id, actor: "operador" });
    await logOpportunityEvent({ opportunityId: opp.id, actor: "operador", dimension: "ficha", from: `cita del ${new Date(cita.starts_at).toLocaleString("es-AR")}`, to: `cita del ${new Date(nuevo.starts_at).toLocaleString("es-AR")}`, reason: nota || "Cita movida desde Citas", detail: { cita_id: cita.id } });
  } catch (err) {
    console.error("[agenda] No se pudo registrar el cambio de horario:", err);
  }
  return NextResponse.json({ ok: true, cita: { id: cita.id, ...nuevo } });
}
