/**
 * Marketing · venta consultiva y «Pide presupuesto» (16/10).
 *
 *  - La apertura no afirma investigación previa. Cuando la persona acepta
 *    («sí», «dale», «contame»), se marca la etapa y se hace el análisis
 *    profundo con fuentes reales.
 *  - Cierre: el agente pregunta si quiere un presupuesto; si dice que sí,
 *    se registra el pedido (cuenta como captado), se avisa a los números de
 *    aviso y se promete en menos de 24 h. El agente nunca lo arma.
 *  - El equipo sube el archivo en «Pide presupuesto»: con la ventana de 24 h
 *    abierta se envía en el momento; si no, sale la plantilla
 *    mkt_presupuesto_listo y el archivo se envía apenas la persona responda.
 *    Después la IA retoma para cerrar; aprobado = cerrado.
 *  - Se guardan los datos de cada fase (necesidad, servicios, precios,
 *    plazos) para automatizar después.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/profiles";
import { RUBRO_IDS } from "@/lib/rubros";
import { sendWhatsAppMedia, sendWhatsAppTemplate, whatsappCredentials } from "@/lib/whatsapp/client";
import { enlaceFirmado, tipoMedio } from "@/lib/adjuntos/salientes";
import { insertMessageRow } from "@/lib/messaging";
import { manualContactCheck } from "@/lib/detention";
import { logMarketingEvent } from "./leads";
import { derivarPorPresupuesto } from "./derivar-presupuesto";
import { getAutomationPause } from "@/lib/automation-pause";
import { loadContactCalendar } from "@/lib/contacto/calendario";
import { isContactAllowed } from "@/lib/contacto/reglas";
import { describirProgramacion, validarProgramacion } from "./programacion";
import {
  avanzarEtapa,
  fusionarDatosVenta,
  guiaVenta,
  textoEnvioPresupuesto,
  ventanaAbierta,
  type DatosVenta,
  type EtapaVenta,
} from "./venta";

export const BUCKET_PRESUPUESTOS = "presupuestos";

/** Documento por enlace (solo dentro de la ventana de 24 h). Meta lo descarga del enlace firmado. */
async function sendWhatsAppDocument(to: string, link: string, filename: string, caption: string, credentialKey: string | null) {
  const { phoneNumberId, accessToken } = whatsappCredentials("marketing", credentialKey);
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "document", document: { link, filename: filename.slice(0, 200), caption: caption.slice(0, 1000) } }),
    signal: AbortSignal.timeout(20_000),
  });
  const raw = await res.text();
  if (!res.ok) throw new PresupuestoError(`WhatsApp no aceptó el documento (${res.status}): ${raw.slice(0, 300)}`, 502);
  const j = raw ? JSON.parse(raw) : {};
  if (!j?.messages?.[0]?.id) throw new PresupuestoError("Meta respondió sin el identificador del mensaje: no se puede confirmar el envío.", 502);
  return j;
}
export const PLANTILLA_PRESUPUESTO = "mkt_presupuesto_listo";

export class PresupuestoError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "PresupuestoError";
  }
}

const ahora = () => new Date().toISOString();

async function leadDe(contactId: string) {
  const { data } = await createAdminClient().from("marketing_leads").select("*").eq("contact_id", contactId).maybeSingle();
  return data as any;
}

/** Cambia la etapa (solo hacia adelante) y suma datos de venta. */
export async function registrarVenta(contactId: string, input: { etapa?: EtapaVenta; datos?: DatosVenta }) {
  const s = createAdminClient();
  const lead = await leadDe(contactId);
  if (!lead) return null;
  const etapa = input.etapa ? avanzarEtapa(lead.sale_stage, input.etapa) : lead.sale_stage;
  const cambios: Record<string, unknown> = { updated_at: ahora() };
  if (etapa !== lead.sale_stage) {
    cambios.sale_stage = etapa;
    if (etapa === "acepto" && !lead.accepted_at) cambios.accepted_at = ahora();
    if (etapa === "propuesta" && !lead.proposal_at) cambios.proposal_at = ahora();
    if (etapa === "presupuesto_pedido" && !lead.budget_requested_at) cambios.budget_requested_at = ahora();
    if (etapa === "presupuesto_enviado" && !lead.budget_sent_at) cambios.budget_sent_at = ahora();
    if (etapa === "cerrado" && !lead.closed_won_at) cambios.closed_won_at = ahora();
  }
  if (input.datos) cambios.sale_data = fusionarDatosVenta(lead.sale_data, input.datos);
  await s.from("marketing_leads").update(cambios).eq("id", lead.id);
  if (etapa !== lead.sale_stage) {
    await logMarketingEvent({ leadId: lead.id, contactId, type: `etapa_${etapa}`, detail: input.datos ? { datos: input.datos } : {} }).catch(() => {});
  }
  return { ...lead, ...cambios };
}

