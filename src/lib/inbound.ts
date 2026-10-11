import { createAdminClient } from "@/lib/supabase/admin";
import { findOrCreateContact, findOrCreateConversation } from "@/lib/contacts";
import { runAgentTurn } from "@/lib/ai-agent/agent";
import { onMarketingInbound } from "@/lib/marketing/leads";
import { getAutomationPause } from "@/lib/automation-pause";
import { contactBlockReason } from "@/lib/detention";
import { ensureOpportunity, setOpportunityState } from "@/lib/opportunities";
import { registerMessageAttachments, saveInboundAttachments } from "@/lib/adjuntos/guardar";
import type { Area, ChannelType, SourceType } from "@/lib/supabase/database.types";

export interface InboundResult {
  status: "guardado" | "duplicado";
  messageId?: string;
  conversationId?: string;
  contactId?: string;
}

/**
 * Punto único de entrada para CUALQUIER mensaje entrante (WhatsApp,
 * Instagram, Facebook): deduplica por id del proveedor, guarda el mensaje
 * (de cualquier tipo) y recién después actualiza estados y, si corresponde,
 * le pasa el turno al agente IA.
 *
 * El mensaje se guarda SIEMPRE, aunque la IA o los envíos estén en pausa:
 * así queda visible en el Inbox para atención manual.
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
  messageType = "text",
  metadata = {},
  aiReadable = true,
  lineId = null,
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
  /** text | button | interactive | image | audio | document | location | ... */
  messageType?: string;
  metadata?: Record<string, unknown>;
  /** false para tipos que el agente no puede leer (audio, imagen, etc.). */
  aiReadable?: boolean;
  /** Línea registrada por la que llegó (para responder por la misma). */
  lineId?: string | null;
}): Promise<InboundResult> {
  const supabase = createAdminClient();

  // 1) Deduplicación: Meta puede reenviar el mismo mensaje. Si ya está, no
  //    se repite nada (ni el guardado, ni los cambios de estado, ni la IA).
  if (externalMessageId) {
    const { data: existing } = await supabase
      .from("messages")
      .select("id, conversation_id")
      .eq("external_message_id", externalMessageId)
      .is("duplicate_of", null)
      .limit(1)
      .maybeSingle();
    if (existing) {
      return { status: "duplicado", messageId: existing.id, conversationId: existing.conversation_id };
    }
  }

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

  // 2) Guardar el mensaje. Si otra entrega simultánea del mismo mensaje
  //    llegó primero, el índice único lo rechaza y se corta acá.
  const { data: inserted, error: insertError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversation.id,
      sender_type: "prospecto",
      direction: "entrante",
      body,
      external_message_id: externalMessageId ?? null,
      message_type: messageType,
      metadata,
    })
    .select("id")
    .single();

  if (insertError) {
    if ((insertError as any).code === "23505") {
      return { status: "duplicado", conversationId: conversation.id, contactId: contact.id };
    }
    throw new Error(`No se pudo guardar el mensaje entrante: ${insertError.message}`);
  }

  // Originales de audios, fotos, videos y documentos: se registran ahora y
  // se guardan en el almacenamiento privado al final (con tope de tiempo y
  // tamaño; lo que no entra se guarda al abrirlo). Nunca frena el guardado
  // del mensaje. Sin transcripción ni respuesta automática.
  let attachmentIds: string[] = [];
  if (inserted?.id) {
    try {
      attachmentIds = await registerMessageAttachments({
        messageId: inserted.id,
        conversationId: conversation.id,
        contactId: contact.id,
        area,
        channelType,
        messageType,
        metadata,
        lineId: lineId ?? conversation.line_id ?? null,
        rubroId: (contact as any).rubro_id ?? null,
      });
    } catch (err) {
      console.error("[adjuntos] No se pudo registrar el adjunto:", err);
    }
  }

  try {
    return await afterInboundSaved({
      supabase,
      area,
      contact,
      conversation,
      insertedId: inserted?.id,
      lineId,
      aiReadable,
    });
  } finally {
    if (attachmentIds.length) await saveInboundAttachments(attachmentIds);
  }
}

/** Lo que sigue a guardar un mensaje entrante: estados, oportunidad y, si corresponde, la IA. */
async function afterInboundSaved({
  supabase,
  area,
  contact,
  conversation,
  insertedId,
  lineId,
  aiReadable,
}: {
  supabase: ReturnType<typeof createAdminClient>;
  area: Area;
  contact: any;
  conversation: any;
  insertedId: string | undefined;
  lineId: string | null;
  aiReadable: boolean;
}): Promise<InboundResult> {
  // Sale de "nuevo" y también de "esperando_respuesta_prospecto" (estado en el
  // que queda una conversación recién iniciada por una campaña).
  await supabase
    .from("conversations")
    .update({
      last_message_at: new Date().toISOString(),
      status: ["nuevo", "esperando_respuesta_prospecto"].includes(conversation.status)
        ? "en_conversacion"
        : conversation.status,
      ...(lineId && !conversation.line_id ? { line_id: lineId } : {}),
    })
    .eq("id", conversation.id);

  // Si este contacto venía de una campaña y todavía no había respondido, lo
  // marcamos (se busca por contact_id: un contacto llegado vía Bases puede
  // tener una fila en campaign_contacts sin campaign_id en el contacto).
  // También los que estaban "a revisar" (no se sabía si Meta había aceptado
  // el envío): que la persona responda confirma que el mensaje llegó.
  await supabase
    .from("campaign_contacts")
    .update({ status: "respondio", responded_at: new Date().toISOString() })
    .eq("contact_id", contact.id)
    .in("status", ["enviado", "entregado", "leido", "revisar"]);

  // Marketing: registra la respuesta en el pipeline de prospección. Nunca
  // debe frenar el guardado del mensaje.
  if (area === "marketing") {
    try {
      await onMarketingInbound({ id: contact.id, source: contact.source });
    } catch (err) {
      console.error("[marketing] No se pudo registrar el mensaje entrante en el pipeline:", err);
    }
  }

  const result: InboundResult = {
    status: "guardado",
    messageId: insertedId,
    conversationId: conversation.id,
    contactId: contact.id,
  };

  // La oportunidad ya quedó en "Respondió" desde la base (disparador de
  // mensajes); acá solo se busca para marcar atención humana si hace falta.
  let opportunityId: string | null = null;
  try {
    opportunityId = (await ensureOpportunity({ contactId: contact.id, conversationId: conversation.id })).id;
  } catch (err) {
    console.error("[oportunidad] No se pudo leer la oportunidad:", err);
  }

  // Un contacto detenido que vuelve a escribir no recibe respuesta
  // automática: queda marcado para que lo atienda una persona.
  const block = await contactBlockReason(contact.id);
  if (block) {
    if (opportunityId) {
      try {
        await setOpportunityState({
          opportunityId,
          dimension: "atencion",
          field: "attention_state",
          value: "requiere_humano",
          actor: "sistema",
          reason: `Escribió un contacto detenido (${block.label})`,
        });
      } catch (err) {
        console.error("[oportunidad] No se pudo marcar atención humana:", err);
      }
    }
    return result;
  }

  // 3) Respuesta automática: solo si la conversación la tiene habilitada, el
  //    mensaje es legible para el agente y la pausa general no está activa.
  if (!conversation.ai_enabled || !aiReadable) return result;
  const pause = await getAutomationPause();
  if (pause.aiRepliesPaused) return result;

  await runAgentTurn(conversation.id);
  return result;
}
