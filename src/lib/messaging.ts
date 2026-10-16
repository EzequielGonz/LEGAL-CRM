import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppText } from "@/lib/whatsapp/client";
import { sendMetaMessage } from "@/lib/meta/client";
import { assertAutomaticContactAllowed, manualContactCheck } from "@/lib/detention";
import type { Area, ChannelType, MessageSenderType } from "@/lib/supabase/database.types";
import { getAutomationPause } from "@/lib/automation-pause";
import { loadContactCalendar } from "@/lib/contacto/calendario";
import { isContactAllowed } from "@/lib/contacto/reglas";
import { politicaPorOrigen, type OrigenTarea } from "@/lib/contacto/origen";

/**
 * Una salida automática no se hizo porque, al revalidar inmediatamente antes
 * de enviar, ya no correspondía (pausa general, chat tomado por una persona,
 * acuse no autorizado). No es una falla: el mensaje simplemente no sale.
 */
export class AutomaticSendBlockedError extends Error {
  reason: string;
  constructor(reason: string, detail?: string) {
    super(
      reason === "pausa_general"
        ? "Pausa general de respuestas de la IA activa: no se envió."
        : reason === "pausa_envios"
        ? "Pausa general de envíos automáticos activa: no se envió."
        : reason === "fuera_de_horario"
        ? "Fuera de la franja de lunes a sábado de 8 a 21: no se envió."
        : reason === "chat_pausado"
        ? "El chat está tomado por una persona: la respuesta de la IA no se envió."
        : reason === "acuse_no_autorizado"
        ? "El acuse final no tiene un permiso vigente: no se envió."
        : `Salida automática bloqueada (${reason})${detail ? `: ${detail}` : ""}.`
    );
    this.name = "AutomaticSendBlockedError";
    this.reason = reason;
  }
}

/**
 * Guarda un mensaje con su origen. Si la base todavía no tiene la columna
 * `origin` (migración 0203 sin aplicar), lo guarda igual sin ella: el
 * historial nunca se pierde por el orden de publicación.
 */
export async function insertMessageRow(
  supabase: ReturnType<typeof createAdminClient>,
  row: Record<string, unknown>,
  opts: { select?: string } = {}
): Promise<{ data: any; error: any }> {
  const run = (r: Record<string, unknown>) => {
    const q: any = supabase.from("messages").insert(r);
    return opts.select ? q.select(opts.select).maybeSingle() : q;
  };
  let res = await run(row);
  if (res.error && "origin" in row && isMissingColumn(res.error, "origin")) {
    const { origin: _omit, ...rest } = row;
    res = await run(rest);
  }
  return res;
}

export function isMissingColumn(error: { code?: string; message?: string } | null | undefined, column: string): boolean {
  if (!error) return false;
  const msg = String(error.message ?? "");
  return (error.code === "PGRST204" || error.code === "42703") && msg.includes(column);
}

/**
 * Punto único de salida de mensajes: envía por el canal real (WhatsApp/IG/FB)
 * y deja registro en `messages`. Lo usan tanto el admin (respuesta manual)
 * como el agente IA.
 *
 * - Envío manual (admin): el chat pasa a atención humana ANTES de enviar
 *   (claim_manual_send), así una respuesta de la IA en curso ya no puede
 *   salir encima.
 * - Salida automática (IA): inmediatamente antes de enviar se revalida en
 *   la base, con la fila de la conversación bloqueada, la pausa general y
 *   que el chat no esté tomado por una persona (claim_ai_send). El acuse
 *   final después de derivar a una persona solo sale con el permiso de un
 *   solo uso que otorga grant_ai_final_ack (finalAckToken).
 */