/**
 * Si la persona aceptó escuchar (respuesta a la apertura), marca la etapa
 * y deja el análisis profundo pendiente. Devuelve true si recién aceptó.
 */
export async function marcarAceptacion(contactId: string): Promise<boolean> {
  const lead = await leadDe(contactId);
  if (!lead || lead.sale_stage !== "apertura") return false;
  await registrarVenta(contactId, { etapa: "acepto" });
  if (["no_iniciado", "error", "omitido"].includes(lead.analysis_status)) {
    await createAdminClient().from("marketing_leads").update({ analysis_status: "pendiente", updated_at: ahora() }).eq("id", lead.id);
  }
  return true;
}

/** Pedido de presupuesto desde la conversación (herramienta del agente). */
export async function pedirPresupuesto(input: {
  contactId: string;
  opportunityId: string | null;
  conversationId: string;
  detalle: string;
  servicios?: string[];
  presupuestoMencionado?: string | null;
  urgencia?: string | null;
}) {
  const s = createAdminClient();
  const lead = await leadDe(input.contactId);
  const { data: abierto } = await s
    .from("marketing_budgets")
    .select("id")
    .eq("contact_id", input.contactId)
    .in("estado", ["pedido", "listo"])
    .limit(1)
    .maybeSingle();
  if (abierto) return { id: (abierto as any).id as string, nuevo: false };
  const { data, error } = await s
    .from("marketing_budgets")
    .insert({
      lead_id: lead?.id ?? null,
      contact_id: input.contactId,
      opportunity_id: input.opportunityId,
      conversation_id: input.conversationId,
      detalle_pedido: input.detalle.slice(0, 2000) || "(sin detalle)",
      servicios: (input.servicios ?? []).slice(0, 10).map((x) => String(x).slice(0, 120)),
      presupuesto_mencionado: input.presupuestoMencionado?.slice(0, 200) ?? null,
      urgencia: input.urgencia?.slice(0, 200) ?? null,
    })
    .select("id")
    .single();
  if (error) throw new PresupuestoError(error.message, 500);
  await registrarVenta(input.contactId, {
    etapa: "presupuesto_pedido",
    datos: { necesidad: input.detalle.slice(0, 500), servicios_conversados: input.servicios ?? [], ...(input.presupuestoMencionado ? { presupuesto_cliente: input.presupuestoMencionado } : {}) },
  });
  return { id: (data as any).id as string, nuevo: true };
}

/** Presupuesto aprobado en la conversación → cerrado. */
export async function aprobarPresupuesto(input: { contactId: string; evidencia: string }) {
  const s = createAdminClient();
  const { data: b } = await s
    .from("marketing_budgets")
    .select("id")
    .eq("contact_id", input.contactId)
    .in("estado", ["enviado", "listo", "pedido"])
    .order("pedido_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (b) {
    await s.from("marketing_budgets").update({ estado: "aprobado", respuesta_at: ahora(), resultado_detalle: input.evidencia.slice(0, 1000), updated_at: ahora() }).eq("id", (b as any).id);
  }
  await registrarVenta(input.contactId, { etapa: "cerrado" });
  const lead = await leadDe(input.contactId);
  if (lead) {
    await s.from("marketing_leads").update({ outreach_status: "cerrado", closed_at: ahora(), closed_reason: "Presupuesto aprobado", updated_at: ahora() }).eq("id", lead.id);
  }
  return { ok: true, presupuestoId: (b as any)?.id ?? null };
}

