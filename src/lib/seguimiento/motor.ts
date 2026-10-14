import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAutomationPause } from "@/lib/automation-pause";
import { loadContactCalendar } from "@/lib/contacto/calendario";
import {
  chooseFollowupSlot,
  decideAtExecution,
  formatArgentina,
  type ContactCalendar,
  type ExecutionDecision,
} from "@/lib/contacto/reglas";
import { decideCircuit, GATE_REASON_TEXT, type SentStep } from "@/lib/seguimiento/circuito";
import { purposeTemplateCheck, recordTemplateSendError } from "@/lib/plantillas";
import { buildBodyParameters, previewBody } from "@/lib/plantillas/catalogo";
import { sendWhatsAppTemplate } from "@/lib/whatsapp/client";
import { classifySendFailure, failureNote, MAX_TRANSIENT_ATTEMPTS } from "@/lib/envios/errores";
import { setOpportunityState, logOpportunityEvent } from "@/lib/opportunities";
import { getProfile, getLine, getProfileLines, type ProfileLine } from "@/lib/profiles";
import type { Area } from "@/lib/supabase/database.types";

/**
 * Etapa 2 · Bloque 2.3 — Motor del seguimiento general (cuatro perfiles).
 *
 * Planificador: busca conversaciones interrumpidas (nuestro último mensaje sin
 * respuesta) de quien respondió y programa el contacto 2 o 3 en la franja
 * válida más cercana al valor objetivo del perfil (bloque 2.0), o detiene el
 * circuito cuando corresponde. Recorre las candidatas por páginas: las
 * interrupciones anteriores a la activación, las de más de 72 horas y las ya
 * descartadas no vuelven a la lista ni tapan a las nuevas.
 *
 * Ejecutor: manda las tareas vencidas con la plantilla aprobada del propósito
 * "seguimiento" de la línea. La línea tiene que ser del perfil de la tarea y
 * de la conversación; si no, no se envía. Antes de reservar vuelve a leer el
 * calendario y la hora, reserva la tarea (una sola ejecución puede enviarla),
 * pasa por la compuerta de la base (pausa general, línea y datos
 * coherentes, chat tomado, oportunidad cerrada, detención, respuesta de la
 * persona) y, justo antes de llamar a Meta, comprueba otra vez la hora y el
 * plazo. Un resultado incierto queda a revisar y nunca se reenvía solo.
 *
 * Nada corre si la pausa general de envíos está activa o si el seguimiento
 * del perfil está apagado (se activa a mano en Configuración del perfil).
 */

const LEASE_SECONDS = 600;
const SAVE_RETRIES = 3;
const DEFAULT_PAGE_SIZE = 200;
const DEFAULT_MAX_PAGES = 10;

type Db = ReturnType<typeof createAdminClient>;

export interface PlanResult {
  skipped?: string;
  /** Candidatas que el circuito revisó en esta vuelta (todas las páginas). */
  revisadas: number;
  programadas: number;
  conflictos: number;
  detenidas: number;
  sinCambios: number;
}

function hoursText(h: number) {
  return `${h} h`;
}

/**
 * Programa o detiene el circuito de las conversaciones interrumpidas.
 * `limit` es el tamaño de cada página y `maxPages` el tope de páginas por vuelta.
 */
export async function planFollowups(opts: { now?: Date; limit?: number; maxPages?: number } = {}): Promise<PlanResult> {
  const now = opts.now ?? new Date();
  const result: PlanResult = { revisadas: 0, programadas: 0, conflictos: 0, detenidas: 0, sinCambios: 0 };
  const pause = await getAutomationPause();
  if (pause.outboundPaused) return { ...result, skipped: "Pausa general de envíos automáticos activa" };
  const { calendar, error: calendarError } = await loadContactCalendar(now);
  if (calendarError) return { ...result, skipped: calendarError };

  const supabase = createAdminClient();
  const pageSize = Math.max(1, Math.min(opts.limit ?? DEFAULT_PAGE_SIZE, 1000));
  const maxPages = Math.max(1, opts.maxPages ?? DEFAULT_MAX_PAGES);
  let after: { at: string; id: string } | null = null;

  for (let page = 0; page < maxPages; page++) {
    const { data: rows, error } = await supabase.rpc("followup_candidates", {
      p_limit: pageSize,
      p_now: now.toISOString(),
      p_after_at: after?.at ?? null,
      p_after_id: after?.id ?? null,
    });
    if (error) return { ...result, skipped: `No se pudieron leer las candidatas: ${error.message}` };
    const list = (rows ?? []) as any[];
    for (const row of list) {
      result.revisadas++;
      await planOne(supabase, row, now, calendar, result);
    }
    if (list.length < pageSize) break;
    const last = list[list.length - 1];
    after = { at: String(last.last_at), id: String(last.opportunity_id) };
  }
  return result;
}