export async function sendOutboundMessage({
  conversationId,
  senderType,
  body,
  finalAckToken = null,
  origin,
  clock = () => new Date(),
}: {
  conversationId: string;
  senderType: MessageSenderType;
  body: string;
  /** permiso de un solo uso para el acuse final de la IA tras derivar a una persona */
  finalAckToken?: string | null;
  /**
   * Origen de la salida (parche 2.0, 6.3). Por defecto: atención humana si
   * escribe una persona y respuesta a un entrante si escribe la IA. Las
   * salidas iniciadas por la empresa (inicio de cita, reagendamiento…)
   * revalidan acá la pausa de envíos y la franja lunes a sábado 8–21.
   */
  origin?: OrigenTarea;
  clock?: () => Date;
}) {
  const supabase = createAdminClient();
  const origen: OrigenTarea = origin ?? (senderType === "admin" ? "atencion_humana" : "respuesta_entrante");
  if (senderType === "admin" && origen !== "atencion_humana") {
    throw new Error("Un envío manual siempre tiene origen «atención humana».");
  }
  if (senderType !== "admin" && origen === "atencion_humana") {
    throw new AutomaticSendBlockedError("origen_no_automatico");
  }
  if (politicaPorOrigen(origen) === "salida_empresa") {
    const pause = await getAutomationPause();
    if (pause.outboundPaused) throw new AutomaticSendBlockedError("pausa_envios");
    const { calendar } = await loadContactCalendar(clock());
    if (!isContactAllowed(clock(), calendar)) throw new AutomaticSendBlockedError("fuera_de_horario");
  }

  const { data: conversation, error } = await supabase
    .from("conversations")
    .select("id, area, contact_id, line_id, contacts(phone, contact_identities(*)), channels(type), profile_lines(credential_key, active)")
    .eq("id", conversationId)
    .single();

  if (error || !conversation) {
    throw new Error(`No se encontró la conversación ${conversationId}: ${error?.message}`);
  }

  const area = conversation.area as Area;
  const channelType = (conversation as any).channels?.type as ChannelType;
  const contact = (conversation as any).contacts;
  const contactId = (conversation as any).contact_id as string;

  // Detención persistente: nada automático a un contacto detenido; a mano,
  // todo salvo un pedido de no contacto o el número de una menor (en esos
  // casos solo si la persona volvió a escribir).
  if (senderType === "admin") {
    // La persona toma el chat antes de enviar (y se anula cualquier acuse
    // pendiente de la IA).
    const { error: takeoverError } = await supabase.rpc("claim_manual_send", { p_conversation: conversationId });
    if (takeoverError) throw new Error(`No se pudo pausar el chat antes de enviar: ${takeoverError.message}`);
    const check = await manualContactCheck(contactId, conversationId);
    if (!check.allowed) throw new Error(check.reason ?? "Contacto detenido.");
  } else {
    await assertAutomaticContactAllowed(contactId);
    // Revalidación atómica inmediatamente antes de enviar.
    const { data: gate, error: gateError } = await supabase.rpc("claim_ai_send", {
      p_conversation: conversationId,
      p_ack_token: finalAckToken,
    });
    if (gateError) throw new AutomaticSendBlockedError("error_compuerta", gateError.message);
    if (gate !== "ok") throw new AutomaticSendBlockedError(String(gate));
  }

  // Identidad externa del contacto en el canal de esta conversación
  const identities: any[] = (contact?.contact_identities as any[]) ?? [];
  const identity = identities.find((i) => i.channel_type === channelType);

  // Id que devuelve el proveedor: permite guardar después si se entregó y se leyó.
  let externalId: string | null = null;
  if (channelType === "whatsapp") {
    const to = contact?.phone ?? identity?.external_user_id;
    if (!to) throw new Error("El contacto no tiene teléfono para WhatsApp.");
    // Se responde por la misma línea de la conversación (si se conoce y está
    // activa); si no, por la conexión de siempre del área.
    const line = (conversation as any).profile_lines;
    const credentialKey = line && line.active ? (line.credential_key as string) : null;
    const result: any = await sendWhatsAppText(area, to, body, { credentialKey });
    externalId = result?.messages?.[0]?.id ?? null;
  } else if (channelType === "instagram" || channelType === "facebook") {
    if (!identity) throw new Error(`El contacto no tiene identidad de ${channelType}.`);
    const result: any = await sendMetaMessage(area, channelType, identity.external_user_id, body);
    externalId = result?.message_id ?? null;
  } else {
    // landing / database_import: sin canal de mensajería directo todavía.
    // Se deja registrado igual para que quede en el historial.
  }

  const sentAt = new Date().toISOString();
  const { data: saved } = await insertMessageRow(supabase, {
    conversation_id: conversationId,
    sender_type: senderType,
    direction: "saliente",
    body,
    external_message_id: externalId,
    delivery_status: externalId ? "enviado" : null,
    delivery_status_at: externalId ? sentAt : null,
    origin: origen,
  }, { select: "id, created_at" });

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
  // La oportunidad pasa a "Contactado" desde la base (disparador de mensajes).
  return { messageId: (saved?.id as string | undefined) ?? null, externalId, sentAt };
}
