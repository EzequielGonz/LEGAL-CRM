import { createAdminClient } from "@/lib/supabase/admin";
import type { SourceType } from "@/lib/supabase/database.types";

/**
 * Operaciones sobre `marketing_leads` y `marketing_events` (las tablas del
 * pipeline de prospección de Kocos Marketing). Todo lo que cambia el
 * estado de un prospecto pasa por acá y deja un evento — de esos eventos
 * salen las estadísticas.
 */

/** Cada cuánto se hace seguimiento a quien dudó ("en menos de 3 días"). */
export const FOLLOWUP_INTERVAL_HOURS = 70;
/** Cantidad de mensajes de repesca antes de dar de baja. */
export const MAX_FOLLOWUPS = 2;

const SOURCE_DETAIL: Record<string, string> = {
  organico_instagram: "Instagram (consulta directa)",
  organico_facebook: "Facebook (consulta directa)",
  organico_whatsapp: "WhatsApp (consulta directa)",
  anuncio_instagram: "Anuncio de Instagram",
  anuncio_facebook: "Anuncio de Facebook",
  landing: "Formulario de la landing",
  base_de_datos: "Base de datos cargada",
  google_maps: "Google Maps",
};

export function sourceDetailFor(source: SourceType | string): string {
  return SOURCE_DETAIL[source] ?? String(source);
}

export type MarketingEventType =
  | "lead_creado"
  | "consulta_directa"
  | "analizado"
  | "mensaje_inicial"
  | "respondio"
  | "repesca_enviada"
  | "en_duda"
  | "aprobado"
  | "no_interesado"
  | "baja"
  | "derivado_a_equipo"
  | "escalado_a_humano";

export async function logMarketingEvent({
  leadId,
  contactId,
  type,
  detail = {},
}: {
  leadId: string | null;
  contactId: string;
  type: MarketingEventType;
  detail?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("marketing_events")
    .insert({ lead_id: leadId, contact_id: contactId, event_type: type, detail });
  if (error) console.error("[marketing] No se pudo guardar el evento:", error.message);
}

export async function getLeadByContact(contactId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("marketing_leads")
    .select("*")
    .eq("contact_id", contactId)
    .maybeSingle();
  return data as any | null;
}

/** Busca el lead de un contacto y, si no existe, lo crea. */
export async function ensureLead({
  contactId,
  sourceKind,
  sourceDetail,
  placeId = null,
  website = null,
  mapsData = {},
}: {
  contactId: string;
  sourceKind: "scraper" | "directa";
  sourceDetail: string;
  placeId?: string | null;
  website?: string | null;
  mapsData?: Record<string, unknown>;
}): Promise<{ lead: any; created: boolean }> {
  const supabase = createAdminClient();

  const existing = await getLeadByContact(contactId);
  if (existing) return { lead: existing, created: false };

  const { data: created, error } = await supabase
    .from("marketing_leads")
    .insert({
      contact_id: contactId,
      source_kind: sourceKind,
      source_detail: sourceDetail,
      place_id: placeId,
      website,
      maps_data: mapsData,
    })
    .select()
    .single();

  if (error || !created) {
    // Carrera: otro request lo creó justo antes.
    const winner = await getLeadByContact(contactId);
    if (winner) return { lead: winner, created: false };
    throw new Error(`No se pudo crear el lead de Marketing: ${error?.message}`);
  }

  await logMarketingEvent({
    leadId: created.id,
    contactId,
    type: sourceKind === "directa" ? "consulta_directa" : "lead_creado",
    detail: { origen: sourceDetail },
  });

  return { lead: created, created: true };
}

/** Se llama cuando sale el primer mensaje (plantilla) de la campaña. */
export async function markLeadContacted(contactId: string, hook: string | null) {
  const supabase = createAdminClient();
  const lead = await getLeadByContact(contactId);
  if (!lead) return;
  const now = new Date().toISOString();
  await supabase
    .from("marketing_leads")
    .update({
      outreach_status: "contactado",
      first_contacted_at: lead.first_contacted_at ?? now,
      last_outbound_at: now,
      updated_at: now,
    })
    .eq("id", lead.id);
  await logMarketingEvent({ leadId: lead.id, contactId, type: "mensaje_inicial", detail: { gancho: hook } });
}

/**
 * Se llama en cada mensaje entrante de un contacto de Marketing. Si el
 * contacto no tiene lead todavía, es una consulta DIRECTA y se crea uno
 * (reconociendo la fuente). Si ya estaba contactado o en repesca, pasa a
 * "respondió" y se cancela cualquier seguimiento pendiente.
 */
export async function onMarketingInbound(contact: { id: string; source: string }) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { lead, created } = await ensureLead({
    contactId: contact.id,
    sourceKind: contact.source === "google_maps" ? "scraper" : "directa",
    sourceDetail: sourceDetailFor(contact.source),
  });

  // Cerrado / no interesado: el lead ya está cerrado; solo registramos el mensaje.
  // Dado de baja: si es él quien escribe, se lo atiende y vuelve a estar activo.
  const wasFinal = ["cerrado", "no_interesado"].includes(lead.outreach_status);
  const wasBaja = lead.outreach_status === "baja";

  const update: Record<string, unknown> = { last_inbound_at: now, updated_at: now };
  if (!wasFinal) {
    update.outreach_status = "respondio";
    update.next_followup_at = null;
    if (wasBaja) {
      update.closed_at = null;
      update.closed_reason = null;
      update.followup_count = 0;
    }
  }
  await supabase.from("marketing_leads").update(update).eq("id", lead.id);

  if (wasBaja) {
    await supabase.from("contacts").update({ status: "en_conversacion" }).eq("id", contact.id);
    await supabase
      .from("conversations")
      .update({ status: "en_conversacion" })
      .eq("contact_id", contact.id)
      .eq("status", "cerrado_perdido");
  }

  // Solo contamos "respondió" la primera vez desde cada contacto / repesca.
  if (!created && !wasFinal && lead.outreach_status !== "respondio") {
    await logMarketingEvent({
      leadId: lead.id,
      contactId: contact.id,
      type: "respondio",
      detail: { estado_previo: lead.outreach_status, seguimientos_enviados: lead.followup_count },
    });
  }
}