async function planOne(supabase: Db, row: any, now: Date, calendar: ContactCalendar, result: PlanResult) {
  const sent: SentStep[] = ((row.sent ?? []) as any[]).map((s) => ({ step: s.step, sentAt: new Date(s.sent_at) }));
  const decision = decideCircuit(
    {
      lastMessage: { direction: "saliente", senderType: row.last_sender, at: new Date(row.last_at), id: row.last_message_id },
      lastInboundAt: row.last_inbound_at ? new Date(row.last_inbound_at) : null,
      sent,
    },
    { enabledSince: new Date(row.enabled_since), now }
  );

  if (decision.action === "nada") {
    result.sinCambios++;
    return;
  }

  if (decision.action === "detener") {
    await setOpportunityState({
      opportunityId: row.opportunity_id,
      dimension: "seguimiento",
      field: "followup_state",
      value: decision.state,
      actor: "sistema",
      reason: decision.reason,
      extra: {
        followup_reason: decision.reason,
        followup_next_at: null,
        ...(decision.repesca ? { followup_exhausted_at: now.toISOString() } : {}),
      },
    });
    result.detenidas++;
    return;
  }

  // Programar el contacto 2 o 3.
  const slot = chooseFollowupSlot(decision.baseAt, { targetHours: row.target_hours, calendar, notBefore: now });
  const insert = {
    rubro_id: row.rubro_id,
    opportunity_id: row.opportunity_id,
    contact_id: row.contact_id,
    conversation_id: row.conversation_id,
    step: decision.step,
    base_at: decision.baseAt.toISOString(),
    base_message_id: decision.baseMessageId,
    target_hours: row.target_hours,
    scheduled_at: slot.ok ? slot.at.toISOString() : null,
    offset_hours: slot.ok ? slot.offsetHours : null,
    status: slot.ok ? "programada" : "conflicto",
    status_reason: slot.ok ? null : slot.detail,
  };
  const { data: task, error: insErr } = await supabase.from("followup_tasks").insert(insert).select("id").maybeSingle();
  if (insErr) {
    // Otra ejecución ya la programó (una misma interrupción no genera dos tareas).
    if ((insErr as any).code === "23505") {
      result.sinCambios++;
      return;
    }
    throw new Error(`No se pudo programar el seguimiento: ${insErr.message}`);
  }
  if (slot.ok) {
    result.programadas++;
    await setOpportunityState({
      opportunityId: row.opportunity_id,
      dimension: "seguimiento",
      field: "followup_state",
      value: "activo",
      actor: "sistema",
      reason: `Contacto ${decision.step} programado para el ${formatArgentina(slot.at)} (${hoursText(slot.offsetHours)})`,
      extra: { followup_next_at: slot.at.toISOString(), followup_reason: `Contacto ${decision.step} programado` },
      detail: { tarea: task?.id },
    });
  } else {
    result.conflictos++;
    await logOpportunityEvent({
      opportunityId: row.opportunity_id,
      actor: "sistema",
      dimension: "seguimiento",
      to: "conflicto",
      reason: slot.detail,
      detail: { tarea: task?.id, contacto: decision.step },
    });
  }
}

export interface ExecResult {
  taskId: string;
  action: "esperar" | "reprogramada" | "conflicto" | "pendiente" | "cancelada" | "liberada" | "enviada" | "a_revisar" | "fallida" | "ocupada";
  detail?: string;
}

/**
 * Manda (como máximo `max`) tareas vencidas. `clock` da la hora real de cada
 * comprobación (por defecto, la del sistema; en las pruebas, la simulada).
 */
