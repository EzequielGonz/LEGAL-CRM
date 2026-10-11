import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureOpportunity, logOpportunityEvent } from "@/lib/opportunities";

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
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  const estado = body?.estado as (typeof ESTADOS)[number];
  if (!ESTADOS.includes(estado)) return NextResponse.json({ error: "Estado de cita inválido." }, { status: 400 });
  const nota = typeof body?.nota === "string" ? body.nota.trim().slice(0, 500) : "";

  const supabase = createAdminClient();
  const { data: cita } = await supabase
    .from("appointments")
    .select("id, status, contact_id, conversation_id, starts_at")
    .eq("id", params.id)
    .maybeSingle();
  if (!cita) return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  if (cita.status === estado) return NextResponse.json({ ok: true, sin_cambios: true });

  const { error } = await supabase.from("appointments").update({ status: estado }).eq("id", cita.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const opp = await ensureOpportunity({ contactId: cita.contact_id, conversationId: cita.conversation_id, actor: "operador" });
    await logOpportunityEvent({
      opportunityId: opp.id,
      actor: "operador",
      dimension: "ficha",
      from: `cita ${cita.status}`,
      to: `cita ${estado}`,
      reason: nota || `Cita del ${new Date(cita.starts_at).toLocaleString("es-AR")}`,
      detail: { cita_id: cita.id },
    });
  } catch (err) {
    console.error("[agenda] No se pudo registrar el cambio de la cita en el historial:", err);
  }
  return NextResponse.json({ ok: true });
}