/** Enlace firmado para subir el archivo del presupuesto (bucket privado). */
export async function urlSubidaPresupuesto(budgetId: string, nombreArchivo: string) {
  const ext = (nombreArchivo.split(".").pop() ?? "pdf").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "pdf";
  if (!["pdf", "png", "jpg", "jpeg", "doc", "docx", "xls", "xlsx"].includes(ext)) throw new PresupuestoError("Formato no admitido: subí PDF, imagen, Word o Excel.");
  const path = `${budgetId}/${Date.now()}.${ext}`;
  const { data, error } = await createAdminClient().storage.from(BUCKET_PRESUPUESTOS).createSignedUploadUrl(path);
  if (error || !data) throw new PresupuestoError(`No se pudo preparar la subida: ${error?.message ?? "sin enlace"}`, 500);
  return { path, token: (data as any).token as string, signedUrl: (data as any).signedUrl as string };
}

async function enviarDocumento(budget: any, conv: any) {
  const s = createAdminClient();
  const to = conv.contacts?.phone;
  if (!to) throw new PresupuestoError("El contacto no tiene teléfono.");
  const check = await manualContactCheck(conv.contact_id, conv.id);
  if (!check.allowed) throw new PresupuestoError(check.reason ?? "Contacto detenido.", 409);
  const { data: firmado, error } = await s.storage.from(BUCKET_PRESUPUESTOS).createSignedUrl(budget.archivo_path, 3600);
  if (error || !firmado?.signedUrl) throw new PresupuestoError("No se pudo abrir el archivo guardado.", 500);
  const caption = textoEnvioPresupuesto({ nombre: conv.contacts?.full_name, monto: budget.monto != null ? Number(budget.monto) : null, moneda: budget.moneda, plazo: budget.plazo_entrega });
  const credentialKey = conv.profile_lines?.active ? conv.profile_lines.credential_key : null;
  const r: any = await sendWhatsAppDocument(to, firmado.signedUrl, budget.archivo_nombre ?? "presupuesto.pdf", caption, credentialKey);
  const sentAt = ahora();
  await insertMessageRow(s, {
    conversation_id: conv.id,
    sender_type: "admin",
    direction: "saliente",
    body: `[Presupuesto enviado: ${budget.archivo_nombre ?? "archivo"}] ${caption}`,
    external_message_id: r?.messages?.[0]?.id ?? null,
    delivery_status: "enviado",
    delivery_status_at: sentAt,
    origin: "atencion_humana",
  });
  // Fotos o videos que acompañan al presupuesto (22/10), después del archivo.
  for (const a of (Array.isArray(budget.adjuntos) ? budget.adjuntos : []) as { path: string; nombre?: string }[]) {
    const kind = tipoMedio(a.path);
    if (!kind) continue;
    try {
      const rm: any = await sendWhatsAppMedia("marketing", to, { kind, link: await enlaceFirmado(a.path) }, { credentialKey });
      await insertMessageRow(s, {
        conversation_id: conv.id,
        sender_type: "admin",
        direction: "saliente",
        body: `[${kind === "image" ? "Foto" : "Video"} del presupuesto${a.nombre ? `: ${a.nombre}` : ""}]`,
        message_type: kind,
        metadata: { saliente_path: a.path, saliente_bucket: "chat-salientes" },
        external_message_id: rm?.messages?.[0]?.id ?? null,
        delivery_status: "enviado",
        delivery_status_at: ahora(),
        origin: "atencion_humana",
      });
    } catch (err) {
      console.error("[presupuesto] No se pudo enviar un adjunto:", err);
    }
  }
  await s.from("marketing_budgets").update({ estado: "enviado", enviado_at: sentAt, enviado_via: budget.plantilla_pendiente ? "plantilla" : "ventana", plantilla_pendiente: false, updated_at: sentAt }).eq("id", budget.id);
  // La IA retoma para cerrar.
  await s.from("conversations").update({ ai_enabled: true, status: "en_conversacion", last_message_at: sentAt }).eq("id", conv.id);
  await registrarVenta(conv.contact_id, { etapa: "presupuesto_enviado" });
  // 24/10: con el presupuesto enviado, deja de figurar como «captado para derivar».
  await derivarPorPresupuesto(conv.contact_id, sentAt);
}

