import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppTemplate } from "@/lib/whatsapp/client";
import { getSendWindow } from "@/lib/campaigns";
import { analyzePendingLeads } from "./analysis";
import { hasRunnableScrapeJob, runNextScrapeJob } from "./scrape-jobs";
import { FOLLOWUP_INTERVAL_HOURS, MAX_FOLLOWUPS, logMarketingEvent } from "./leads";

/**
 * Seguimiento ("repesca") de los prospectos de Marketing que respondieron
 * pero dudaron o dijeron "en otro momento".
 *
 * Reglas (las definió Vita):
 *  - El primer contacto es la charla en la que el prospecto dudó.
 *  - Segundo contacto: un mensaje de seguimiento en menos de 3 días.
 *  - Tercer contacto: otro mensaje 3 días después.
 *  - Si tampoco responde: se da de baja y no se lo vuelve a contactar.
 *  - Si NUNCA respondió al mensaje inicial: no se le escribe nunca más
 *    (acá no hay nada que hacer para ese caso: simplemente no entra al
 *    seguimiento).
 *
 * Fuera de las 24 hs de la última respuesta del prospecto WhatsApp solo
 * deja mandar plantillas aprobadas, por eso los seguimientos usan dos
 * plantillas (nombres configurables por variable de entorno).
 */

const TEMPLATE_REPESCA_1 = process.env.MARKETING_TEMPLATE_REPESCA_1 ?? "kocos_repesca_1";
const TEMPLATE_REPESCA_2 = process.env.MARKETING_TEMPLATE_REPESCA_2 ?? "kocos_repesca_2";

/**
 * Texto de cada plantilla — tiene que coincidir con lo que se aprobó en
 * Meta. Se usa solo para dejar registrado en el historial del panel qué se
 * le mandó al prospecto (el que realmente llega es el de Meta).
 */
export function renderRepescaText(step: 1 | 2, negocio: string, tema: string): string {
  if (step === 1) {
    return `Hola, ¿cómo estás? Te escribimos de Kocos Marketing por lo que charlamos para ${negocio} sobre ${tema}. ¿Pudiste pensarlo? Si te quedó alguna duda, escribinos por acá y te la resolvemos.`;
  }
  return `Hola, te escribimos por última vez desde Kocos Marketing para saber si seguís interesado en mejorar ${negocio} con ${tema}. Si preferís dejarlo para más adelante no hay problema, quedamos a disposición por acá cuando quieras retomarlo.`;
}

function oneLine(text: string, max: number): string {
  return text.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, max).trim();
}

function topicFor(contact: any): string {
  const qd = (contact.qualification_data ?? {}) as Record<string, unknown>;
  const servicio = qd.servicio_buscado;
  if (typeof servicio === "string" && servicio.trim()) {
    return oneLine(`el servicio de ${servicio}`, 60);
  }
  return "una propuesta a medida";
}

const MARKETING_WINDOW = { send_window_start_hour: 9, send_window_end_hour: 20 };

/** Los que respondieron, charlaron y se quedaron callados: pasan a seguimiento. */
async function moveSilentLeadsToRepesca(): Promise<number> {
  const supabase = createAdminClient();
  const threshold = new Date(Date.now() - FOLLOWUP_INTERVAL_HOURS * 3600 * 1000).toISOString();

  const { data: candidates } = await supabase
    .from("marketing_leads")
    .select("id, contact_id")
    .eq("outreach_status", "respondio")
    .lt("last_inbound_at", threshold)
    .order("last_inbound_at", { ascending: true })
    .limit(200);

  let moved = 0;
  for (const lead of candidates ?? []) {
    if (moved >= 20) break;
    // Si una persona del equipo tomó la conversación, no es un caso para el seguimiento automático.
    const { data: conv } = await supabase
      .from("conversations")
      .select("ai_enabled")
      .eq("contact_id", lead.contact_id)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    if (!conv?.ai_enabled) continue;

    const now = new Date().toISOString();
    await supabase
      .from("marketing_leads")
      .update({ outreach_status: "repesca", followup_count: 0, next_followup_at: now, updated_at: now })
      .eq("id", lead.id)
      .eq("outreach_status", "respondio");
    await logMarketingEvent({
      leadId: lead.id,
      contactId: lead.contact_id,
      type: "en_duda",
      detail: { motivo: "Dejó de responder durante la conversación" },
    });
    moved++;
  }
  return moved;
}

