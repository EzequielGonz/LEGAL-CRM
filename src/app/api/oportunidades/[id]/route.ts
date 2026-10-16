import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { setOpportunityState } from "@/lib/opportunities";
import { requireSession } from "@/lib/acceso/autorizacion";
import { CaptacionError, registrarCaptacion, registrarResultadoPosterior, registrarZona, solicitarAtencion } from "@/lib/captacion";

export const dynamic = "force-dynamic";

/**
 * Acciones manuales sobre una oportunidad (bloques 1.7 y 1.8). Son las
 * mismas desde Prospectos, Bases, Agenda, Inbox, Casos y el teléfono: hay
 * un solo registro. Cada cambio deja su evento con autor "operador"; repetir
 * la misma acción desde otra vista no cambia nada ni deja otro evento.
 *
 * body: { accion, ... }
 *  - "derivar": { destinatario?, nota? } → Derivado (solo captadas)
 *  - "no_derivar": { nota } → vuelve a No derivado
 *  - "captar": { nota } (obligatoria: qué aceptó la persona)
 *  - "perder": { motivo }
 *  - "atencion": { estado: "ia" | "requiere_humano" | "humano_en_curso" }
 *  - "seguimiento": { estado: "completado" | "caido", nota }
 *  - "revisado": { nota } → quita la marca de revisión pendiente
 *  - "resultado_posterior": { resultado, fuente, motivo?, nota?, contacto_previsto? }
 *     (solo derivadas; otra dimensión: no toca captación ni derivación)
 *  - "atencion_motivo": { motivo, nota? } → clasificación 12.2 (pausa el chat
 *     y detiene cuando corresponde)
 *  - "zona": { zona: "amba" | "fuera" | "sin_confirmar" }
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const accion = body?.accion as string;
  const nota = typeof body?.nota === "string" ? body.nota.trim().slice(0, 1000) : "";
  const supabase = createAdminClient();
  const { data: opp } = await supabase.from("opportunities").select("*").eq("id", params.id).maybeSingle();
  if (!opp) return NextResponse.json({ error: "Oportunidad no encontrada" }, { status: 404 });
  const now = new Date().toISOString();

  try {
    switch (accion) {
      case "derivar": {
        if (opp.capture_state !== "captado") {
          return NextResponse.json({ error: "Solo se deriva una oportunidad captada." }, { status: 400 });
        }
        if (opp.derivation_state === "derivado") return NextResponse.json({ ok: true, sin_cambios: true });
        const destinatario = typeof body?.destinatario === "string" ? body.destinatario.trim().slice(0, 200) || null : null;
        await setOpportunityState({
          opportunityId: opp.id,
          dimension: "derivacion",
          field: "derivation_state",
          value: "derivado",
          actor: "operador",
          reason: nota || "Marcado como Derivado desde el panel",
          extra: { derived_at: now, derived_by: "operador", derivation_recipient: destinatario, derivation_notes: nota || null },
          detail: destinatario ? { destinatario } : {},
        });
        break;
      }
      case "no_derivar": {
        if (opp.derivation_state === "no_derivado") return NextResponse.json({ ok: true, sin_cambios: true });
        if (!nota) return NextResponse.json({ error: "Escribí por qué vuelve a No derivado." }, { status: 400 });
        await setOpportunityState({
          opportunityId: opp.id,
          dimension: "derivacion",
          field: "derivation_state",
          value: "no_derivado",
          actor: "operador",
          reason: nota,
        });
        break;
      }
      case "captar": {
        if (opp.capture_state === "captado") return NextResponse.json({ ok: true, sin_cambios: true });
        if (!nota) {
          return NextResponse.json({ error: "Anotá qué aceptó la persona (la evidencia de la captación)." }, { status: 400 });
        }
        // Evento único con evidencia, advertencias y avisos internos pendientes.
        await registrarCaptacion({ opportunityId: opp.id, actor: "operador", aceptacion: true, evidencia: nota, zona: body?.zona });
        break;
      }
      case "perder": {
        if (opp.capture_state === "perdido") return NextResponse.json({ ok: true, sin_cambios: true });
        const motivo = typeof body?.motivo === "string" ? body.motivo.trim().slice(0, 300) : "";
        if (!motivo) return NextResponse.json({ error: "Escribí el motivo." }, { status: 400 });
        await setOpportunityState({
          opportunityId: opp.id,
          dimension: "captacion",
          field: "capture_state",
          value: "perdido",
          actor: "operador",
          reason: motivo,
          extra: { capture_reason: motivo },
        });
        break;
      }
      case "atencion": {
        const estado = body?.estado;
        if (!["ia", "requiere_humano", "humano_en_curso"].includes(estado)) {
          return NextResponse.json({ error: "Estado de atención inválido." }, { status: 400 });
        }
        await setOpportunityState({
          opportunityId: opp.id,
          dimension: "atencion",
          field: "attention_state",
          value: estado,
          actor: "operador",
          reason: nota || null,
        });
        // La conversación acompaña: con atención humana la IA no responde en esa conversación.
        if (opp.conversation_id) {
          await supabase
            .from("conversations")
            .update(
              estado === "ia"
                ? { ai_enabled: true }
                : // Tomar el chat anula cualquier acuse final pendiente de la IA.
                  { ai_enabled: false, ai_ack_token: null, ai_ack_expires_at: null, human_takeover_at: new Date().toISOString() }
            )
            .eq("id", opp.conversation_id);
        }
        break;
      }
      case "seguimiento": {
        // Desde la supervisión solo se cierra un seguimiento (completado o
        // caído); iniciar seguimientos automáticos es de la Etapa 2.
        const estado = body?.estado;
        if (!["completado", "caido"].includes(estado)) {
          return NextResponse.json({ error: "Estado de seguimiento inválido." }, { status: 400 });
        }
        if (opp.followup_state === estado) return NextResponse.json({ ok: true, sin_cambios: true });
        if (!nota) return NextResponse.json({ error: "Escribí una nota del seguimiento." }, { status: 400 });
        await setOpportunityState({
          opportunityId: opp.id,
          dimension: "seguimiento",
          field: "followup_state",
          value: estado,
          actor: "operador",
          reason: nota,
          extra: { followup_reason: nota, followup_next_at: null },
        });
        break;
      }
      case "revisado": {
        if (!nota) return NextResponse.json({ error: "Escribí una nota de la revisión." }, { status: 400 });
        await setOpportunityState({
          opportunityId: opp.id,
          dimension: "revision",
          field: "review_required",
          value: false as any,
          actor: "operador",
          reason: nota,
        });
        break;
      }
      case "resultado_posterior": {
        await registrarResultadoPosterior({
          opportunityId: opp.id,
          resultado: body?.resultado,
          fuente: body?.fuente,
          motivo: body?.motivo,
          nota: body?.nota,
          contactoPrevistoAt: body?.contacto_previsto,
          actor: "operador",
        });
        break;
      }
      case "atencion_motivo": {
        const r = await solicitarAtencion({ opportunityId: opp.id, motivo: body?.motivo, actor: "operador", nota: nota || null });
        return NextResponse.json({ ok: true, categoria: r.categoria, principal: r.principal, detenido: !!r.detener });
      }
      case "zona": {
        const zona = await registrarZona({ opportunityId: opp.id, zona: body?.zona, actor: "operador" });
        return NextResponse.json({ ok: true, zona });
      }
      default:
        return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
    }
  } catch (err: any) {
    if (err instanceof CaptacionError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