async function conversacionDe(budget: any) {
  const s = createAdminClient();
  let convId = budget.conversation_id as string | null;
  if (!convId) {
    const { data } = await s.from("conversations").select("id").eq("contact_id", budget.contact_id).eq("area", "marketing").order("last_message_at", { ascending: false, nullsFirst: false }).limit(1).maybeSingle();
    convId = (data as any)?.id ?? null;
  }
  if (!convId) throw new PresupuestoError("No hay conversación de WhatsApp con este contacto.", 409);
  const { data: conv } = await s
    .from("conversations")
    .select("id, contact_id, area, line_id, contacts(full_name, phone, qualification_data), profile_lines(credential_key, active)")
    .eq("id", convId)
    .single();
  const { data: ultimo } = await s.from("messages").select("created_at").eq("conversation_id", convId).eq("direction", "entrante").order("created_at", { ascending: false }).limit(1).maybeSingle();
  return { conv: conv as any, ultimoEntrante: ((ultimo as any)?.created_at ?? null) as string | null };
}

/**
 * El equipo cargó el archivo: guarda los datos y lo envía (ventana abierta)
 * o manda la plantilla de aviso y lo deja listo para cuando responda.
 */
export async function cargarYEnviarPresupuesto(input: {
  budgetId: string;
  archivoPath: string;
  archivoNombre: string;
  archivoMime?: string | null;
  monto?: number | null;
  moneda?: "ARS" | "USD" | null;
  alcance?: string | null;
  plazo?: string | null;
  notas?: string | null;
  /** «AAAA-MM-DDTHH:mm» en hora de Buenos Aires. Sin valor: sale en el momento. */
  programadoPara?: string | null;
  /** Fotos o videos que acompañan (22/10), subidos antes con «subida_extra». */
  adjuntos?: { path: string; nombre?: string }[];
}): Promise<{ estado: "enviado" | "aviso_enviado" | "listo" | "programado"; detalle: string }> {
  const s = createAdminClient();
  const { data: b } = await s.from("marketing_budgets").select("*").eq("id", input.budgetId).maybeSingle();
  if (!b) throw new PresupuestoError("Presupuesto inexistente.", 404);
  if (!["pedido", "listo"].includes((b as any).estado)) throw new PresupuestoError(`El presupuesto está «${(b as any).estado}».`, 409);
  if (!input.archivoPath.startsWith(`${input.budgetId}/`)) throw new PresupuestoError("El archivo no corresponde a este presupuesto.", 400);
  let programado: Date | null = null;
  if (input.programadoPara) {
    const { calendar } = await loadContactCalendar();
    const v = validarProgramacion(input.programadoPara, new Date(), calendar);
    if (!v.ok) throw new PresupuestoError(v.error, 400);
    programado = v.instante;
  }
  await s
    .from("marketing_budgets")
    .update({
      estado: "listo",
      archivo_path: input.archivoPath,
      archivo_nombre: input.archivoNombre.slice(0, 200),
      archivo_mime: input.archivoMime ?? null,
      monto: input.monto ?? null,
      moneda: input.moneda ?? null,
      alcance: input.alcance?.slice(0, 2000) ?? null,
      plazo_entrega: input.plazo?.slice(0, 200) ?? null,
      notas: input.notas?.slice(0, 2000) ?? null,
      adjuntos: (input.adjuntos ?? [])
        .filter((a) => typeof a?.path === "string" && a.path.startsWith(`presupuesto-${input.budgetId}/`) && tipoMedio(a.path))
        .slice(0, 10)
        .map((a) => ({ path: a.path, nombre: String(a.nombre ?? "").slice(0, 200) })),
      listo_at: ahora(),
      updated_at: ahora(),
    })
    .eq("id", input.budgetId);
  await registrarVenta((b as any).contact_id, {
    datos: {
      ...(input.monto != null && input.moneda ? { precios_mencionados: [`Presupuesto: ${input.moneda} ${input.monto}`] } : {}),
      ...(input.plazo ? { notas: [`Plazo de entrega ofrecido: ${input.plazo}`] } : {}),
    },
  });
  if (programado) {
    await s
      .from("marketing_budgets")
      .update({ envio_programado_at: programado.toISOString(), programado_procesado_at: null, programado_error: null, updated_at: ahora() })
      .eq("id", input.budgetId);
    return { estado: "programado", detalle: `Presupuesto guardado. Sale solo el ${describirProgramacion(programado)} (hora de Buenos Aires).` };
  }
  await s.from("marketing_budgets").update({ envio_programado_at: null, updated_at: ahora() }).eq("id", input.budgetId);
  return despacharPresupuesto(input.budgetId);
}

