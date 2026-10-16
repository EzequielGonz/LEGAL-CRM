import { insertMessageRow } from "@/lib/messaging";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppTemplate } from "@/lib/whatsapp/client";
import { findOrCreateConversation } from "@/lib/contacts";
import { AUTO_CAMPAIGN_NAME, pickNextMarketingContact } from "@/lib/marketing/outreach";
import { markLeadContacted } from "@/lib/marketing/leads";
import { assertOutboundAllowed, getAutomationPause } from "@/lib/automation-pause";
import { contactBlockReason } from "@/lib/detention";
import { campaignReadiness, getProfile } from "@/lib/profiles";
import { buildBodyParameters } from "@/lib/plantillas/catalogo";
import { confirmTemplateLive, recordTemplateSendError } from "@/lib/plantillas";
import { classifySendFailure, failureNote, MAX_TRANSIENT_ATTEMPTS } from "@/lib/envios/errores";
import { randomUUID } from "node:crypto";
import { effectiveSendHours, getSendWindow, startOfArgentinaDay } from "@/lib/horario";
import { loadContactCalendar } from "@/lib/contacto/calendario";

// El horario vive en src/lib/horario.ts (sin dependencias, se prueba solo); se
// sigue exportando desde acá para quien ya lo importaba de este archivo.
export { effectiveSendHours, getSendWindow, startOfArgentinaDay };

/**
 * Motor de envío de campañas — modelo "a pasos" (tick-based).
 *
 * Por qué no es un loop síncrono: las funciones serverless de Vercel tienen
 * un tiempo máximo de ejecución (10-60s en plan Hobby, hasta 300s en Pro).
 * El ritmo que necesitamos para no generar bloqueos de WhatsApp — 1 mensaje
 * nuevo cada tanto (un número al azar entre `min_send_delay_seconds` y
 * `max_send_delay_seconds`, para que no sea siempre el mismo intervalo
 * exacto y así se parezca más a una persona mandando mensajes a mano), en
 * lotes de 10, con una pausa de 5 minutos entre lote y lote — implica que
 * una campaña real puede tardar horas en terminar. Ninguna función
 * serverless puede quedarse "despierta" tanto tiempo dentro de una sola
 * request.
 *
 * En cambio: cada invocación de `tickCampaign` manda COMO MÁXIMO un mensaje
 * (o ninguno, si todavía no le toca por el ritmo configurado) y guarda en la
 * fila de `campaigns` el estado necesario para saber cuándo le toca el
 * próximo (`last_sent_at`, `sent_in_batch`, `batch_paused_until`). Algo
 * externo (un cron gratuito que pega a `/api/campaigns/tick` cada 1 minuto,
 * ver docs/SETUP.md) es quien "hace latir" el envío. Así cada request dura
 * milisegundos, sin importar cuántas horas tarde la campaña completa.
 */

// La plantilla sale del catálogo (pregunta 22): nombre, idioma y variables
// tal como los informa Meta. Cada variable se completa con la fuente que se
// eligió al asignarla a la línea (nombre del contacto, nombre de
// presentación o nombre del perfil o marca, cargados a mano en el perfil).
// Si falta un dato, ese envío no sale: nunca se manda una variable vacía.

/**
 * Devuelve un entero al azar entre min y max (ambos inclusive). Se usa para
 * que el tiempo entre mensajes no sea siempre el mismo número exacto — así
 * el envío se parece más al ritmo irregular de una persona mandando
 * mensajes a mano, en vez de un número fijo repetido cientos de veces
 * seguidas (un patrón fácil de detectar).
 */
export function randomInt(min: number, max: number): number {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

export class CampaignNotReadyError extends Error {
  missing: string[];
  constructor(missing: string[]) {
    super(`Falta configurar antes de lanzar: ${missing.join("; ")}.`);
    this.name = "CampaignNotReadyError";
    this.missing = missing;
  }
}

export interface TickResult {
  campaignId: string;
  action:
    | "sent"
    | "failed_send"
    | "waiting_interval"
    | "batch_pause"
    | "daily_limit_reached"
    | "outside_send_window"
    | "finished"
    | "not_running"
    /** otra ejecución está procesando esta campaña (no se hizo nada) */
    | "busy";
  detail?: string;
}

/** Vigencia del bloqueo por campaña (segundos): vence solo si la ejecución se corta. */
export const TICK_LOCK_SECONDS = 120;
/** Una reserva más vieja que esto se considera cortada (segundos). */
export const CLAIM_LEASE_SECONDS = 600;

interface ClaimedRecipient {
  id: string;
  contact_id: string;
  full_name: string | null;
  phone: string | null;
  attempts: number;
}

type FinishStatus = "enviado" | "fallo" | "opt_out" | "pendiente" | "revisar";

/**
 * Cierra la reserva de un destinatario con su resultado. Solo quien tiene
 * la reserva (token) puede cerrarla. Reintenta ante fallas al guardar; si
 * igual no se puede, la fila queda reservada y la recuperación la pasa a
 * revisión (si ya se había llamado a Meta) o de vuelta a la cola (si no).
 */
export async function finishClaim(
  supabase: ReturnType<typeof createAdminClient>,
  claimId: string,
  token: string,
  status: FinishStatus,
  opts: { messageId?: string | null; error?: string | null; uncertain?: boolean } = {},
  retries = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const { data, error } = await supabase.rpc("campaign_finish_send", {
      p_campaign_contact: claimId,
      p_token: token,
      p_status: status,
      p_message_id: opts.messageId ?? null,
      p_error: opts.error ?? null,
      p_uncertain: opts.uncertain ?? false,
    });
    if (!error) return data === true;
    console.error(`[campaigns] No se pudo guardar el resultado (${status}) del destinatario ${claimId}, intento ${attempt}:`, error.message);
    if (attempt < retries) await new Promise((r) => setTimeout(r, 200 * attempt * attempt));
  }
  return false;
}

