import { createAdminClient } from "@/lib/supabase/admin";
import { findOrCreateContact, findOrCreateConversation } from "@/lib/contacts";
import { runAgentTurn } from "@/lib/ai-agent/agent";
import { onMarketingInbound } from "@/lib/marketing/leads";
import { entregarPresupuestoPendiente } from "@/lib/marketing/presupuestos";
import { getAutomationPause } from "@/lib/automation-pause";
import { contactBlockReason } from "@/lib/detention";
import { ensureOpportunity, setOpportunityState } from "@/lib/opportunities";
import { registerMessageAttachments, saveInboundAttachments } from "@/lib/adjuntos/guardar";
import type { Area, ChannelType, SourceType } from "@/lib/supabase/database.types";
import { decidirRespuestaEntrante, type DecisionEntrante } from "@/lib/contacto/origen";
import { loadContactCalendar } from "@/lib/contacto/calendario";
import { registrarDetencion, solicitarAtencion } from "@/lib/captacion";
import { pideOrigenOBajaDeDatos, TEXTO_DISCULPA_DATOS } from "@/lib/agentes/automaticos";
import { agentReadiness } from "@/lib/profiles";
import { AREA_TO_RUBRO_ID } from "@/lib/rubros";
import { TEXTO_PEDIDO_TEXTO, correspondePedidoTexto, detectarFuente, identificadoresValidos } from "@/lib/fuente";
import { AutomaticSendBlockedError, sendOutboundMessage } from "@/lib/messaging";