/**
 * Manda un presupuesto «listo» con su archivo: con la ventana de 24 h abierta
 * sale el documento; si no, la plantilla de aviso y el archivo queda para
 * cuando la persona responda.
 */
async function despacharPresupuesto(budgetId: string): Promise<{ estado: "enviado" | "aviso_enviado" | "listo"; detalle: string }> {
  const s = createAdminClient();
  const input = { budgetId };
  const { data: listo } = await s.from("marketing_budgets").select("*").eq("id", budgetId).single();
  if (!listo || (listo as any).estado !== "listo" || !(listo as any).archivo_path) throw new PresupuestoError("El presupuesto no tiene archivo cargado o ya no está listo.", 409);
  const { conv, ultimoEntrante } = await conversacionDe(listo);
  if (ventanaAbierta(ultimoEntrante)) {
    await enviarDocumento(listo, conv);
    return { estado: "enviado", detalle: "La ventana de 24 h estaba abierta: el presupuesto se envió y la IA retoma la conversación para cerrar." };
  }
  // Fuera de la ventana: plantilla aprobada de aviso.
  const { data: tpl } = await s.from("whatsapp_templates").select("name, language, status").eq("name", PLANTILLA_PRESUPUESTO).eq("status", "APPROVED").limit(1).maybeSingle();
  if (!tpl) {
    await s.from("marketing_budgets").update({ plantilla_pendiente: true, updated_at: ahora() }).eq("id", input.budgetId);
    return { estado: "listo", detalle: `La ventana de 24 h está cerrada y la plantilla ${PLANTILLA_PRESUPUESTO} todavía no figura aprobada en el catálogo. El archivo quedó listo y se envía apenas la persona escriba.` };
  }
  const nombre = (conv.contacts?.full_name ?? "").split(" ")[0] || "¿cómo estás?";
  const negocio = (conv.contacts?.qualification_data?.rubro_buscado as string) || "tu negocio";
  const credentialKey = conv.profile_lines?.active ? conv.profile_lines.credential_key : null;
  const r: any = await sendWhatsAppTemplate("marketing", conv.contacts?.phone, (tpl as any).name, (tpl as any).language, [nombre, negocio], { credentialKey });
  await insertMessageRow(s, {
    conversation_id: conv.id,
    sender_type: "admin",
    direction: "saliente",
    body: `[Plantilla ${PLANTILLA_PRESUPUESTO}] Aviso de presupuesto listo.`,
    external_message_id: r?.messages?.[0]?.id ?? null,
    delivery_status: "enviado",
    delivery_status_at: ahora(),
    origin: "atencion_humana",
  });
  await s.from("marketing_budgets").update({ plantilla_pendiente: true, updated_at: ahora() }).eq("id", input.budgetId);
  return { estado: "aviso_enviado", detalle: "La ventana estaba cerrada: salió la plantilla de aviso. El archivo se envía solo apenas la persona responda." };
}

/**
 * Al llegar un mensaje: si hay un presupuesto listo esperando, se envía ahora
 * (ventana abierta) y la IA retoma la venta. Desde el 21/10 también sale el
 * programado aunque todavía no haya llegado su hora: si la persona escribe,
 * se aprovecha la conversación (pedido de la responsable).
 */