/** Manda (como máximo) UN seguimiento vencido, o da de baja al que ya agotó los suyos. */
async function processOneDueFollowup(): Promise<string> {
  const supabase = createAdminClient();
  const now = new Date();

  const { data: due } = await supabase
    .from("marketing_leads")
    .select("*, contacts(id, full_name, phone, qualification_data)")
    .eq("outreach_status", "repesca")
    .lte("next_followup_at", now.toISOString())
    .order("next_followup_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!due) return "sin seguimientos vencidos";
  const lead: any = due;
  const contact = lead.contacts;

  // Ya recibió todos los seguimientos y no contestó: baja definitiva.
  if (lead.followup_count >= MAX_FOLLOWUPS) {
    const nowIso = now.toISOString();
    await supabase
      .from("marketing_leads")
      .update({ outreach_status: "baja", next_followup_at: null, closed_at: nowIso, closed_reason: "Sin respuesta tras los seguimientos", updated_at: nowIso })
      .eq("id", lead.id);
    await supabase.from("contacts").update({ status: "cerrado_perdido" }).eq("id", contact.id);
    await supabase.from("conversations").update({ status: "cerrado_perdido" }).eq("contact_id", contact.id);
    await logMarketingEvent({ leadId: lead.id, contactId: contact.id, type: "baja", detail: { seguimientos: lead.followup_count } });
    return `baja: ${contact.full_name ?? contact.id}`;
  }

  // Solo se manda dentro del horario comercial (hora Argentina).
  if (!getSendWindow(MARKETING_WINDOW, now).withinWindow) return "fuera de horario";
  if (!contact.phone) {
    await supabase.from("marketing_leads").update({ outreach_status: "baja", next_followup_at: null, closed_reason: "Sin teléfono" }).eq("id", lead.id);
    return "sin teléfono";
  }

  const step: 1 | 2 = lead.followup_count === 0 ? 1 : 2;
  const negocio = oneLine(contact.full_name ?? "tu negocio", 60);
  const tema = topicFor(contact);

  try {
    await sendWhatsAppTemplate(
      "marketing",
      contact.phone,
      step === 1 ? TEMPLATE_REPESCA_1 : TEMPLATE_REPESCA_2,
      "es_AR",
      [negocio, tema]
    );
  } catch (err: any) {
    const { count: failures } = await supabase
      .from("marketing_events")
      .select("*", { count: "exact", head: true })
      .eq("lead_id", lead.id)
      .eq("event_type", "repesca_fallida");
    const detail = { paso: step, error: String(err?.message ?? err).slice(0, 300) };
    await supabase.from("marketing_events").insert({ lead_id: lead.id, contact_id: contact.id, event_type: "repesca_fallida", detail });
    if ((failures ?? 0) + 1 >= 3) {
      await supabase.from("marketing_leads").update({ outreach_status: "baja", next_followup_at: null, closed_reason: "No se pudo enviar el seguimiento", updated_at: now.toISOString() }).eq("id", lead.id);
    } else {
      await supabase.from("marketing_leads").update({ next_followup_at: new Date(now.getTime() + 6 * 3600 * 1000).toISOString() }).eq("id", lead.id);
    }
    return `error al enviar seguimiento: ${detail.error}`;
  }

  const text = renderRepescaText(step, negocio, tema);
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("contact_id", contact.id)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (conversation) {
    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_type: "agente_ia",
      direction: "saliente",
      body: text,
      metadata: { marketing_followup: step },
    });
    await supabase.from("conversations").update({ last_message_at: now.toISOString() }).eq("id", conversation.id);
  }

  await supabase
    .from("marketing_leads")
    .update({
      followup_count: lead.followup_count + 1,
      last_outbound_at: now.toISOString(),
      next_followup_at: new Date(now.getTime() + FOLLOWUP_INTERVAL_HOURS * 3600 * 1000).toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", lead.id);
  await logMarketingEvent({ leadId: lead.id, contactId: contact.id, type: "repesca_enviada", detail: { numero: step } });

  return `seguimiento ${step} enviado a ${contact.full_name ?? contact.id}`;
}

/**
 * Un "latido" de todo el pipeline de Marketing que no es el envío de la
 * campaña: analiza leads pendientes y gestiona los seguimientos. Lo llama
 * el cron junto con el tick de campañas. Cada paso está aislado: si uno
 * falla, los demás igual corren.
 */
export async function runMarketingTick() {
  const result: Record<string, unknown> = {};

  // Una búsqueda de Google Maps (hasta ~45 s) y el análisis (descarga de sitios + IA) no
  // entran juntos en una misma ejecución: si hay una búsqueda por correr y la cola de
  // análisis no está saturada, este latido corre la búsqueda; si no, analiza.
  try {
    if (await hasRunnableScrapeJob()) {
      result.busqueda = await runNextScrapeJob();
    } else {
      result.analisis = await analyzePendingLeads(2);
    }
  } catch (err: any) {
    result.analisis_error = String(err?.message ?? err);
  }
  try {
    result.pasaron_a_seguimiento = await moveSilentLeadsToRepesca();
  } catch (err: any) {
    result.seguimiento_error = String(err?.message ?? err);
  }
  try {
    result.seguimiento = await processOneDueFollowup();
  } catch (err: any) {
    result.envio_seguimiento_error = String(err?.message ?? err);
  }

  return result;
}
