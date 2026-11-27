import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureOpportunity, logOpportunityEvent } from "@/lib/opportunities";
import { requireSession } from "@/lib/acceso/autorizacion";
import { respuestaErrorInterno } from "@/lib/error-publico";
import { motivoCambioDeCitaNoPermitido } from "@/lib/agenda-vista";

export const dynamic = "force-dynamic";

const ESTADOS = ["pendiente", "confirmada", "realizada", "ausente", "cancelada"] as const;

/**
 * Cambia el estado de una cita desde la supervisión de Agenda (bloque 1.8).
 * Es la misma acción en cualquier vista: repetirla no cambia nada. Deja el
 * cambio en el historial de la oportunidad con autor "operador". No envía
 * mensajes ni avisos.
 *
 * body: { estado, nota? }
 */
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const estado = body?.estado as (typeof ESTADOS)[number];
  if (!ESTADOS.includes(estado)) return NextResponse.json({ error: "Estado de cita inválido." }, { status: 400 });
  const nota = typeof body?.nota === "string" ? body.nota.trim().slice(0, 500) : "";

  const supabase = createAdminClient();
  const { data: citaRaw } = await supabase
    .from("appointments")
    .select("id, status, kind, contact_id, conversation_id, starts_at" as any)
    .eq("id", params.id)
    .maybeSingle();
  if (!citaRaw) return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  const cita = citaRaw as unknown as { id: string; status: string; kind?: string | null; contact_id: string; conversation_id: string | null; starts_at: string };
  if (cita.status === estado) return NextResponse.json({ ok: true, sin_cambios: true });
  // 27/11 (auditoría): los mismos pasos que ofrecen los botones de la Agenda.
  const motivo = motivoCambioDeCitaNoPermitido(cita, estado);
  if (motivo) return NextResponse.json({ error: motivo }, { status: 409 });

  // Condicionado al estado leído: si otro cambio llegó antes, no se pisa.
  const { data: cambiada, error } = await supabase
    .from("appointments")
    .update({ status: estado })
    .eq("id", cita.id)
    .eq("status", cita.status as any)
    .select("id");
  if (error) return respuestaErrorInterno(error, "appointments/[id]");
  if (!(cambiada ?? []).length) return NextResponse.json({ error: "La cita cambió mientras tanto. Actualizá la pantalla y probá de nuevo." }, { status: 409 });

  try {
    const opp = await ensureOpportunity({ contactId: cita.contact_id, conversationId: cita.conversation_id, actor: "operador" });
    await logOpportunityEvent({
      opportunityId: opp.id,
      actor: "operador",
      dimension: "ficha",
      from: `cita ${cita.status}`,
      to: `cita ${estado}`,
      reason: nota || `Cita del ${new Date(cita.starts_at).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}`,
      detail: { cita_id: cita.id },
    });
  } catch (err) {
    console.error("[agenda] No se pudo registrar el cambio de la cita en el historial:", err);
  }
  return NextResponse.json({ ok: true });
}