/**
 * Intenta avanzar UNA campaña un paso: manda un mensaje si ya le toca según
 * el ritmo configurado, o no hace nada y explica por qué en `detail`.
 * Nunca bloquea esperando — siempre vuelve casi al instante.
 *
 * Concurrencia: una sola ejecución por campaña (bloqueo con vencimiento) y
 * una sola por destinatario (reserva atómica en la base). Dos ticks
 * simultáneos nunca le envían dos veces a la misma persona.
 */
export async function tickCampaign(
  campaignId: string,
  /** `now`: hora de referencia para horario, días y ritmo (solo pruebas; por defecto, la actual). */
  opts: { now?: Date } = {}
): Promise<TickResult> {
  const supabase = createAdminClient();
  const token = randomUUID();
  const { data: locked, error: lockError } = await supabase.rpc("campaign_tick_lock", {
    p_campaign: campaignId,
    p_token: token,
    p_seconds: TICK_LOCK_SECONDS,
  });
  if (lockError) {
    return { campaignId, action: "not_running", detail: `No se pudo tomar el bloqueo de la campaña: ${lockError.message}` };
  }
  if (locked !== true) {
    return { campaignId, action: "busy", detail: "Otra ejecución está procesando esta campaña." };
  }
  try {
    // Reservas que quedaron de una ejecución cortada: sin marca de inicio
    // vuelven a la cola; con marca, a revisión (no se reenvían solas).
    await supabase.rpc("campaign_recover_stale", { p_campaign: campaignId, p_lease_seconds: CLAIM_LEASE_SECONDS });
    return await tickLocked(supabase, campaignId, token, opts.now ?? new Date());
  } finally {
    await supabase.rpc("campaign_tick_unlock", { p_campaign: campaignId, p_token: token });
  }
}

