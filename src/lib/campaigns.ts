import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppTemplate } from "@/lib/whatsapp/client";
import { findOrCreateConversation } from "@/lib/contacts";

/**
 * Motor de envío de campañas — modelo "a pasos" (tick-based).
 *
 * Por qué no es un loop síncrono: las funciones serverless de Vercel tienen
 * un tiempo máximo de ejecución (10-60s en plan Hobby, hasta 300s en Pro).
 * El ritmo que necesitamos para no generar bloqueos de WhatsApp — 1 mensaje
 * nuevo cada 1.5 minutos, en lotes de 10, con una pausa de 5 minutos entre
 * lote y lote — implica que una campaña real puede tardar horas en
 * terminar. Ninguna función serverless puede quedarse "despierta" tanto
 * tiempo dentro de una sola request.
 *
 * En cambio: cada invocación de `tickCampaign` manda COMO MÁXIMO un mensaje
 * (o ninguno, si todavía no le toca por el ritmo configurado) y guarda en la
 * fila de `campaigns` el estado necesario para saber cuándo le toca el
 * próximo (`last_sent_at`, `sent_in_batch`, `batch_paused_until`). Algo
 * externo (un cron gratuito que pega a `/api/campaigns/tick` cada 1 minuto,
 * ver docs/SETUP.md) es quien "hace latir" el envío. Así cada request dura
 * milisegundos, sin importar cuántas horas tarde la campaña completa.
 */

export interface TickResult {
  campaignId: string;
  action:
    | "sent"
    | "failed_send"
    | "waiting_interval"
    | "batch_pause"
    | "daily_limit_reached"
    | "finished"
    | "not_running";
  detail?: string;
}

/**
 * Intenta avanzar UNA campaña un paso: manda un mensaje si ya le toca según
 * el ritmo configurado, o no hace nada y explica por qué en `detail`.
 * Nunca bloquea esperando — siempre vuelve casi al instante.
 */
export async function tickCampaign(campaignId: string): Promise<TickResult> {
  const supabase = createAdminClient();

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

  const now = new Date();

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
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { count: sentToday } = await supabase
      .from("campaign_contacts")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .in("status", ["enviado", "entregado", "leido", "respondio"])
      .gte("sent_at", startOfToday.toISOString());

    if ((sentToday ?? 0) >= campaign.daily_send_limit) {
      await supabase.from("campaigns").update({ status: "pausada" }).eq("id", campaignId);
      return { campaignId, action: "daily_limit_reached" };
    }
  }

  // 3) ¿Ya pasó el intervalo mínimo desde el último mensaje?
  if (campaign.last_sent_at) {
    const elapsedMs = now.getTime() - new Date(campaign.last_sent_at).getTime();
    const neededMs = campaign.send_delay_seconds * 1000;
    if (elapsedMs < neededMs) {
      return {
        campaignId,
        action: "waiting_interval",
        detail: `Faltan ${Math.ceil((neededMs - elapsedMs) / 1000)}s para el próximo envío`,
      };
    }
  }

  // 4) Buscar el próximo pendiente.
  const { data: nextRow } = await supabase
    .from("campaign_contacts")
    .select("id, contact_id, contacts(full_name, phone)")
    .eq("campaign_id", campaignId)
    .eq("status", "pendiente")
    .limit(1)
    .maybeSingle();

  if (!nextRow) {
    await supabase
      .from("campaigns")
      .update({ status: "finalizada", finished_at: now.toISOString() })
      .eq("id", campaignId);
    return { campaignId, action: "finished" };
  }

  const phone = (nextRow as any).contacts?.phone;
  const name = (nextRow as any).contacts?.full_name ?? "";

  if (!phone) {
    await supabase
      .from("campaign_contacts")
      .update({ status: "fallo", error: "Sin teléfono" })
      .eq("id", nextRow.id);
    // No cuenta como intento de envío real: no tocamos el ritmo, así el
    // próximo tick prueba con el siguiente contacto sin esperar de más.
    return { campaignId, action: "failed_send", detail: "Contacto sin teléfono" };
  }

  const sentInBatchAfter = campaign.sent_in_batch + 1;
  const batchDone = sentInBatchAfter >= campaign.batch_size;
  const pacingUpdate = {
    last_sent_at: now.toISOString(),
    sent_in_batch: batchDone ? 0 : sentInBatchAfter,
    batch_paused_until: batchDone
      ? new Date(now.getTime() + campaign.batch_pause_seconds * 1000).toISOString()
      : null,
  };

  try {
    await sendWhatsAppTemplate(campaign.area, phone, campaign.message_template_name, "es_AR", [
      name,
    ]);
    await supabase
      .from("campaign_contacts")
      .update({ status: "enviado", sent_at: now.toISOString() })
      .eq("id", nextRow.id);

    // Dejamos registro de la conversación y del mensaje saliente: si no,
    // cuando la persona responda por WhatsApp, el agente IA arranca sin
    // saber qué se le mandó ni de qué campaña vino.
    const conversation = await findOrCreateConversation({
      contactId: nextRow.contact_id,
      channelId: campaign.channel_id,
      area: campaign.area,
    });
    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_type: "agente_ia",
      direction: "saliente",
      body: `[Plantilla de campaña "${campaign.name}": ${campaign.message_template_name}] Primer contacto automático a ${name || "el prospecto"}.`,
      metadata: { campaign_id: campaign.id, template: campaign.message_template_name },
    });
    await supabase
      .from("conversations")
      .update({ status: "esperando_respuesta_prospecto", last_message_at: now.toISOString() })
      .eq("id", conversation.id);
    await supabase
      .from("contacts")
      .update({ status: "esperando_respuesta_prospecto" })
      .eq("id", nextRow.contact_id);

    await supabase.from("campaigns").update(pacingUpdate).eq("id", campaignId);

    return { campaignId, action: "sent", detail: phone };
  } catch (err: any) {
    await supabase
      .from("campaign_contacts")
      .update({ status: "fallo", error: String(err.message ?? err) })
      .eq("id", nextRow.id);
    // Igual actualizamos el ritmo: se hizo un intento real contra la API de
    // WhatsApp, así que cuenta para el cupo de "no generar bloqueos".
    await supabase.from("campaigns").update(pacingUpdate).eq("id", campaignId);
    return { campaignId, action: "failed_send", detail: String(err.message ?? err) };
  }
}

/** Le da un paso a todas las campañas activas. Esto es lo que llama el endpoint de cron. */
export async function tickAllActiveCampaigns(): Promise<TickResult[]> {
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
  const supabase = createAdminClient();

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("started_at")
    .eq("id", campaignId)
    .single();

  if (campaignError || !campaign) throw new Error("Campaña no encontrada");

  await supabase
    .from("campaigns")
    .update({
      status: "en_curso",
      started_at: campaign.started_at ?? new Date().toISOString(),
      batch_paused_until: null,
    })
    .eq("id", campaignId);

  return tickCampaign(campaignId);
}

export async function pauseCampaign(campaignId: string) {
  const supabase = createAdminClient();
  await supabase.from("campaigns").update({ status: "pausada" }).eq("id", campaignId);
}