export interface InboundResult {
  status: "guardado" | "duplicado";
  /** Qué decidió la compuerta de respuesta entrante (solo si se guardó). */
  respuesta?: DecisionEntrante;
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
  now,
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
  /** Solo pruebas: hora con la que se decide la política de respuesta. */
  now?: Date;
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
      now,
      channelType,
      metadata,
      body,
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
  now: nowParam,
  channelType,
  metadata,
  body,
}: {
  now?: Date;
  channelType?: ChannelType;
  metadata?: Record<string, unknown>;
  body?: string;
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
  let captado = false;
  try {
    const opp = await ensureOpportunity({ contactId: contact.id, conversationId: conversation.id });
    opportunityId = opp.id;
    captado = opp.row?.capture_state === "captado";
    // Fuente acreditada (2.8): la primera comprobable; nunca se pisa.
    if (opp.row && opp.row.first_source == null && "first_source" in opp.row) {
      const rubroFuente = (contact as any).rubro_id ?? AREA_TO_RUBRO_ID[area] ?? null;
      const { data: rubroCfg } = rubroFuente
        ? await supabase.from("rubros").select("*").eq("id", rubroFuente).maybeSingle()
        : { data: null as any };
      const f = detectarFuente({
        channelType: channelType ?? "whatsapp",
        metadata,
        body,
        identificadores: identificadoresValidos((rubroCfg as any)?.source_identifiers),
        contactSource: (contact as any).source ?? null,
      });
      await supabase
        .from("opportunities")
        .update({ first_source: f.fuente, first_source_detail: f.detalle, first_source_at: new Date().toISOString() })
        .eq("id", opp.id)
        .is("first_source", null);
    }
  } catch (err) {
    console.error("[oportunidad] No se pudo leer la oportunidad:", err);
  }

  // 24/10 (decisión de la responsable): un contacto detenido que vuelve a
  // escribir SÍ recibe respuesta del agente (por si dice algo relevante); la
  // detención sigue frenando campañas, seguimientos y recontactos. Solo con
  // el número de una menor o si no se pudo verificar la
  // detención, no se responde y queda para una persona.
  const block = await contactBlockReason(contact.id);
  if (block && (block.minorReported || !block.detentionId)) {
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

  // 24/10 (decisión de la responsable): «¿de dónde sacaron mi número?» o
  // «borren mis datos» → disculpa automática, sin explicar el origen (el
  // agente es asesor y no tiene ese dato; lo atiende el equipo de
  // marketing), y se detiene el contacto. No pasa a atención humana.
  // Si ya estaba detenido, la disculpa no se repite: responde el agente con la nota de contacto detenido.
  const pedidoDatos = aiReadable && !block ? pideOrigenOBajaDeDatos(body) : null;
  if (pedidoDatos) {
    await atenderPedidoDeDatos({ contact, conversation, pedido: pedidoDatos });
    result.respuesta = { responder: false, motivo: "detenido" };
    return result;
  }

  // Marketing (16/10): «Pide presupuesto» capta, pero la venta sigue con la IA
  // hasta el cierre. Si hay un presupuesto listo esperando (avisado con la
  // plantilla o programado para más tarde), se envía ahora que la ventana
  // está abierta y la IA retoma la venta en esta misma respuesta (21/10).
  if (area === "marketing") {
    try {
      if (await entregarPresupuestoPendiente(conversation.id)) (conversation as any).ai_enabled = true;
    } catch (err) {
      console.error("[presupuesto] No se pudo enviar el presupuesto pendiente:", err);
    }
    if (captado) {
      const { data: ml } = await supabase.from("marketing_leads").select("sale_stage").eq("contact_id", contact.id).maybeSingle();
      if (["presupuesto_pedido", "presupuesto_enviado"].includes((ml as any)?.sale_stage)) captado = false;
    }
  }

  // 3) Un captado que vuelve a escribir: su mensaje queda guardado y pasa a
  //    atención humana prioritaria, sin respuesta comercial automática (C12).
  if (captado && opportunityId) {
    try {
      await solicitarAtencion({
        opportunityId,
        conversationId: conversation.id,
        motivo: "mensaje_posterior_captado",
        actor: "sistema",
      });
    } catch (err) {
      console.error("[oportunidad] No se pudo pedir atención humana para el captado:", err);
    }
    result.respuesta = { responder: false, motivo: "captado_mensaje_posterior" };
    return result;
  }

  // 4) Respuesta automática según el origen «respuesta a un entrante»: 24 h
  //    si el perfil la habilitó, el agente está activo, no hay pausa y el
  //    chat no está tomado; si no, el horario general (parche 2.0, 6.3).
  const now = nowParam ?? new Date();
  const pause = await getAutomationPause();
  const rubroId = (contact as any).rubro_id ?? AREA_TO_RUBRO_ID[area] ?? null;
  let entrante24h = false;
  if (rubroId) {
    // select("*"): funciona aunque la migración 0203 todavía no esté aplicada (queda apagado).
    const { data: rubro } = await supabase.from("rubros").select("*").eq("id", rubroId).maybeSingle();
    entrante24h = (rubro as any)?.inbound_24h_enabled === true;
  }
  let agenteActivo = false;
  if (conversation.ai_enabled && !pause.aiRepliesPaused) {
    const { data: agentConfig } = await supabase.from("ai_agents").select("active").eq("area", area).maybeSingle();
    agenteActivo = !!agentConfig?.active && (await agentReadiness(area)).ready;
  }
  const { calendar } = await loadContactCalendar(now);
  const decision = decidirRespuestaEntrante(
    {
      entrante24hHabilitado: entrante24h,
      agenteActivo,
      pausaIa: pause.aiRepliesPaused,
      chatTomado: !conversation.ai_enabled,
      legible: aiReadable,
      detenido: false,
      captado: false,
      // Acaba de llegar un mensaje de la persona: la ventana del canal está abierta.
      ventanaAbierta: true,
    },
    now,
    calendar
  );
  result.respuesta = decision;
  if (!decision.responder) {
    // Adjunto que el agente no puede leer (2.6): si la IA podría responder
    // (misma compuerta, como si fuera texto), se pide que lo escriba. Como
    // mucho una vez cada 30 minutos por conversación (24/10). Sin transcripción.
    if (decision.motivo === "no_legible") {
      const comoTexto = decidirRespuestaEntrante(
        { entrante24hHabilitado: entrante24h, agenteActivo, pausaIa: pause.aiRepliesPaused, chatTomado: !conversation.ai_enabled, legible: true, detenido: false, captado: false, ventanaAbierta: true },
        now,
        calendar
      );
      if (comoTexto.responder) await pedirTexto(supabase, conversation.id, now);
    }
    return result;
  }

  await runAgentTurn(conversation.id);
  return result;
}

/**
 * Pedido sobre los datos (24/10): disculpa fija (si la IA puede responder en
 * ese chat) y detención «pidió no ser contactado». La disculpa sale antes de
 * detener: con la detención vigente ya no podría salir.
 */
async function atenderPedidoDeDatos({
  contact,
  conversation,
  pedido,
}: {
  contact: any;
  conversation: any;
  pedido: "origen" | "baja";
}) {
  const pause = await getAutomationPause();
  if (conversation.ai_enabled && !pause.aiRepliesPaused) {
    try {
      await sendOutboundMessage({ conversationId: conversation.id, senderType: "agente_ia", body: TEXTO_DISCULPA_DATOS, origin: "respuesta_entrante" });
    } catch (err) {
      if (!(err instanceof AutomaticSendBlockedError)) console.error("[datos] No se pudo enviar la disculpa:", err);
    }
  }
  try {
    await registrarDetencion({
      contactId: contact.id,
      motivo: "no_contacto",
      actor: "ia",
      nota: pedido === "origen" ? "Preguntó de dónde salieron sus datos: disculpa automática (regla 24/10)." : "Pidió la baja o el borrado de sus datos: disculpa automática (regla 24/10).",
      motivoAtencion: pedido === "origen" ? "pregunta_procedencia" : "solicitud_eliminacion",
    });
  } catch (err) {
    console.error("[datos] No se pudo registrar la detención:", err);
  }
  // Con la detención vigente no se le envían campañas, seguimientos ni recontactos; si vuelve a escribir, el agente lo atiende.
}

/**
 * Reserva del pedido de texto (una vez cada 30 min) con comparación y
 * reemplazo: si dos audios llegan juntos, solo uno cambia la marca y envía.
 */
async function pedirTexto(supabase: ReturnType<typeof createAdminClient>, conversationId: string, now: Date) {
  const { data: actual } = await supabase.from("conversations").select("text_request_at").eq("id", conversationId).maybeSingle();
  const previo: string | null = (actual as any)?.text_request_at ?? null;
  if (!correspondePedidoTexto(previo ? new Date(previo) : null, now)) return;
  let q: any = supabase.from("conversations").update({ text_request_at: now.toISOString() }).eq("id", conversationId);
  q = previo ? q.eq("text_request_at", previo) : q.is("text_request_at", null);
  const { data: reservada } = await q.select("id").maybeSingle();
  if (!reservada) return;
  try {
    await sendOutboundMessage({ conversationId, senderType: "agente_ia", body: TEXTO_PEDIDO_TEXTO, origin: "respuesta_entrante" });
  } catch (err) {
    if (!(err instanceof AutomaticSendBlockedError)) console.error("[adjuntos] No se pudo pedir el texto:", err);
  }
}
