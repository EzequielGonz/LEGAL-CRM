import { createAdminClient } from "@/lib/supabase/admin";
import { AutomaticSendBlockedError, sendOutboundMessage } from "@/lib/messaging";
import { setOpportunityState } from "@/lib/opportunities";
import { RUBRO_IDS, type RubroSlug } from "@/lib/rubros";
import { TEXTO_CRISIS } from "@/lib/agentes/crisis-y-enojo";

const SLUG_POR_ID: Record<string, RubroSlug> = Object.fromEntries((Object.entries(RUBRO_IDS) as [RubroSlug, string][]).map(([slug, id]) => [id, slug])) as Record<string, RubroSlug>;

/** Tipo de incidencia que muestra el cartel de urgencia del panel. */
export const INCIDENCIA_CRISIS = "crisis";

/**
 * Protocolo de crisis (15/11, decisión de la responsable). La persona habla de
 * quitarse la vida o de hacerse daño:
 * 1. Se le mandan las líneas de ayuda (texto fijo). Si la pausa general o un
 *    chat tomado por una persona frenan el envío, igual sigue el resto.
 * 2. El bot deja de responder en ese chat: lo sigue una persona.
 * 3. Se abre (o se reabre) una incidencia «crisis», que muestra el cartel de
 *    urgencia en el panel, y se avisa a los dispositivos sin datos de la persona.
 */
export async function atenderCrisis(input: {
  contact: { id: string; rubro_id?: string | null };
  conversationId: string;
  opportunityId: string | null;
  rubroId: string | null;
  messageId?: string | null;
}) {
  const supabase = createAdminClient();
  let enviado = false;
  try {
    await sendOutboundMessage({ conversationId: input.conversationId, senderType: "agente_ia", body: TEXTO_CRISIS, origin: "respuesta_entrante" });
    enviado = true;
  } catch (err) {
    if (!(err instanceof AutomaticSendBlockedError)) console.error("[crisis] No se pudo enviar el mensaje de ayuda:", err);
  }

  await supabase.from("conversations").update({ ai_enabled: false, status: "requiere_atencion_humana" }).eq("id", input.conversationId);

  if (input.opportunityId) {
    try {
      await setOpportunityState({
        opportunityId: input.opportunityId,
        dimension: "atencion",
        field: "attention_state",
        value: "requiere_humano",
        actor: "sistema",
        reason: "Crisis: la persona habló de quitarse la vida o de hacerse daño",
      });
    } catch (err) {
      console.error("[crisis] No se pudo marcar atención humana:", err);
    }
  }

  if (input.rubroId) {
    const fila = {
      rubro_id: input.rubroId,
      kind: INCIDENCIA_CRISIS,
      contact_id: input.contact.id,
      opportunity_id: input.opportunityId,
      conversation_id: input.conversationId,
      message_id: input.messageId ?? null,
      detail: { enviado_mensaje_de_ayuda: enviado },
      created_by: "sistema",
    };
    const { error } = await (supabase.from("incidences") as any).insert(fila);
    if (error && (error as any).code === "23505") {
      // Ya tuvo una: se reabre para que el cartel vuelva a aparecer.
      await (supabase.from("incidences") as any)
        .update({ status: "abierta", resolved_at: null, resolved_by: null, conversation_id: input.conversationId, message_id: input.messageId ?? null, detail: fila.detail, created_at: new Date().toISOString() })
        .eq("kind", INCIDENCIA_CRISIS)
        .eq("contact_id", input.contact.id);
    } else if (error) {
      console.error("[crisis] No se pudo abrir la incidencia:", error.message);
    }
  }

  try {
    const slug = input.rubroId ? SLUG_POR_ID[input.rubroId] ?? null : null;
    const { sendToDevices } = await import("@/lib/push");
    await sendToDevices({
      title: "URGENTE: una persona en crisis",
      body: enviado ? "Le mandamos las líneas de ayuda. Abrí el panel para seguirla." : "No se pudo mandar el mensaje de ayuda. Abrí el panel ya.",
      url: slug ? `/incidencias?perfil=${slug}` : "/perfiles",
      tag: "crisis",
      kind: "aviso",
      eventKey: `crisis:${input.conversationId}:${new Date().toISOString().slice(0, 13)}`,
    });
  } catch (err) {
    console.error("[crisis] No se pudo avisar a los dispositivos:", err);
  }
  return { enviado };
}