export type MarketingOutcome = "aprobado" | "en_duda" | "no_interesado";

/** Registra cómo terminó (por ahora) la conversación con el prospecto. */
export async function setMarketingOutcome({
  contactId,
  conversationId,
  resultado,
  motivo,
}: {
  contactId: string;
  conversationId: string;
  resultado: MarketingOutcome;
  motivo: string;
}) {
  const supabase = createAdminClient();
  const lead =
    (await getLeadByContact(contactId)) ??
    (await ensureLead({ contactId, sourceKind: "directa", sourceDetail: "Consulta directa" })).lead;
  const now = new Date();
  const nowIso = now.toISOString();

  if (resultado === "en_duda") {
    // Solo los datos fríos entran en seguimiento semanal automático; una consulta directa
    // también: si dudó, se le hace seguimiento igual (con las mismas reglas).
    await supabase
      .from("marketing_leads")
      .update({
        outreach_status: "repesca",
        followup_count: 0,
        next_followup_at: new Date(now.getTime() + FOLLOWUP_INTERVAL_HOURS * 3600 * 1000).toISOString(),
        updated_at: nowIso,
      })
      .eq("id", lead.id);
    await logMarketingEvent({ leadId: lead.id, contactId, type: "en_duda", detail: { motivo } });
    return;
  }

  if (resultado === "aprobado") {
    await supabase
      .from("marketing_leads")
      .update({
        outreach_status: "cerrado",
        closed_at: nowIso,
        closed_reason: motivo,
        next_followup_at: null,
        updated_at: nowIso,
      })
      .eq("id", lead.id);
    await supabase.from("contacts").update({ status: "cerrado_ganado" }).eq("id", contactId);
    await supabase
      .from("conversations")
      .update({ status: "cerrado_ganado", ai_enabled: false })
      .eq("id", conversationId);
    await logMarketingEvent({ leadId: lead.id, contactId, type: "aprobado", detail: { motivo } });
    await logMarketingEvent({ leadId: lead.id, contactId, type: "derivado_a_equipo" });
    return;
  }

  // no_interesado
  await supabase
    .from("marketing_leads")
    .update({
      outreach_status: "no_interesado",
      closed_at: nowIso,
      closed_reason: motivo,
      next_followup_at: null,
      updated_at: nowIso,
    })
    .eq("id", lead.id);
  await supabase.from("contacts").update({ status: "cerrado_perdido" }).eq("id", contactId);
  await supabase
    .from("conversations")
    .update({ status: "cerrado_perdido", ai_enabled: false })
    .eq("id", conversationId);
  await logMarketingEvent({ leadId: lead.id, contactId, type: "no_interesado", detail: { motivo } });
}

/**
 * Texto que se le agrega al prompt del agente de Marketing con todo lo que
 * el sistema sabe del negocio (análisis) y cómo registrar el resultado.
 * No reemplaza el guion de venta del agente: lo complementa con datos.
 */
