import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppText } from "@/lib/whatsapp/client";
import { sendMetaMessage } from "@/lib/meta/client";
import type { Area, ChannelType, MessageSenderType } from "@/lib/supabase/database.types";

/**
 * Punto único de salida de mensajes: envía por el canal real (WhatsApp/IG/FB)
 * y deja registro en `messages`. Lo usan tanto el admin (respuesta manual)
 * como el agente IA.
 */
export async function sendOutboundMessage({
  conversationId,
  senderType,
  body,
}: {
  conversationId: string;
  senderType: MessageSenderType;
  body: string;
}) {
  const supabase = createAdminClient();

  const { data: conversation, error } = await supabase
    .from("conversations")
    .select("id, area, contacts(phone, contact_identities(*)), channels(type)")
    .eq("id", conversationId)
    .single();

  if (error || !conversation) {
    throw new Error(`No se encontró la conversación ${conversationId}: ${error?.message}`);
  }

  const area = conversation.area as Area;
  const channelType = (conversation as any).channels?.type as ChannelType;
  const contact = (conversation as any).contacts;

  // Identidad externa del contacto en el canal de esta conversación
  const identities: any[] = (contact?.contact_identities as any[]) ?? [];
  const identity = identities.find((i) => i.channel_type === channelType);

  if (channelType === "whatsapp") {
    const to = contact?.phone ?? identity?.external_user_id;
    if (!to) throw new Error("El contacto no tiene teléfono para WhatsApp.");
    await sendWhatsAppText(area, to, body);
  } else if (channelType === "instagram" || channelType === "facebook") {
    if (!identity) throw new Error(`El contacto no tiene identidad de ${channelType}.`);
    await sendMetaMessage(area, channelType, identity.external_user_id, body);
  } else {
    // landing / database_import: sin canal de mensajería directo todavía.
    // Se deja registrado igual para que quede en el historial.
  }

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_type: senderType,
    direction: "saliente",
    body,
  });

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
}