async function tickLocked(
  supabase: ReturnType<typeof createAdminClient>,
  campaignId: string,
  token: string,
  now: Date
): Promise<TickResult> {
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (campaignError || !campaign) {
    return { campaignId, action: "not_running", detail: "Campaña no encontrada" };
  }

  if (campaign.status !== "en_curso") {
    return { campaignId, action: "not_running", detail: `Estado actual: ${campaign.status}` };
  }

  // Pausa general (Configuración → Pausa general): no sale ningún envío
  // automático. La campaña conserva su cola, su ritmo y sus contadores.
  const pause = await getAutomationPause();
  if (pause.outboundPaused) {
    return { campaignId, action: "not_running", detail: "Pausa general de envíos automáticos activa" };
  }
  if (campaign.archived_at) {
    return { campaignId, action: "not_running", detail: "Campaña archivada" };
  }
  // Días de ejecución (1 = lunes … 6 = sábado, hora Argentina; los domingos no se envía).
  if (Array.isArray(campaign.run_days) && campaign.run_days.length > 0) {
    const artDay = new Date(now.getTime() - 3 * 60 * 60 * 1000).getUTCDay(); // 0 = domingo
    const isoDay = artDay === 0 ? 7 : artDay;
    if (!campaign.run_days.includes(isoDay)) {
      return { campaignId, action: "outside_send_window", detail: "Hoy no es un día de ejecución de esta campaña." };
    }
  }
  // Configuración del perfil, línea asignada (bloque 1.4) y plantilla del
  // catálogo (pregunta 22): si falta algo, no envía y el envío queda pendiente.
  const readiness = await campaignReadiness(campaign);
  if (!readiness.ready || !readiness.line || !readiness.template) {
    return { campaignId, action: "not_running", detail: `Falta configurar: ${readiness.missing.join("; ")}` };
  }
  const line = readiness.line;
  const resolved = readiness.template;
  const template = resolved.template;
  // Límite diario de la línea (sumando todas las campañas que la usan).
  if (line.daily_limit) {
    const { data: lineCampaigns } = await supabase.from("campaigns").select("id").eq("line_id", line.id);
    const { count: sentByLine } = await supabase
      .from("campaign_contacts")
      .select("id", { count: "exact", head: true })
      .in("campaign_id", (lineCampaigns ?? []).map((c: any) => c.id))
      .in("status", ["enviado", "entregado", "leido", "respondio"])
      .gte("sent_at", startOfArgentinaDay(now).toISOString());
    if ((sentByLine ?? 0) >= line.daily_limit) {
      return { campaignId, action: "daily_limit_reached", detail: `La línea «${line.label}» llegó a su límite de ${line.daily_limit} envíos por hoy.` };
    }
  }
  const profile = await getProfile(line.rubro_id);
  const senderName = profile?.agent_presentation_name?.trim() ?? "";
  const brandName = profile?.brand_name?.trim() ?? "";

  // 0) ¿Estamos dentro del horario permitido de envío? No tocamos el
  // ritmo/pacing acá: apenas vuelva a estar en horario, la campaña sigue
  // exactamente donde había quedado (no hace falta "Reanudar" a mano cada
  // mañana, se despierta sola).
  // Calendario de contacto (bloque 2.0): si no se puede leer, no se envía.
  const contactCalendar = await loadContactCalendar(now);
  if (contactCalendar.error) {
    return { campaignId, action: "not_running", detail: contactCalendar.error };
  }
  const sendWindow = getSendWindow(campaign, now, contactCalendar.calendar.exceptions);
  if (!sendWindow.withinWindow) {
    const hours = effectiveSendHours(campaign);
    return {
      campaignId,
      action: "outside_send_window",
      detail: `Fuera del horario permitido (lunes a sábado, ${hours.start}-${hours.end}hs, Argentina, con las excepciones del calendario). Reanuda el ${sendWindow.opensAt.toLocaleString(
        "es-AR",
        { timeZone: "America/Argentina/Buenos_Aires", weekday: "long", hour: "2-digit", minute: "2-digit" }
      )}.`,
    };
  }

  // 1) ¿Está en la pausa larga entre lotes?
  if (campaign.batch_paused_until) {
    const pausedUntil = new Date(campaign.batch_paused_until);
    if (now < pausedUntil) {
      return {
        campaignId,
        action: "batch_pause",
        detail: `En pausa entre lotes hasta ${pausedUntil.toLocaleTimeString("es-AR")}`,
      };
    }
    // Ya pasó la pausa: la cerramos y arrancamos un lote nuevo.
    await supabase
      .from("campaigns")
      .update({ batch_paused_until: null, sent_in_batch: 0 })
      .eq("id", campaignId);
    campaign.batch_paused_until = null;
    campaign.sent_in_batch = 0;
  }

  // 2) ¿Llegó al límite diario?
  if (campaign.daily_send_limit) {
    const startOfToday = startOfArgentinaDay(now);

    const { count: sentToday } = await supabase
      .from("campaign_contacts")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .in("status", ["enviado", "entregado", "leido", "respondio"])
      .gte("sent_at", startOfToday.toISOString());

    if ((sentToday ?? 0) >= campaign.daily_send_limit) {
      await supabase
        .from("campaigns")
        .update({ status: "pausada", pause_reason: "Límite diario alcanzado", paused_at: new Date().toISOString() })
        .eq("id", campaignId);
      return { campaignId, action: "daily_limit_reached" };
    }
  }

  // 3) ¿Ya pasó el intervalo (al azar, entre min y max) desde el último
  // mensaje? `next_delay_seconds` es el número que se sorteó la vez pasada
  // específicamente para esta espera; si todavía no hay ninguno sorteado
  // (primer mensaje de la campaña) usamos el mínimo configurado.
  if (campaign.last_sent_at) {
    const elapsedMs = now.getTime() - new Date(campaign.last_sent_at).getTime();
    const neededMs = (campaign.next_delay_seconds ?? campaign.min_send_delay_seconds) * 1000;
    if (elapsedMs < neededMs) {
      return {
        campaignId,
        action: "waiting_interval",
        detail: `Faltan ${Math.ceil((neededMs - elapsedMs) / 1000)}s para el próximo envío`,
      };
    }
  }

  // 4) Reserva atómica del próximo destinatario. Primero los de prioridad
  // alta (fractura/muerte/amputación, priority=0) y dentro de cada nivel en
  // el orden en que se agregaron (`queued_at`). Ver computeCampaignPriority.
  // Marketing elige al lead más calificado y reserva ese destinatario.
  let claimed: ClaimedRecipient | null = null;
  let marketingHook: string | null = null;

  if (campaign.area === "marketing") {
    // Marketing: no se va en orden de carga. Se elige al lead más calificado ya
    // analizado y el mensaje lleva el "gancho" del análisis (ver marketing/outreach.ts).
    const pick = await pickNextMarketingContact(campaignId);
    if (pick.kind === "waiting") {
      return { campaignId, action: "waiting_interval", detail: pick.detail };
    }
    if (pick.kind === "ready") {
      const { data } = await supabase.rpc("campaign_claim_recipient", {
        p_campaign_contact: pick.campaignContactId,
        p_token: token,
      });
      const row = Array.isArray(data) ? data[0] : null;
      if (!row) return { campaignId, action: "busy", detail: "Ese destinatario ya lo tomó otra ejecución." };
      claimed = { ...row, full_name: pick.name };
      marketingHook = pick.hook;
    }
  } else {
    const { data, error } = await supabase.rpc("campaign_claim_next", { p_campaign: campaignId, p_token: token });
    if (error) return { campaignId, action: "not_running", detail: `No se pudo reservar el próximo destinatario: ${error.message}` };
    claimed = (Array.isArray(data) ? data[0] : null) ?? null;
  }

  if (!claimed) {
    // La campaña de prospección automática nunca se da por terminada: se
    // queda esperando leads nuevos que vayan saliendo del análisis.
    if (campaign.area === "marketing" && campaign.name === AUTO_CAMPAIGN_NAME) {
      return { campaignId, action: "waiting_interval", detail: "Sin leads calificados por contactar por ahora" };
    }
    // Termina solo cuando no queda nada pendiente ni en envío (lo que está a
    // revisar lo decide una persona).
    const { count: open } = await supabase
      .from("campaign_contacts")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .in("status", ["pendiente", "enviando"]);
    if ((open ?? 0) > 0) {
      return { campaignId, action: "waiting_interval", detail: "Hay destinatarios en envío por otra ejecución" };
    }
    await supabase
      .from("campaigns")
      .update({ status: "finalizada", finished_at: now.toISOString() })
      .eq("id", campaignId);
    return { campaignId, action: "finished" };
  }

  const claim = claimed;
  const phone = claim.phone;
  const name = claim.full_name ?? "";

  // Detención persistente: un contacto detenido nunca recibe el envío,
  // aunque esté en la cola. Queda registrado y no cuenta para el ritmo.
  const block = await contactBlockReason(claim.contact_id);
  if (block) {
    await finishClaim(supabase, claim.id, token, "opt_out", { error: `Detenido: ${block.label}` });
    return { campaignId, action: "failed_send", detail: `Contacto detenido (${block.label}), no se envió` };
  }

  if (!phone) {
    // No cuenta como intento de envío real: no tocamos el ritmo, así el
    // próximo tick prueba con el siguiente contacto sin esperar de más.
    await finishClaim(supabase, claim.id, token, "fallo", { error: "Sin teléfono" });
    return { campaignId, action: "failed_send", detail: "Contacto sin teléfono" };
  }

  // Variables de la plantilla con las fuentes elegidas. Si falta un dato de
  // este contacto, su envío no sale (nunca con una variable vacía).
  const built = buildBodyParameters(resolved.analysis, resolved.sources, {
    "contacto.nombre": name,
    "perfil.presentacion": senderName,
    "perfil.marca": brandName,
  });
  if (!built.ok) {
    const what = built.missing.map((m) => `${m.label} para ${m.variable}`).join(", ");
    // Igual que "Sin teléfono": no hubo intento contra la API, no cuenta para el ritmo.
    await finishClaim(supabase, claim.id, token, "fallo", { error: `No se envió: falta ${what}` });
    return { campaignId, action: "failed_send", detail: `Falta ${what}` };
  }

  // Revalidación inmediatamente antes de llamar a Meta: pausa general,
  // estado de la campaña y detención, leídos de nuevo.
  const [pauseNow, { data: fresh }, blockNow] = await Promise.all([
    getAutomationPause(),
    supabase.from("campaigns").select("status, archived_at").eq("id", campaignId).maybeSingle(),
    contactBlockReason(claim.contact_id),
  ]);
  const stopReason = pauseNow.outboundPaused
    ? "Pausa general de envíos automáticos activa"
    : !fresh || fresh.status !== "en_curso" || fresh.archived_at
    ? `La campaña cambió de estado (${fresh?.archived_at ? "archivada" : fresh?.status ?? "sin datos"})`
    : blockNow
    ? `Contacto detenido (${blockNow.label})`
    : null;
  if (stopReason) {
    await finishClaim(supabase, claim.id, token, blockNow ? "opt_out" : "pendiente", {
      error: blockNow ? `Detenido: ${blockNow.label}` : null,
    });
    return { campaignId, action: "not_running", detail: `${stopReason}: no se envió` };
  }

  // Marca de inicio: a partir de acá, si la ejecución se corta, el caso va a
  // revisión y nunca se reenvía solo.
  const { data: marked } = await supabase.rpc("campaign_mark_sending", { p_campaign_contact: claim.id, p_token: token });
  if (marked !== true) {
    return { campaignId, action: "busy", detail: "La reserva de este destinatario ya no está vigente: no se envió" };
  }

  const sentInBatchAfter = campaign.sent_in_batch + 1;
  const batchDone = sentInBatchAfter >= campaign.batch_size;
  const pacingUpdate = {
    last_sent_at: now.toISOString(),
    sent_in_batch: batchDone ? 0 : sentInBatchAfter,
    batch_paused_until: batchDone
      ? new Date(now.getTime() + campaign.batch_pause_seconds * 1000).toISOString()
      : null,
    // Sorteamos ACÁ el tiempo de espera hasta el próximo mensaje (no un
    // número fijo): así cada intervalo entre mensajes es distinto, dentro
    // del rango configurado, simulando el ritmo irregular de una persona.
    next_delay_seconds: randomInt(campaign.min_send_delay_seconds, campaign.max_send_delay_seconds),
  };

  let sendResult: any;
  try {
    sendResult = await sendWhatsAppTemplate(
      campaign.area,
      phone,
      template.name,
      template.language,
      built.parameters,
      { credentialKey: line.credential_key }
    );
  } catch (err) {
    const failure = classifySendFailure(err);
    const note = failureNote(failure);
    // Se hizo un intento real contra la API: cuenta para el ritmo.
    await supabase.from("campaigns").update(pacingUpdate).eq("id", campaignId);

    if (failure.kind === "plantilla" || failure.kind === "cuenta") {
      // El problema no es de este contacto: su envío queda pendiente y la
      // campaña se pausa con el motivo, conservando cola y contadores.
      await finishClaim(supabase, claim.id, token, "pendiente", { error: `Pendiente: ${note}` });
      if (failure.kind === "plantilla") await recordTemplateSendError(template.id, failure.detail);
      await supabase
        .from("campaigns")
        .update({ status: "pausada", pause_reason: note, paused_at: new Date().toISOString() })
        .eq("id", campaignId);
      return { campaignId, action: "failed_send", detail: note };
    }
    if (failure.kind === "transitorio") {
      // Meta no aceptó el mensaje por una falla temporal: vuelve a la cola,
      // con un límite de intentos.
      if (claim.attempts >= MAX_TRANSIENT_ATTEMPTS) {
        await finishClaim(supabase, claim.id, token, "revisar", {
          error: `${note} Ya se intentó ${claim.attempts} veces: queda para revisión.`,
          uncertain: false,
        });
      } else {
        await finishClaim(supabase, claim.id, token, "pendiente", { error: `Pendiente: ${note}` });
      }
      return { campaignId, action: "failed_send", detail: note };
    }
    if (failure.kind === "contacto") {
      // Meta confirmó un problema de este destinatario.
      await finishClaim(supabase, claim.id, token, "fallo", { error: note });
      return { campaignId, action: "failed_send", detail: note };
    }
    // Incierto o no clasificado: a revisión, sin reenvío automático.
    await finishClaim(supabase, claim.id, token, "revisar", { error: note, uncertain: !failure.certainNotSent });
    return { campaignId, action: "failed_send", detail: note };
  }

  // Log completo de la respuesta de Meta: antes esto se descartaba, así que
  // si un mensaje quedaba marcado "enviado" en el panel pero nunca llegaba
  // al celular, no había forma de ver qué había contestado realmente la
  // API. Con este log, la próxima vez se puede revisar en los logs de Vercel.
  console.log(
    `[campaigns] Respuesta de Meta al enviar a ${phone} (campaña ${campaign.id}):`,
    JSON.stringify(sendResult)
  );

  const messageId: string = sendResult.messages[0].id;
  const finished = await finishClaim(supabase, claim.id, token, "enviado", { messageId });
  if (!finished) {
    // Meta lo aceptó pero no se pudo guardar el resultado: la fila queda
    // reservada con marca de inicio y la recuperación la pasa a revisión.
    // Nunca se reenvía sola.
    console.error(`[campaigns] Meta aceptó el envío ${messageId} pero no se pudo guardar el resultado del destinatario ${claim.id}.`);
  }

  // Dejamos registro de la conversación y del mensaje saliente: si no,
  // cuando la persona responda por WhatsApp, el agente IA arranca sin
  // saber qué se le mandó ni de qué campaña vino. El identificador de Meta
  // y el estado inicial quedan en el mensaje para registrar entrega y lectura.
  try {
    const conversation = await findOrCreateConversation({
      contactId: claim.contact_id,
      channelId: campaign.channel_id,
      area: campaign.area,
    });
    // La conversación queda asociada a la línea por la que salió el envío,
    // así las respuestas manuales salen por la misma línea.
    await supabase.from("conversations").update({ line_id: line.id }).eq("id", conversation.id).is("line_id", null);
    const sentAt = new Date().toISOString();
    const messageRow = {
      conversation_id: conversation.id,
      sender_type: "agente_ia",
      direction: "saliente",
      body:
        campaign.area === "marketing" && marketingHook
          ? `[Mensaje inicial — plantilla ${template.name}${brandName ? ` · ${brandName}` : ""}] Primer contacto automático con el gancho del análisis.`
          : `[Plantilla de campaña "${campaign.name}": ${template.name}] Primer contacto automático a ${name || "el prospecto"}.`,
      external_message_id: messageId,
      delivery_status: "enviado",
      delivery_status_at: sentAt,
      metadata: { campaign_id: campaign.id, template: template.name, template_id: template.id, template_language: template.language },
      origin: "inicio_campana",
    };
    let { error: msgError } = await insertMessageRow(supabase, messageRow);
    if (msgError && (msgError as any).code !== "23505") {
      ({ error: msgError } = await insertMessageRow(supabase, messageRow));
    }
    if (msgError && (msgError as any).code !== "23505") {
      console.error(`[campaigns] No se pudo registrar el mensaje ${messageId} en la conversación:`, msgError.message);
    }
    if (campaign.area === "marketing") {
      await markLeadContacted(claim.contact_id, marketingHook);
    }
    await supabase
      .from("conversations")
      .update({ status: "esperando_respuesta_prospecto", last_message_at: sentAt })
      .eq("id", conversation.id);
    await supabase
      .from("contacts")
      .update({ status: "esperando_respuesta_prospecto" })
      .eq("id", claim.contact_id);
  } catch (err) {
    console.error(`[campaigns] El envío ${messageId} salió pero falló el registro posterior:`, err);
  }

  await supabase.from("campaigns").update(pacingUpdate).eq("id", campaignId);

  return { campaignId, action: "sent", detail: phone };
}