export async function entregarPresupuestoPendiente(conversationId: string): Promise<boolean> {
  const s = createAdminClient();
  const { data: conv } = await s
    .from("conversations")
    .select("id, contact_id, area, line_id, contacts(full_name, phone, qualification_data), profile_lines(credential_key, active)")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conv || (conv as any).area !== "marketing") return false;
  const { data: b } = await s
    .from("marketing_budgets")
    .select("*")
    .eq("contact_id", (conv as any).contact_id)
    .eq("estado", "listo")
    .not("archivo_path", "is", null)
    .order("listo_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!b) return false;
  const programadoPendiente = !!(b as any).envio_programado_at && !(b as any).programado_procesado_at;
  if (programadoPendiente) {
    // Se toma el programado para que el latido no lo mande otra vez.
    const marca = ahora();
    const { data: tomado } = await s
      .from("marketing_budgets")
      .update({ programado_procesado_at: marca, updated_at: marca })
      .eq("id", (b as any).id)
      .is("programado_procesado_at", null)
      .select("id")
      .maybeSingle();
    if (!tomado) return false; // el latido lo está mandando en este momento
  }
  try {
    await enviarDocumento(b, conv);
  } catch (err) {
    // Si falla, el programado vuelve a quedar para su hora.
    if (programadoPendiente) await s.from("marketing_budgets").update({ programado_procesado_at: null, updated_at: ahora() }).eq("id", (b as any).id);
    throw err;
  }
  return true;
}

/**
 * Latido: manda los presupuestos programados cuya hora ya llegó (21/10).
 * Respeta la pausa general y el horario de salidas de la empresa (si el
 * latido llega tarde y ya son las 21, espera a la próxima franja). Cada uno
 * se toma una sola vez (marca atómica): si el envío falla, queda el error a
 * la vista y no se reintenta solo.
 */
export async function enviarPresupuestosProgramados(ahoraFecha = new Date(), limite = 3): Promise<{ enviados: number; pendientes: string[] }> {
  const s = createAdminClient();
  const { data: vencidos } = await s
    .from("marketing_budgets")
    .select("id")
    .eq("estado", "listo")
    .not("archivo_path", "is", null)
    .is("programado_procesado_at", null)
    .lte("envio_programado_at", ahoraFecha.toISOString())
    .order("envio_programado_at", { ascending: true })
    .limit(limite);
  if (!vencidos?.length) return { enviados: 0, pendientes: [] };
  const pausa = await getAutomationPause();
  if (pausa.outboundPaused) return { enviados: 0, pendientes: [`${vencidos.length} presupuesto(s) retenido(s) por la pausa general`] };
  const { calendar } = await loadContactCalendar(ahoraFecha);
  if (!isContactAllowed(ahoraFecha, calendar)) return { enviados: 0, pendientes: [`${vencidos.length} presupuesto(s) esperan la próxima franja de envío`] };

  let enviados = 0;
  const pendientes: string[] = [];
  for (const v of vencidos as { id: string }[]) {
    const marca = ahora();
    const { data: tomado } = await s
      .from("marketing_budgets")
      .update({ programado_procesado_at: marca, updated_at: marca })
      .eq("id", v.id)
      .is("programado_procesado_at", null)
      .select("id")
      .maybeSingle();
    if (!tomado) continue; // otro latido ya lo tomó
    try {
      const r = await despacharPresupuesto(v.id);
      if (r.estado !== "listo") enviados++;
      else pendientes.push(r.detalle);
    } catch (err: any) {
      const detalle = String(err?.message ?? err).slice(0, 500);
      await s.from("marketing_budgets").update({ programado_error: detalle, updated_at: ahora() }).eq("id", v.id);
      pendientes.push(detalle);
    }
  }
  return { enviados, pendientes };
}

