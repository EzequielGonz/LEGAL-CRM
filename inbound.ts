import { createAdminClient } from "@/lib/supabase/admin";
import { findOrCreateContact, findOrCreateConversation } from "@/lib/contacts";
import { runAgentTurn } from "@/lib/ai-agent/agent";
import { onMarketingInbound } from "@/lib/marketing/leads";
import type { Area, ChannelType, SourceType } from "@/lib/supabase/database.types";

/**
 * Punto único de entrada para CUALQUIER mensaje entrante (WhatsApp,
 * Instagram, Facebook): normaliza, deduplica el contacto, guarda el mensaje
 * y dispara al agente IA correspondiente si está habilitado.
 */
export async function handleInboundMessage({
  area,
  channelType,
  externalUserId,
  phone,
  fullName,
  body,
  isButtonClick,
  externalMessageId,
}: {
  area: Area;
  channelType: ChannelType;
  externalUserId: string;
  phone?: string | null;
  fullName?: string | null;
  body: string;
  /** true si vino de un botón de respuesta rápida de plantilla (no de texto libre). */
  isButtonClick?: boolean;
  externalMessageId?: string;
}) {
  const supabase = createAdminClient();

  const { data: channel } = await supabase
    .from("channels")
    .select("*")
    .eq("area", area)
    .eq("type", channelType)
    .single();

  if (!channel) throw new Error(`No existe el canal ${channelType} para el área ${area}`);

  const source: SourceType =
    channelType === "whatsapp"
      ? "organico_whatsapp"
      : channelType === "instagram"
      ? "organico_instagram"
      : "organico_facebook";

  const { contact } = await findOrCreateContact({
    area,
    channelType,
    externalUserId,
    phone: phone ?? (channelType === "whatsapp" ? externalUserId : null),
    fullName,
    source,
    channelId: channel.id,
  });

  const conversation = await findOrCreateConversation({
    contactId: contact.id,
    channelId: channel.id,
    area,
  });

  await supabase.from("messages").insert({
    conversation_id: conversation.id,
    sender_type: "prospecto",
    direction: "entrante",
    body,
    external_message_id: externalMessageId,
  });

  // Sale de "nuevo" y también de "esperando_respuesta_prospecto" (estado en el
  // que queda una conversación recién iniciada por una campaña): si no,
  // después de que el prospecto responde a una campaña la conversación se
  // queda trabada en ese estado para siempre, aunque el contacto ya haya
  // pasado a "en_conversacion".
  await supabase
    .from("conversations")
    .update({
      last_message_at: new Date().toISOString(),
      status: ["nuevo", "esperando_respuesta_prospecto"].includes(conversation.status)
        ? "en_conversacion"
        : conversation.status,
    })
    .eq("id", conversation.id);

  // Si este contacto venía de una campaña y todavía no había respondido, lo
  // marcamos. Se busca por contact_id sin filtrar por campaign_id porque
  // `contacts.campaign_id` solo se completa cuando el contacto se creó
  // directamente desde una importación de campaña vieja — un contacto que
  // llegó vía Bases y se agregó después a una campaña no lo tiene seteado,
  // pero igual puede tener una fila pendiente en campaign_contacts.
  await supabase
    .from("campaign_contacts")
    .update({ status: "respondio", responded_at: new Date().toISOString() })
    .eq("contact_id", contact.id)
    .in("status", ["enviado", "entregado", "leido"]);

  // Marketing: registra la respuesta en el pipeline de prospección. Si el
  // contacto no tenía lead es una consulta DIRECTA y se crea uno (con su
  // fuente); si estaba contactado o en seguimiento pasa a "respondió" y se
  // cancelan los recordatorios pendientes. Nunca debe frenar la respuesta.
  if (area === "marketing") {
    try {
      await onMarketingInbound({ id: contact.id, source: contact.source });
    } catch (err) {
      console.error("[marketing] No se pudo registrar el mensaje entrante en el pipeline:", err);
    }
  }

  // Antes, acá se corría un cuestionario fijo (botones "Mi caso esta
  // pendiente" / "Mi caso ya esta resuelto" + preguntas numeradas, ver
  // intake-flow.ts). Ya no: toda respuesta —incluso el toque de un botón de una
  // plantilla vieja, que llega como texto— la atiende el agente IA, con una
  // charla natural definida en su prompt (panel Agentes IA).
  if (conversation.ai_enabled) {
    await runAgentTurn(conversation.id);
  }
}