export async function runDueFollowups(
  opts: { now?: Date; max?: number; clock?: () => Date } = {}
): Promise<{ skipped?: string; results: ExecResult[] }> {
  const now = opts.now ?? new Date();
  const supabase = createAdminClient();
  await supabase.rpc("followup_recover_stale", { p_lease_seconds: LEASE_SECONDS });

  const pause = await getAutomationPause();
  if (pause.outboundPaused) return { skipped: "Pausa general de envíos automáticos activa", results: [] };
  const { calendar, error: calendarError } = await loadContactCalendar(now);
  if (calendarError) return { skipped: calendarError, results: [] };

  const { data: tasks, error } = await supabase
    .from("followup_tasks")
    .select("*")
    .in("status", ["programada", "pendiente"])
    .lte("scheduled_at", now.toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(opts.max ?? 5);
  if (error) return { skipped: `No se pudieron leer las tareas: ${error.message}`, results: [] };

  // Reloj de cada comprobación y del envío: el real; en las pruebas, el simulado.
  const clock = opts.clock ?? (opts.now ? () => opts.now as Date : () => new Date());
  const results: ExecResult[] = [];
  for (const task of (tasks ?? []) as any[]) {
    results.push(await processTask(supabase, task, now, calendar, clock));
  }
  return { results };
}

async function updateTask(supabase: Db, id: string, fields: Record<string, unknown>) {
  const { error } = await supabase
    .from("followup_tasks")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["programada", "pendiente"]);
  if (error) throw new Error(`No se pudo actualizar la tarea de seguimiento: ${error.message}`);
}

async function finish(
  supabase: Db,
  taskId: string,
  token: string,
  status: string,
  reason: string | null,
  extra: { messageId?: string | null; externalId?: string | null; sentAt?: string | null } = {}
): Promise<boolean> {
  for (let i = 0; i < SAVE_RETRIES; i++) {
    const { data, error } = await supabase.rpc("followup_finish", {
      p_task: taskId,
      p_token: token,
      p_status: status,
      p_reason: reason,
      p_message_id: extra.messageId ?? null,
      p_external_id: extra.externalId ?? null,
      p_sent_at: extra.sentAt ?? null,
    });
    if (!error) return data === true;
  }
  return false;
}

/**
 * Devuelve una tarea reservada sin haber intentado el envío: no cuenta como
 * intento y borra la marca de inicio. Sirve para la pausa general, un error de
 * la compuerta, una línea que no corresponde o la hora que dejó de valer.
 */
async function release(
  supabase: Db,
  taskId: string,
  token: string,
  status: "programada" | "pendiente" | "conflicto",
  reason: string | null,
  schedule: { at: Date; offsetHours: number } | null = null
): Promise<boolean> {
  for (let i = 0; i < SAVE_RETRIES; i++) {
    const { data, error } = await supabase.rpc("followup_release", {
      p_task: taskId,
      p_token: token,
      p_status: status,
      p_reason: reason,
      p_scheduled_at: schedule ? schedule.at.toISOString() : null,
      p_offset_hours: schedule ? schedule.offsetHours : null,
    });
    if (!error) return data === true;
  }
  return false;
}

type LineCheck = { ok: true; line: ProfileLine } | { ok: false; reason: string };

/**
 * Línea por la que sale el seguimiento. Tiene que ser del perfil de la tarea y
 * del área de la conversación. Si la conversación ya tiene línea, se usa esa o
 * ninguna: nunca se cambia a otro número. Solo una conversación sin línea
 * registrada (anterior a las líneas por perfil) toma la única línea activa del
 * perfil para esa área.
 */