/** Le da un paso a todas las campañas activas. Esto es lo que llama el endpoint de cron. */
export async function tickAllActiveCampaigns(): Promise<TickResult[]> {
  if ((await getAutomationPause()).outboundPaused) return [];
  const supabase = createAdminClient();
  const { data: activeCampaigns } = await supabase
    .from("campaigns")
    .select("id")
    .eq("status", "en_curso");

  const results: TickResult[] = [];
  for (const c of activeCampaigns ?? []) {
    results.push(await tickCampaign(c.id));
  }
  return results;
}

/**
 * Arranca (o reanuda) una campaña: la marca "en_curso" y limpia el estado de
 * ritmo para que arranque un lote nuevo. Manda el primer mensaje de una vez
 * (así el click de "Lanzar" tiene feedback inmediato) — el resto de los
 * envíos los va haciendo el cron externo llamando a `/api/campaigns/tick`.
 */
export async function launchCampaign(campaignId: string): Promise<TickResult> {
  // Con la pausa general activa no se lanza ni se reanuda nada: se levanta
  // primero la pausa, por decisión expresa, desde Configuración.
  await assertOutboundAllowed();
  const supabase = createAdminClient();

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("started_at, archived_at")
    .eq("id", campaignId)
    .single();

  if (campaignError || !campaign) throw new Error("Campaña no encontrada");
  if (campaign.archived_at) throw new Error("La campaña está archivada: recuperala antes de lanzarla.");
  const { data: full } = await supabase
    .from("campaigns")
    .select("area, line_id, message_template_name, template_id")
    .eq("id", campaignId)
    .single();
  const readiness = await campaignReadiness(full as any);
  if (!readiness.ready || !readiness.line || !readiness.template) throw new CampaignNotReadyError(readiness.missing);
  // Estado real de la plantilla en Meta en el momento de lanzar (pregunta 22).
  const live = await confirmTemplateLive(readiness.template.template.id, readiness.line);
  if (!live.ok) throw new CampaignNotReadyError([live.message ?? "No se pudo confirmar la plantilla en Meta"]);

  await supabase
    .from("campaigns")
    .update({
      status: "en_curso",
      started_at: campaign.started_at ?? new Date().toISOString(),
      batch_paused_until: null,
      pause_reason: null,
      paused_at: null,
    })
    .eq("id", campaignId);

  return tickCampaign(campaignId);
}