export async function buildMarketingBrief(contactId: string): Promise<string> {
  const lead = await getLeadByContact(contactId);

  const lines: string[] = [
    "=== DATOS DEL SISTEMA SOBRE ESTE PROSPECTO (Kocos Marketing) ===",
  ];

  if (!lead) {
    lines.push("Todavía no hay análisis automático de este negocio.");
  } else {
    lines.push(
      `Origen: ${lead.source_kind === "directa" ? "CONSULTA DIRECTA (nos escribió él)" : "Dato frío de Google Maps (le escribimos nosotros primero)"} — ${lead.source_detail ?? "sin detalle"}.`
    );

    if (lead.hook && lead.source_kind === "scraper") {
      lines.push(
        `El mensaje inicial que ya recibió decía, en resumen: "Estuvimos viendo tu negocio en Google y notamos que ${lead.hook}. Armamos una propuesta concreta, ¿querés que te la mostremos?". Seguí desde ahí, sin repetirlo.`
      );
    }

    if (lead.followup_count > 0) {
      lines.push(
        `Este prospecto había quedado en duda y ya le hicimos ${lead.followup_count} seguimiento(s) por WhatsApp. Retomá con calidez lo que charlaron, sin presionar.`
      );
    }

    if (lead.analysis_status === "listo" && lead.analysis) {
      const a = lead.analysis as any;
      lines.push(`Puntaje de oportunidad: ${lead.lead_score}/100 (prioridad ${lead.priority}).`);
      if (lead.summary) lines.push(`Resumen del análisis: ${lead.summary}`);

      const hallazgos: any[] = Array.isArray(a.hallazgos) ? a.hallazgos : [];
      if (hallazgos.length > 0) {
        lines.push("HALLAZGOS DEL ANÁLISIS (verificados por el sistema — son la base de tu diagnóstico y propuesta):");
        hallazgos.slice(0, 10).forEach((h, i) => {
          lines.push(`${i + 1}. [${h.severidad}] ${h.problema} Impacto: ${h.impacto} Mejora propuesta: ${h.mejora}`);
        });
      } else {
        lines.push("El análisis no detectó problemas graves: no inventes fallas, enfocate en crecimiento.");
      }
      if (Array.isArray(a.servicios_sugeridos) && a.servicios_sugeridos.length > 0) {
        lines.push(`Servicios sugeridos por el análisis: ${a.servicios_sugeridos.join(", ")}.`);
      }

      const m = lead.maps_data ?? {};
      const mapsBits = [
        m.rating != null ? `puntaje ${m.rating}` : null,
        m.ratingCount != null ? `${m.ratingCount} reseñas` : null,
        m.photosCount != null ? `${m.photosCount} fotos` : null,
        lead.website ? `web: ${lead.website}` : "sin sitio web",
      ].filter(Boolean);
      lines.push(`Datos de su ficha de Google: ${mapsBits.join(", ")}.`);
      lines.push(
        "Presentá estos hallazgos con transparencia total: decí qué viste, de dónde sale y por qué le afecta. Si no está en esta lista, no lo afirmes."
      );
    } else if (lead.analysis_status === "pendiente" || lead.analysis_status === "analizando") {
      lines.push("El análisis de este negocio todavía se está procesando.");
    } else {
      lines.push(
        "No hay análisis automático de este negocio. Si el prospecto te pasa su sitio web, o el nombre y la zona de su negocio, usá la herramienta analizar_negocio para analizarlo en el momento."
      );
    }
  }

  lines.push(
    "",
    "HERRAMIENTAS DE REGISTRO (obligatorias, el sistema las usa para estadísticas y seguimiento):",
    "- registrar_resultado_marketing con resultado='aprobado': cuando el prospecto ACEPTA la propuesta y quiere avanzar. Después de llamarla, avisale que lo derivás al equipo técnico para empezar a trabajar en el proyecto aprobado y despedite.",
    "- registrar_resultado_marketing con resultado='en_duda': cuando duda, pide pensarlo, o dice que en otro momento. El sistema le hará seguimiento por WhatsApp (un recordatorio a los ~3 días y otro a los ~6). Decile con naturalidad que quedás atento.",
    "- registrar_resultado_marketing con resultado='no_interesado': cuando dice claramente que no quiere o pide que no lo contactemos más. No insistas.",
    "- analizar_negocio: solo para consultas directas, cuando no hay análisis y el prospecto te dio su web o el nombre y la zona de su negocio.",
    "Nunca digas que 'registraste' algo ni menciones herramientas, puntajes internos ni 'el sistema' al prospecto."
  );

  return lines.join("\n");
}
