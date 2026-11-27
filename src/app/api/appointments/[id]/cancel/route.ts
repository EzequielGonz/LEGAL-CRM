import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/acceso/autorizacion";
import { esUuid } from "@/lib/rutas/comprobar";
import { respuestaErrorInterno } from "@/lib/error-publico";
import { motivoCambioDeCitaNoPermitido } from "@/lib/agenda-vista";
import { ensureOpportunity, logOpportunityEvent } from "@/lib/opportunities";

/**
 * Cancela una cita (botón de la ficha del prospecto). 27/11 (auditoría): usa
 * las mismas reglas que la Agenda (`accionesDeCita`): una cita realizada o
 * ausente no se cancela, y repetir la cancelación no cambia nada. Deja el
 * cambio en el historial de la oportunidad, como la ruta de estados.
 */
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (!esUuid(params.id)) return NextResponse.json({ error: "Cita no válida." }, { status: 400 });
  const supabase = createAdminClient();
  const { data: citaRaw, error: errLectura } = await supabase
    .from("appointments")
    .select("id, status, kind, contact_id, conversation_id, starts_at" as any)
    .eq("id", params.id)
    .maybeSingle();
  if (errLectura) return respuestaErrorInterno(errLectura, "appointments/[id]/cancel");
  if (!citaRaw) return NextResponse.json({ error: "Esa cita no existe." }, { status: 404 });
  const cita = citaRaw as unknown as { id: string; status: string; kind?: string | null; contact_id: string; conversation_id: string | null; starts_at: string };
  if (cita.status === "cancelada") return NextResponse.json({ ok: true, sin_cambios: true });
  const motivo = motivoCambioDeCitaNoPermitido(cita, "cancelada");
  if (motivo) return NextResponse.json({ error: motivo }, { status: 409 });

  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "cancelada" })
    .eq("id", cita.id)
    .eq("status", cita.status as any)
    .select("id");
  if (error) return respuestaErrorInterno(error, "appointments/[id]/cancel");
  if (!(data ?? []).length) return NextResponse.json({ error: "La cita cambió mientras tanto. Actualizá la pantalla y probá de nuevo." }, { status: 409 });

  try {
    const opp = await ensureOpportunity({ contactId: cita.contact_id, conversationId: cita.conversation_id, actor: "operador" });
    await logOpportunityEvent({
      opportunityId: opp.id,
      actor: "operador",
      dimension: "ficha",
      from: `cita ${cita.status}`,
      to: "cita cancelada",
      reason: `Cita del ${new Date(cita.starts_at).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}`,
      detail: { cita_id: cita.id },
    });
  } catch (err) {
    console.error("[agenda] No se pudo registrar la cancelación de la cita en el historial:", err);
  }
  return NextResponse.json({ ok: true });
}