async function resolveLine(
  conversation: { line_id: string | null; area: Area; contact_id: string },
  task: { rubro_id: string; contact_id: string }
): Promise<LineCheck> {
  if (conversation.contact_id !== task.contact_id) {
    return { ok: false, reason: "La conversación no corresponde al contacto de la tarea: no se envía hasta revisarlo." };
  }
  if (conversation.line_id) {
    const line = await getLine(conversation.line_id);
    if (!line) return { ok: false, reason: "La línea registrada en la conversación ya no existe: no se envía." };
    if (line.rubro_id !== task.rubro_id) {
      return {
        ok: false,
        reason: `La conversación está asociada a una línea de otro perfil («${line.label}»): no se envía hasta corregir la asociación.`,
      };
    }
    if (line.area !== conversation.area) {
      return { ok: false, reason: `La línea de la conversación («${line.label}») es de otra área: no se envía hasta corregir la asociación.` };
    }
    if (!line.active) {
      return { ok: false, reason: `La línea de la conversación («${line.label}») está desactivada: no se cambia de número y el seguimiento queda pendiente.` };
    }
    return { ok: true, line };
  }
  const options = (await getProfileLines(task.rubro_id, true)).filter((l) => l.area === conversation.area && l.answers_with_agent);
  if (options.length === 0) {
    return { ok: false, reason: "Falta una línea activa del perfil para esta conversación: el seguimiento queda pendiente." };
  }
  if (options.length > 1) {
    return { ok: false, reason: "Hay más de una línea posible para esta conversación: asignale su línea antes de seguir." };
  }
  return { ok: true, line: options[0] };
}

/** Deja asentado por qué una tarea quedó pendiente (una sola vez por motivo). */
async function markPending(supabase: Db, task: any, reason: string, fields: Record<string, unknown> = {}) {
  await updateTask(supabase, task.id, { status: "pendiente", status_reason: reason, ...fields });
  if (task.status_reason !== reason) {
    await logOpportunityEvent({
      opportunityId: task.opportunity_id,
      actor: "sistema",
      dimension: "seguimiento",
      to: "pendiente",
      reason,
      detail: { tarea: task.id, contacto: task.step },
    });
  }
}

/**
 * Aplica una decisión de horario que no es "enviar". Si la tarea está
 * reservada (`token`), la devuelve sin contar el intento.
 */
async function applyTiming(supabase: Db, task: any, decision: Exclude<ExecutionDecision, { action: "enviar" }>, token: string | null): Promise<ExecResult> {
  const id = task.id as string;
  if (decision.action === "esperar") {
    if (token) await release(supabase, id, token, "programada", "Todavía no es la hora programada.");
    return { taskId: id, action: "esperar" };
  }
  if (decision.action === "reprogramar") {
    const reason = `Reprogramado para el ${formatArgentina(decision.at)}: la franja anterior dejó de estar permitida.`;
    if (token) {
      await release(supabase, id, token, "programada", reason, { at: decision.at, offsetHours: decision.offsetHours });
    } else {
      await updateTask(supabase, id, {
        status: "programada",
        scheduled_at: decision.at.toISOString(),
        offset_hours: decision.offsetHours,
        status_reason: reason,
      });
    }
    return { taskId: id, action: "reprogramada", detail: formatArgentina(decision.at) };
  }
  if (token) await release(supabase, id, token, "conflicto", decision.detail);
  else await updateTask(supabase, id, { status: "conflicto", status_reason: decision.detail });
  await logOpportunityEvent({
    opportunityId: task.opportunity_id,
    actor: "sistema",
    dimension: "seguimiento",
    to: "conflicto",
    reason: decision.detail,
    detail: { tarea: id, contacto: task.step },
  });
  return { taskId: id, action: "conflicto", detail: decision.detail };
}

