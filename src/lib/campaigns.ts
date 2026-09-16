import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppTemplate } from "@/lib/whatsapp/client";
import { findOrCreateConversation } from "@/lib/contacts";

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

// Variables 2 y 3 de la plantilla de WhatsApp aprobada ("Soy Leonardo, del
// equipo de Estudio Jurídico Vita"): son fijas para todas las campañas,
// Vita las confirmó así. La variable 1 (nombre del contacto) sigue siendo
// dinámica, por contacto. Si en el futuro necesitan variar por campaña o
// por área (Civil/Penal), conviene moverlas a columnas de la tabla
// `campaigns` y exponerlas en el formulario de "Nueva campaña".
const TEMPLATE_SENDER_NAME = "Leonardo";
const TEMPLATE_TEAM_NAME = "Estudio Jurídico Vita";

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

// Argentina está en UTC-3 todo el año (no tiene horario de verano desde
// 2009), así que alcanza con un offset fijo — no hace falta lidiar con
// cambios de hora.
const ARGENTINA_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;

/**
 * Determina si `now` cae dentro del horario permitido de envío de la
 * campaña (en hora Argentina) y, si no, calcula cuándo vuelve a abrir.
 *
 * Antes esto no existía: el cron mandaba mensajes a cualquier hora,
 * incluida la madrugada (3-4am), porque nada se lo impedía — el límite
 * diario de envíos (`daily_send_limit`) solo limita CUÁNTOS mensajes manda
 * por día, no A QUÉ HORA los manda.
 *
 * No depende de la zona horaria del servidor (Vercel corre en UTC): se
 * calcula todo a mano con el offset fijo de Argentina.
 */
export function getSendWindow(
  campaign: { send_window_start_hour: number; send_window_end_hour: number },
  now: Date
): { withinWindow: boolean; opensAt: Date } {
  // Truco: restamos el offset y leemos con los getters "UTC" — así, sin
  // importar en qué zona horaria corra el proceso, esos getters devuelven
  // la hora de pared de Argentina.
  const artNow = new Date(now.getTime() - ARGENTINA_UTC_OFFSET_MS);
  const currentHour = artNow.getUTCHours();
  const { send_window_start_hour: start, send_window_end_hour: end } = campaign;

  if (currentHour >= start && currentHour < end) {
    return { withinWindow: true, opensAt: now };
  }

  // Instante UTC real que corresponde a la medianoche de Argentina del día
  // de `artNow`, más las horas de `start` — así calculamos el próximo
  // horario de apertura sin depender de la zona horaria del servidor.
  const argentinaMidnightUtcMs =
    Date.UTC(artNow.getUTCFullYear(), artNow.getUTCMonth(), artNow.getUTCDate()) +
    ARGENTINA_UTC_OFFSET_MS;
  const todayOpensAt = new Date(argentinaMidnightUtcMs + start * 60 * 60 * 1000);
  // Si ya pasó el horario de cierre de hoy, abre mañana; si todavía no
  // llegó el horario de apertura de hoy (por ejemplo, son las 4am), abre
  // más tarde hoy mismo.
  const opensAt =
    currentHour >= end ? new Date(todayOpensAt.getTime() + 24 * 60 * 60 * 1000) : todayOpensAt;

  return { withinWindow: false, opensAt };
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

  // 0) ¿Estamos dentro del horario permitido de envío? No tocamos el
  // ritmo/pacing acá: apenas vuelva a estar en horario, la campaña sigue
  // exactamente donde había quedado (no hace falta "Reanudar" a mano cada
  // mañana, se despierta sola).
  const sendWindow = getSendWindow(campaign, now);
  if (!sendWindow.withinWindow) {
    return {
      campaignId,
      action: "outside_send_window",
      detail: `Fuera del horario permitido (${campaign.send_window_start_hour}-${campaign.send_window_end_hour}hs, Argentina). Reanuda a las ${sendWindow.opensAt.toLocaleString(
        "es-AR",
        { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit" }
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
    // Sorteamos ACÁ el tiempo de espera hasta el próximo mensaje (no un
    // número fijo): así cada intervalo entre mensajes es distinto, dentro
    // del rango configurado, simulando el ritmo irregular de una persona.
    next_delay_seconds: randomInt(campaign.min_send_delay_seconds, campaign.max_send_delay_seconds),
  };

  try {
    const sendResult = await sendWhatsAppTemplate(
      campaign.area,
      phone,
      campaign.message_template_name,
      "es_AR",
      [name, TEMPLATE_SENDER_NAME, TEMPLATE_TEAM_NAME]
    );

    // Log completo de la respuesta de Meta: antes esto se descartaba, así que
    // si un mensaje quedaba marcado "enviado" en el panel pero nunca llegaba
    // al celular, no había forma de ver qué había contestado realmente la
    // API (por ejemplo, un id de mensaje válido no garantiza entrega — eso
    // depende de cosas fuera de nuestro control, como si el número de
    // Meta todavía está en modo prueba/desarrollo con destinatarios
    // restringidos). Con este log, la próxima vez se puede revisar en los
    // logs de Vercel.
    console.log(
      `[campaigns] Respuesta de Meta al enviar a ${phone} (campaña ${campaign.id}):`,
      JSON.stringify(sendResult)
    );

    const messageId = sendResult?.messages?.[0]?.id ?? null;

    await supabase
      .from("campaign_contacts")
      .update({ status: "enviado", sent_at: now.toISOString(), message_id: messageId })
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

  const { data: statusRows } = await supabase
    .from("campaign_contacts")
    .select("status")
    .eq("campaign_id", campaignId)
    .limit(20000);

  const counts = {
    total: statusRows?.length ?? 0,
    pendiente: 0,
    enviado: 0,
    entregado: 0,
    leido: 0,
    respondio: 0,
    fallo: 0,
    opt_out: 0,
  };
  for (const row of statusRows ?? []) {
    const key = row.status as keyof typeof counts;
    if (key in counts) (counts[key] as number)++;
  }
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
    // Misma consulta (sin ORDER BY) que usa tickCampaign para elegir a quién
    // le toca el próximo envío — así lo que se muestra acá coincide siempre
    // con a quién realmente le va a llegar el próximo mensaje.
    supabase
      .from("campaign_contacts")
      .select("contacts(full_name, phone)")
      .eq("campaign_id", campaignId)
      .eq("status", "pendiente")
      .limit(1)
      .maybeSingle(),
  ]);

  const now = new Date();
  let waitSeconds = 0;
  let waitReason: CampaignStatusSnapshot["waitReason"] = "listo";
  let resumesAt: string | null = null;

  const sendWindow = getSendWindow(campaign, now);

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
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
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
      send_window_start_hour: campaign.send_window_start_hour,
      send_window_end_hour: campaign.send_window_end_hour,
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