export async function pauseCampaign(campaignId: string, reason = "Pausada desde el panel") {
  const supabase = createAdminClient();
  await supabase
    .from("campaigns")
    .update({ status: "pausada", pause_reason: reason, paused_at: new Date().toISOString() })
    .eq("id", campaignId);
}

export interface CampaignStatusSnapshot {
  campaign: {
    id: string;
    name: string;
    status: string;
    min_send_delay_seconds: number;
    max_send_delay_seconds: number;
    next_delay_seconds: number | null;
    batch_size: number;
    batch_pause_seconds: number;
    daily_send_limit: number | null;
    sent_in_batch: number;
    last_sent_at: string | null;
    batch_paused_until: string | null;
    started_at: string | null;
    finished_at: string | null;
    send_window_start_hour: number;
    send_window_end_hour: number;
  };
  counts: {
    total: number;
    pendiente: number;
    /** reservados por una ejecución en curso */
    enviando: number;
    /** no se sabe si Meta los aceptó, o Meta los rechazó por un motivo no clasificado */
    revisar: number;
    enviado: number;
    entregado: number;
    leido: number;
    respondio: number;
    fallo: number;
    opt_out: number;
    enviados_total: number; // enviado + entregado + leido + respondio
  };
  lastSent: { full_name: string | null; phone: string | null; sent_at: string } | null;
  nextUp: { full_name: string | null; phone: string | null } | null;
  waitSeconds: number;
  waitReason:
    | "listo" // le toca mandar ya (el próximo tick del cron lo hace)
    | "esperando_intervalo"
    | "pausa_entre_lotes"
    | "limite_diario"
    | "fuera_de_horario" // ej. de madrugada: espera a que abra el horario permitido
    | "detenida" // pausada o en borrador
    | "finalizada";
  // Solo tiene valor cuando waitReason === "fuera_de_horario": a qué hora
  // (ISO) vuelve a abrir el horario de envío permitido.
  resumesAt: string | null;
}