async function processTask(supabase: Db, task: any, now: Date, calendar: ContactCalendar, clock: () => Date): Promise<ExecResult> {
  const id = task.id as string;
  const timing = { base: new Date(task.base_at), scheduledAt: new Date(task.scheduled_at), targetHours: task.target_hours };
  const first = decideAtExecution(timing, now, calendar);
  if (first.action !== "enviar") return applyTiming(supabase, task, first, null);

  // Datos para el envío.
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, area, line_id, contact_id, contacts(id, full_name, phone)")
    .eq("id", task.conversation_id)
    .single();
  const contact = (conversation as any)?.contacts;
  if (!conversation || !contact?.phone) {
    await updateTask(supabase, id, { status: "fallida", status_reason: "El contacto no tiene teléfono" });
    return { taskId: id, action: "fallida", detail: "Sin teléfono" };
  }

  // La línea se valida antes de elegir plantilla y credenciales.
  const lineCheck = await resolveLine(conversation as any, task);
  if (!lineCheck.ok) {
    await markPending(supabase, task, lineCheck.reason);
    return { taskId: id, action: "pendiente", detail: lineCheck.reason };
  }
  const line = lineCheck.line;
  const purposes = task.step === 3 ? (["seguimiento_3", "seguimiento"] as const) : (["seguimiento"] as const);
  const check = await purposeTemplateCheck(line, [...purposes]);
  if (!check.resolved) {
    const reason = `Falta configurar: ${check.missing.join("; ")}. El seguimiento queda pendiente.`;
    await updateTask(supabase, id, { status: "pendiente", status_reason: reason, line_id: line.id });
    return { taskId: id, action: "pendiente", detail: reason };
  }
  const profile = await getProfile(task.rubro_id);
  const built = buildBodyParameters(check.resolved.analysis, check.resolved.sources, {
    "contacto.nombre": contact.full_name ?? "",
    "perfil.presentacion": profile?.agent_presentation_name ?? "",
    "perfil.marca": profile?.brand_name ?? "",
  });
  if (!built.ok) {
    const reason = `No se envía: falta ${built.missing.map((m) => `${m.label} para ${m.variable}`).join(", ")}. Queda pendiente.`;
    await updateTask(supabase, id, { status: "pendiente", status_reason: reason, line_id: line.id, template_id: check.resolved.template.id });
    return { taskId: id, action: "pendiente", detail: reason };
  }

  // Hora y calendario de nuevo, después de las consultas y antes de reservar.
  const beforeClaim = clock();
  const fresh = await loadContactCalendar(beforeClaim);
  if (fresh.error) return { taskId: id, action: "esperar", detail: fresh.error };
  const second = decideAtExecution(timing, beforeClaim, fresh.calendar);
  if (second.action !== "enviar") return applyTiming(supabase, task, second, null);

  // Reserva: una sola ejecución puede enviarla.
  const token = randomUUID();
  const { data: claimed } = await supabase.rpc("followup_claim", { p_task: id, p_token: token });
  if (claimed !== true) return { taskId: id, action: "ocupada" };
  await supabase.from("followup_tasks").update({ line_id: line.id, template_id: check.resolved.template.id }).eq("id", id);

  // Compuerta en la base inmediatamente antes de enviar.
  const { data: gate, error: gateError } = await supabase.rpc("followup_gate", { p_task: id, p_token: token });
  if (gateError || gate !== "ok") {
    const reasonKey = gateError ? "error_compuerta" : String(gate);
    const text = GATE_REASON_TEXT[reasonKey] ?? `No se envió (${gateError?.message ?? reasonKey})`;
    if (reasonKey === "reserva_perdida") return { taskId: id, action: "ocupada" };
    if (reasonKey === "pausa_general" || reasonKey === "error_compuerta") {
      await release(supabase, id, token, "programada", text);
      return { taskId: id, action: "liberada", detail: text };
    }
    if (reasonKey === "linea_incompatible" || reasonKey === "datos_incompatibles") {
      await release(supabase, id, token, "pendiente", text);
      if (task.status_reason !== text) {
        await logOpportunityEvent({
          opportunityId: task.opportunity_id,
          actor: "sistema",
          dimension: "seguimiento",
          to: "pendiente",
          reason: text,
          detail: { tarea: id, contacto: task.step },
        });
      }
      return { taskId: id, action: "pendiente", detail: text };
    }
    await finish(supabase, id, token, "cancelada", text);
    if (reasonKey === "chat_tomado" || reasonKey === "atencion_humana") {
      await setOpportunityState({
        opportunityId: task.opportunity_id,
        dimension: "seguimiento",
        field: "followup_state",
        value: "caido",
        actor: "sistema",
        reason: text,
        extra: { followup_reason: text, followup_next_at: null },
      });
    } else {
      await logOpportunityEvent({
        opportunityId: task.opportunity_id,
        actor: "sistema",
        dimension: "seguimiento",
        to: "cancelado",
        reason: text,
        detail: { tarea: id, contacto: task.step },
      });
    }
    return { taskId: id, action: "cancelada", detail: text };
  }

  // Última comprobación de hora, calendario y plazo, justo antes de llamar a Meta.
  const atSend = clock();
  const third = decideAtExecution(timing, atSend, fresh.calendar);
  if (third.action !== "enviar") return applyTiming(supabase, task, third, token);

  // Envío.
  const template = check.resolved.template;
  let externalId: string | null = null;
  try {
    const result: any = await sendWhatsAppTemplate(
      (conversation as any).area as Area,
      contact.phone,
      template.name,
      template.language,
      built.parameters,
      { credentialKey: line.credential_key }
    );
    externalId = result?.messages?.[0]?.id ?? null;
  } catch (err) {
    const f = classifySendFailure(err);
    const note = failureNote(f);
    if (f.kind === "plantilla" || f.kind === "cuenta") {
      await recordTemplateSendError(template.id, note);
      await finish(supabase, id, token, "pendiente", note);
      return { taskId: id, action: "pendiente", detail: note };
    }
    if (f.kind === "transitorio") {
      const attempts = (task.attempts ?? 0) + 1;
      if (attempts < MAX_TRANSIENT_ATTEMPTS) {
        await finish(supabase, id, token, "programada", note);
        return { taskId: id, action: "liberada", detail: note };
      }
      await finish(supabase, id, token, "fallida", `${note} Se alcanzó el límite de ${MAX_TRANSIENT_ATTEMPTS} intentos.`);
      return { taskId: id, action: "fallida", detail: note };
    }
    if (f.kind === "contacto") {
      await finish(supabase, id, token, "fallida", note);
      return { taskId: id, action: "fallida", detail: note };
    }
    // Incierto o no clasificado: a revisar, sin reenvío automático.
    await finish(supabase, id, token, "a_revisar", note);
    await logOpportunityEvent({
      opportunityId: task.opportunity_id,
      actor: "sistema",
      dimension: "seguimiento",
      to: "a_revisar",
      reason: note,
      detail: { tarea: id, contacto: task.step },
    });
    return { taskId: id, action: "a_revisar", detail: note };
  }

  // Meta aceptó: queda en la conversación con su identificador y estado.
  const body = previewBody(template.variables, (_v, i) => {
    const p = built.parameters[i];
    return p ? p.text : "";
  });
  const sentAt = clock().toISOString();
  let messageId: string | null = null;
  for (let i = 0; i < SAVE_RETRIES && !messageId; i++) {
    const { data: msg } = await supabase
      .from("messages")
      .insert({
        conversation_id: task.conversation_id,
        sender_type: "agente_ia",
        direction: "saliente",
        body: body || `[Plantilla ${template.name}]`,
        external_message_id: externalId,
        delivery_status: "enviado",
        delivery_status_at: sentAt,
        created_at: sentAt,
        metadata: { automatico: "seguimiento", followup_task_id: id, followup_step: task.step, plantilla: template.name },
      })
      .select("id")
      .maybeSingle();
    messageId = msg?.id ?? null;
  }
  if (!messageId) {
    const note = `Meta aceptó el contacto ${task.step} (${externalId}) pero no se pudo registrar en la conversación. No se reenvía.`;
    await finish(supabase, id, token, "a_revisar", note, { externalId });
    return { taskId: id, action: "a_revisar", detail: note };
  }
  await finish(supabase, id, token, "enviada", null, { messageId, externalId, sentAt });
  await supabase.from("conversations").update({ last_message_at: sentAt }).eq("id", task.conversation_id);
  await setOpportunityState({
    opportunityId: task.opportunity_id,
    dimension: "seguimiento",
    field: "followup_state",
    value: "activo",
    actor: "sistema",
    reason: `Contacto ${task.step} enviado`,
    extra: { followup_reason: `Contacto ${task.step} enviado`, followup_next_at: null },
    detail: { tarea: id, mensaje: messageId },
  });
  const { data: opp } = await supabase.from("opportunities").select("capture_state").eq("id", task.opportunity_id).single();
  if (opp?.capture_state === "en_conversacion") {
    await setOpportunityState({
      opportunityId: task.opportunity_id,
      dimension: "captacion",
      field: "capture_state",
      value: "en_seguimiento",
      actor: "sistema",
      reason: `Contacto ${task.step} de seguimiento enviado`,
    });
  }
  return { taskId: id, action: "enviada", detail: `contacto ${task.step}` };
}

/** Un latido completo: programar y mandar lo vencido. Lo llama el cron. */
export async function runFollowupTick(opts: { now?: Date } = {}) {
  const plan = await planFollowups(opts);
  const exec = await runDueFollowups(opts);
  return { plan, exec };
}