/** Cambia la hora programada, la quita o lo manda ya («ahora»). */
export async function reprogramarPresupuesto(budgetId: string, cuando: string): Promise<{ estado: string; detalle: string }> {
  const s = createAdminClient();
  const { data: b } = await s.from("marketing_budgets").select("id, estado, archivo_path, programado_procesado_at").eq("id", budgetId).maybeSingle();
  if (!b) throw new PresupuestoError("Presupuesto inexistente.", 404);
  if ((b as any).estado !== "listo" || !(b as any).archivo_path) throw new PresupuestoError("Solo se puede reprogramar un presupuesto con archivo que todavía no salió.", 409);
  if (cuando === "ahora") {
    await s.from("marketing_budgets").update({ envio_programado_at: null, programado_procesado_at: null, programado_error: null, updated_at: ahora() }).eq("id", budgetId);
    return despacharPresupuesto(budgetId);
  }
  const { calendar } = await loadContactCalendar();
  const v = validarProgramacion(cuando, new Date(), calendar);
  if (!v.ok) throw new PresupuestoError(v.error, 400);
  await s
    .from("marketing_budgets")
    .update({ envio_programado_at: v.instante.toISOString(), programado_procesado_at: null, programado_error: null, plantilla_pendiente: false, updated_at: ahora() })
    .eq("id", budgetId);
  return { estado: "programado", detalle: `Reprogramado: sale el ${describirProgramacion(v.instante)} (hora de Buenos Aires).` };
}

/**
 * Presupuesto cargado por el equipo sin que la persona lo haya pedido por el
 * agente (21/10): se abre sobre una conversación de Marketing existente.
 */
export async function crearPresupuestoManual(input: { conversationId: string; detalle: string }): Promise<{ id: string; nuevo: boolean }> {
  const s = createAdminClient();
  const { data: conv } = await s.from("conversations").select("id, contact_id, area").eq("id", input.conversationId).maybeSingle();
  if (!conv || (conv as any).area !== "marketing") throw new PresupuestoError("Elegí una conversación de Kocos Marketing.", 400);
  const { data: opp } = await s.from("opportunities").select("id").eq("contact_id", (conv as any).contact_id).eq("area", "marketing").order("created_at", { ascending: false }).limit(1).maybeSingle();
  return pedirPresupuesto({
    contactId: (conv as any).contact_id,
    opportunityId: (opp as any)?.id ?? null,
    conversationId: (conv as any).id,
    detalle: input.detalle.trim() || "Presupuesto cargado por el equipo",
  });
}

/** Guía de venta + presupuesto para el contexto del agente de Marketing. */
export async function briefVenta(contactId: string): Promise<string> {
  const lead = await leadDe(contactId);
  if (!lead || lead.sale_stage == null) return "";
  // Contactados con la apertura vieja (antes del 16/10): los guía buildMarketingBrief.
  if (lead.source_kind === "scraper" && !lead.extraction_id && lead.sale_stage === "apertura") return "";
  const profile = await getProfile(RUBRO_IDS.marketing);
  const { data: b } = await createAdminClient()
    .from("marketing_budgets")
    .select("estado, monto, moneda, alcance, plazo_entrega")
    .eq("contact_id", contactId)
    .order("pedido_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const lineas = guiaVenta({
    etapa: lead.sale_stage,
    origen: lead.source_kind === "directa" ? "directa" : "scraper",
    presentacion: profile?.agent_presentation_name?.trim() ?? "",
    marca: profile?.brand_name?.trim() ?? "",
    analisisListo: lead.analysis_status === "listo",
    presupuesto: b ? { estado: (b as any).estado, monto: (b as any).monto != null ? Number((b as any).monto) : null, moneda: (b as any).moneda, alcance: (b as any).alcance, plazo: (b as any).plazo_entrega } : null,
  });
  const d = lead.sale_data ?? {};
  const sabido = [
    d.necesidad ? `Necesidad: ${d.necesidad}` : null,
    d.servicios_conversados?.length ? `Servicios conversados: ${d.servicios_conversados.join(", ")}` : null,
    d.objeciones?.length ? `Objeciones: ${d.objeciones.join("; ")}` : null,
    d.plazo_deseado ? `Plazo deseado: ${d.plazo_deseado}` : null,
  ].filter(Boolean);
  return ["=== VENTA CONSULTIVA (etapa: " + lead.sale_stage + ") ===", ...lineas, ...(sabido.length ? ["Lo que ya sabés:", ...sabido] : [])].join("\n");
}