/**
 * Foto del estado actual de una campaña para mostrar en el panel de
 * seguimiento en vivo. A diferencia de `tickCampaign`, esto es de SOLO
 * LECTURA: nunca manda mensajes ni modifica nada — solo mira el mismo
 * estado que usa el motor de envío para explicar en qué momento del ritmo
 * está la campaña ahora mismo.
 */
export async function getCampaignStatus(campaignId: string): Promise<CampaignStatusSnapshot> {
  const supabase = createAdminClient();

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (campaignError || !campaign) throw new Error("Campaña no encontrada");

  // Contamos con consultas de SOLO CONTEO (`count: "exact", head: true`) en
  // vez de traer todas las filas de `campaign_contacts` y contarlas acá.
  //
  // Por qué: el proyecto de Supabase tiene un límite de filas por respuesta
  // ("Max Rows" en Settings → API, 1000 por defecto) que recorta CUALQUIER
  // consulta que devuelva filas, sin importar qué `.limit()` se pida desde
  // el código — antes esto pedía hasta 20000 filas con `.select("status")`,
  // pero en una campaña de más de 1000 destinatarios (pasó con una de
  // 1389) Supabase igual devolvía como mucho 1000, así que el panel de
  // seguimiento en vivo mostraba "/1000" en vez del total real, y contaba
  // enviados/respondieron solo sobre esa porción recortada — de ahí los
  // números que no coincidían con la realidad (ni con la tarjeta de la
  // lista de campañas, que tenía el mismo problema por otro lado, ver
  // `getCampaignFunnelCounts`). Las consultas `head: true` no devuelven
  // filas, solo un número en un header, así que no las afecta ese límite.
  const STATUS_KEYS = [
    "pendiente",
    "enviando",
    "revisar",
    "enviado",
    "entregado",
    "leido",
    "respondio",
    "fallo",
    "opt_out",
  ] as const;

  const [{ count: total }, ...perStatusCounts] = await Promise.all([
    supabase.from("campaign_contacts").select("*", { count: "exact", head: true }).eq("campaign_id", campaignId),
    ...STATUS_KEYS.map((status) =>
      supabase
        .from("campaign_contacts")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaignId)
        .eq("status", status)
    ),
  ]);

  const counts = {
    total: total ?? 0,
    pendiente: 0,
    enviando: 0,
    revisar: 0,
    enviado: 0,
    entregado: 0,
    leido: 0,
    respondio: 0,
    fallo: 0,
    opt_out: 0,
  };
  STATUS_KEYS.forEach((status, i) => {
    counts[status] = perStatusCounts[i].count ?? 0;
  });
  const enviados_total = counts.enviado + counts.entregado + counts.leido + counts.respondio;

  const [{ data: lastSentRow }, { data: nextRow }] = await Promise.all([
    supabase
      .from("campaign_contacts")
      .select("sent_at, contacts(full_name, phone)")
      .eq("campaign_id", campaignId)
      .not("sent_at", "is", null)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Misma consulta (mismo ORDER BY) que usa tickCampaign para elegir a
    // quién le toca el próximo envío — así lo que se muestra acá coincide
    // siempre con a quién realmente le va a llegar el próximo mensaje.
    supabase
      .from("campaign_contacts")
      .select("contacts(full_name, phone)")
      .eq("campaign_id", campaignId)
      .eq("status", "pendiente")
      .order("priority", { ascending: true })
      .order("queued_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const now = new Date();
  let waitSeconds = 0;
  let waitReason: CampaignStatusSnapshot["waitReason"] = "listo";
  let resumesAt: string | null = null;

  const contactCalendar = await loadContactCalendar(now);
  const sendWindow = getSendWindow(campaign, now, contactCalendar.calendar.exceptions);

  if (campaign.status === "finalizada") {
    waitReason = "finalizada";
  } else if (campaign.status !== "en_curso") {
    waitReason = "detenida";
  } else if (!sendWindow.withinWindow) {
    waitReason = "fuera_de_horario";
    waitSeconds = Math.ceil((sendWindow.opensAt.getTime() - now.getTime()) / 1000);
    resumesAt = sendWindow.opensAt.toISOString();
  } else if (campaign.batch_paused_until && now < new Date(campaign.batch_paused_until)) {
    waitReason = "pausa_entre_lotes";
    waitSeconds = Math.ceil(
      (new Date(campaign.batch_paused_until).getTime() - now.getTime()) / 1000
    );
  } else {
    let dailyLimitReached = false;
    if (campaign.daily_send_limit) {
      const startOfToday = startOfArgentinaDay(now);
      const { count: sentToday } = await supabase
        .from("campaign_contacts")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaignId)
        .in("status", ["enviado", "entregado", "leido", "respondio"])
        .gte("sent_at", startOfToday.toISOString());
      dailyLimitReached = (sentToday ?? 0) >= campaign.daily_send_limit;
    }

    if (dailyLimitReached) {
      waitReason = "limite_diario";
    } else if (!nextRow) {
      // No quedan pendientes: el próximo tick del cron la va a cerrar sola.
      waitReason = "finalizada";
    } else if (campaign.last_sent_at) {
      const elapsedMs = now.getTime() - new Date(campaign.last_sent_at).getTime();
      const neededMs = (campaign.next_delay_seconds ?? campaign.min_send_delay_seconds) * 1000;
      if (elapsedMs < neededMs) {
        waitReason = "esperando_intervalo";
        waitSeconds = Math.ceil((neededMs - elapsedMs) / 1000);
      }
    }
  }

  return {
    campaign: {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      min_send_delay_seconds: campaign.min_send_delay_seconds,
      max_send_delay_seconds: campaign.max_send_delay_seconds,
      next_delay_seconds: campaign.next_delay_seconds,
      batch_size: campaign.batch_size,
      batch_pause_seconds: campaign.batch_pause_seconds,
      daily_send_limit: campaign.daily_send_limit,
      sent_in_batch: campaign.sent_in_batch,
      last_sent_at: campaign.last_sent_at,
      batch_paused_until: campaign.batch_paused_until,
      started_at: campaign.started_at,
      finished_at: campaign.finished_at,
      // Horario efectivo: el de la campaña dentro del horario general (pregunta 39).
      send_window_start_hour: effectiveSendHours(campaign).start,
      send_window_end_hour: effectiveSendHours(campaign).end,
    },
    counts: { ...counts, enviados_total },
    lastSent: lastSentRow
      ? {
          full_name: (lastSentRow as any).contacts?.full_name ?? null,
          phone: (lastSentRow as any).contacts?.phone ?? null,
          sent_at: lastSentRow.sent_at as string,
        }
      : null,
    nextUp: nextRow
      ? {
          full_name: (nextRow as any).contacts?.full_name ?? null,
          phone: (nextRow as any).contacts?.phone ?? null,
        }
      : null,
    waitSeconds,
    waitReason,
    resumesAt,
  };
}

export interface CampaignFunnelCounts {
  total: number;
  enviados: number;
  entregados: number;
  leidos: number;
  respondieron: number;
  fallidos: number;
  calificados: number;
  agendados: number;
  noCalifica: number;
}

/**
 * Cuenta el embudo de una campaña (total, enviados, respondieron,
 * calificados, etc.) para las tarjetas de la lista de campañas y de la
 * ficha de una campaña. Usa solo consultas de CONTEO (`count: "exact",
 * head: true`) en vez de traer todas las filas de `campaign_contacts` con
 * un `select("*, campaign_contacts(status, contacts(status))")` embebido.
 *
 * Por qué: ese embed devolvía filas reales, y el límite de "Max Rows" del
 * proyecto de Supabase (1000 por defecto, Settings → API) recorta
 * cualquier consulta que devuelva filas — sin importar el `.limit()` que
 * se pida, e incluso en relaciones embebidas. Con una campaña de más de
 * 1000 destinatarios (pasó con una de 1389), esto hacía que la tarjeta
 * mostrara "99/1000 enviados" en vez del total y el conteo real: el 1000
 * no era "cuántos contactos tiene la campaña", era el límite de filas que
 * Supabase devolvía, y el 99 salía de contar enviados solo dentro de esa
 * porción recortada — por eso no coincidía ni con la campaña real ni con
 * lo que mostraba el panel de seguimiento en vivo (que tenía el mismo
 * problema, arreglado en `getCampaignStatus`, arriba). Las consultas
 * `head: true` no devuelven filas, solo un número en un header, así que no
 * las afecta ese límite sin importar cuántos miles de destinatarios tenga
 * la campaña.
 *
 * Recibe el cliente de Supabase como parámetro (en vez de crear uno con
 * `createAdminClient`) para poder usarse tanto desde páginas con sesión de
 * usuario (`createClient` de `@/lib/supabase/server`) como desde contextos
 * sin sesión.
 */
export async function getCampaignFunnelCounts(
  // Tipado como `any` a propósito: esta función la llaman tanto páginas con
  // sesión de usuario (`createClient` de `@/lib/supabase/server`) como
  // código sin sesión (`createAdminClient`) — son dos clientes de Supabase
  // con tipos ligeramente distintos, y a los dos les sirve igual acá porque
  // solo se usan los métodos genéricos `.from().select()`.
  supabase: any,
  campaignId: string
): Promise<CampaignFunnelCounts> {
  const byStatus = async (statuses: string[]) => {
    const { count } = await supabase
      .from("campaign_contacts")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .in("status", statuses);
    return count ?? 0;
  };

  // Filtra por el status del CONTACTO (no del campaign_contacts), usando un
  // inner join embebido — `head: true` sigue devolviendo solo el conteo,
  // no las filas, así que tampoco lo afecta el límite de Max Rows.
  const byContactStatus = async (statuses: string[]) => {
    const { count } = await supabase
      .from("campaign_contacts")
      .select("id, contacts!inner(status)", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .in("contacts.status", statuses);
    return count ?? 0;
  };

  const totalQuery = async () => {
    const { count } = await supabase
      .from("campaign_contacts")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", campaignId);
    return count ?? 0;
  };

  const [total, enviados, entregados, leidos, respondieron, fallidos, calificados, agendados, noCalifica] =
    await Promise.all([
      totalQuery(),
      byStatus(["enviado", "entregado", "leido", "respondio"]),
      byStatus(["entregado", "leido", "respondio"]),
      byStatus(["leido", "respondio"]),
      byStatus(["respondio"]),
      byStatus(["fallo"]),
      byContactStatus(["calificado", "agendado", "cerrado_ganado"]),
      byContactStatus(["agendado", "cerrado_ganado"]),
      byContactStatus(["no_califica", "cerrado_perdido"]),
    ]);

  return { total, enviados, entregados, leidos, respondieron, fallidos, calificados, agendados, noCalifica };
}
