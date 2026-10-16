/**
 * Etapa 2 · Bloque 2.2 — Citas de IA (Fase 2 jurídica), inicio de cita y
 * único reagendamiento, sobre la base. Reglas en `./reglas.ts`.
 *
 * Nada de esto se ejecuta solo: las tareas quedan «programadas» y las corre
 * `ejecutarCitaTareasVencidas`, que revalida pausa de envíos, detención,
 * chat tomado, franja horaria y ventana del canal inmediatamente antes de
 * enviar. Con la pausa general activa no sale nada.
 */

import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAutomationPause } from "@/lib/automation-pause";
import { contactBlockReason } from "@/lib/detention";
import { loadContactCalendar } from "@/lib/contacto/calendario";
import { channelWindow, nextAllowedInstant } from "@/lib/contacto/reglas";
import { decidirSalidaEmpresa } from "@/lib/contacto/origen";
import { AutomaticSendBlockedError, sendOutboundMessage } from "@/lib/messaging";
import { logOpportunityEvent } from "@/lib/opportunities";
import { getProfile, profileIdForArea } from "@/lib/profiles";
import { AREA_TO_RUBRO_ID } from "@/lib/rubros";
import { decidirReagendamiento, horarioFase2, textoInicioCita, textoReagendamiento } from "@/lib/citas/reglas";
import type { Area } from "@/lib/supabase/database.types";

/** Cita de IA de Fase 2: no consume turnos humanos. Agendar no capta. */
export async function crearCitaIa(input: {
  contactId: string;
  conversationId: string;
  area: Area;
  opportunityId?: string | null;
  elegido?: string | null;
  now?: Date;
}) {
  const supabase = createAdminClient();
  const now = input.now ?? new Date();
  const elegido = input.elegido ? new Date(input.elegido) : null;
  const { startsAt, endsAt } = horarioFase2(now, elegido && !Number.isNaN(elegido.getTime()) ? elegido : null);
  const { data: cita, error } = await supabase
    .from("appointments")
    .insert({
      contact_id: input.contactId,
      conversation_id: input.conversationId,
      area: input.area,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "confirmada",
      consultation_type: "Fase 2 · revisión con IA",
      kind: "ia",
      opportunity_id: input.opportunityId ?? null,
    })
    .select("id, starts_at")
    .single();
  if (error || !cita) throw new Error(`No se pudo crear la cita de IA: ${error?.message}`);
  const { error: taskErr } = await supabase.from("cita_tareas").insert({
    appointment_id: cita.id,
    rubro_id: AREA_TO_RUBRO_ID[input.area],
    opportunity_id: input.opportunityId ?? null,
    conversation_id: input.conversationId,
    kind: "inicio_cita",
    origin: "inicio_cita",
    scheduled_at: cita.starts_at,
  });
  if (taskErr && (taskErr as any).code !== "23505") throw new Error(`No se pudo programar el inicio de la cita: ${taskErr.message}`);
  if (input.opportunityId) {
    await logOpportunityEvent({
      opportunityId: input.opportunityId,
      actor: "ia",
      dimension: "cita",
      to: "fase2_agendada",
      reason: "Cita de IA de Fase 2 agendada (agendar no capta)",
      detail: { cita: cita.id, inicio: cita.starts_at },
    });
  }
  return cita;
}

/**
 * Registra el inicio realmente enviado y programa el único reagendamiento
 * (una hora después de ese envío, en franja válida). Repetir no duplica.
 */
export async function registrarInicioEnviado(input: { appointmentId: string; messageId: string | null; sentAt: Date }) {
  const supabase = createAdminClient();
  const { data: cita } = await supabase
    .from("appointments")
    .select("id, area, conversation_id, opportunity_id, reschedule_of, start_sent_at")
    .eq("id", input.appointmentId)
    .single();
  if (!cita) return { programado: false, motivo: "sin_cita" as const };
  if (!cita.start_sent_at) {
    await supabase
      .from("appointments")
      .update({ start_sent_at: input.sentAt.toISOString(), start_message_id: input.messageId })
      .eq("id", cita.id)
      .is("start_sent_at", null);
  }
  const enviadoAt = cita.start_sent_at ? new Date(cita.start_sent_at) : input.sentAt;
  const { data: ya } = await supabase
    .from("cita_tareas")
    .select("id")
    .eq("appointment_id", cita.id)
    .eq("kind", "reagendamiento")
    .maybeSingle();
  const { calendar } = await loadContactCalendar(enviadoAt);
  const decision = decidirReagendamiento(
    { inicioEnviadoAt: enviadoAt, esReagendamiento: !!cita.reschedule_of, yaReagendada: !!ya, ultimoEntranteAt: null },
    calendar
  );
  if (!decision.programar) return { programado: false, motivo: decision.motivo };
  const { error } = await supabase.from("cita_tareas").insert({
    appointment_id: cita.id,
    rubro_id: AREA_TO_RUBRO_ID[cita.area],
    opportunity_id: cita.opportunity_id,
    conversation_id: cita.conversation_id,
    kind: "reagendamiento",
    origin: "reagendamiento",
    scheduled_at: decision.at.toISOString(),
  });
  if (error && (error as any).code !== "23505") throw new Error(`No se pudo programar el reagendamiento: ${error.message}`);
  return { programado: !error, motivo: null, at: decision.at };
}

async function ultimoEntrante(conversationId: string): Promise<Date | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("messages")
    .select("created_at")
    .eq("conversation_id", conversationId)
    .eq("direction", "entrante")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.created_at ? new Date(data.created_at) : null;
}

export type ResultadoTareaCita = { taskId: string; action: "enviada" | "cancelada" | "a_revisar" | "omitida" | "reprogramada"; detail: string };

/** Corre las tareas de cita vencidas. Revalida todo justo antes de enviar. */
export async function ejecutarCitaTareasVencidas(opts: { now?: Date; clock?: () => Date; limit?: number } = {}): Promise<ResultadoTareaCita[]> {
  const clock = opts.clock ?? (() => opts.now ?? new Date());
  const supabase = createAdminClient();
  const pause = await getAutomationPause();
  // Con la pausa general activa ni siquiera se reservan tareas.
  if (pause.outboundPaused) return [];
  const { data: tareas } = await supabase
    .from("cita_tareas")
    .select("*")
    .eq("status", "programada")
    .lte("scheduled_at", clock().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(opts.limit ?? 50);
  const out: ResultadoTareaCita[] = [];
  for (const t of tareas ?? []) out.push(await ejecutarTarea(t, clock));
  return out;
}

async function cerrar(id: string, token: string, status: string, reason: string | null, extra: Record<string, unknown> = {}) {
  const supabase = createAdminClient();
  await supabase
    .from("cita_tareas")
    .update({ status, status_reason: reason, updated_at: new Date().toISOString(), ...extra })
    .eq("id", id)
    .eq("claim_token", token);
}

async function ejecutarTarea(t: any, clock: () => Date): Promise<ResultadoTareaCita> {
  const supabase = createAdminClient();
  const token = randomUUID();
  // Reserva atómica: solo una ejecución toma la tarea.
  const { data: reservada } = await supabase
    .from("cita_tareas")
    .update({ status: "enviando", claim_token: token, claimed_at: clock().toISOString(), updated_at: clock().toISOString() })
    .eq("id", t.id)
    .eq("status", "programada")
    .select("id")
    .maybeSingle();
  if (!reservada) return { taskId: t.id, action: "omitida", detail: "otra ejecución la tomó" };

  const { data: cita } = await supabase.from("appointments").select("*").eq("id", t.appointment_id).single();
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, area, contact_id, ai_enabled")
    .eq("id", t.conversation_id)
    .maybeSingle();
  if (!cita || !conv || cita.status === "cancelada") {
    await cerrar(t.id, token, "cancelada", "La cita o la conversación ya no está vigente");
    return { taskId: t.id, action: "cancelada", detail: "sin cita vigente" };
  }
  if (t.opportunity_id) {
    const { data: opp } = await supabase.from("opportunities").select("capture_state").eq("id", t.opportunity_id).maybeSingle();
    if (opp?.capture_state === "captado") {
      await cerrar(t.id, token, "cancelada", "captado");
      return { taskId: t.id, action: "cancelada", detail: "captado" };
    }
  }
  const lastIn = await ultimoEntrante(conv.id);
  if (t.kind === "reagendamiento") {
    // Si respondió después del inicio, no hubo cita incumplida.
    const { calendar } = await loadContactCalendar(clock());
    const d = decidirReagendamiento(
      {
        inicioEnviadoAt: cita.start_sent_at ? new Date(cita.start_sent_at) : null,
        esReagendamiento: !!cita.reschedule_of,
        yaReagendada: false,
        ultimoEntranteAt: lastIn,
      },
      calendar
    );
    if (!d.programar) {
      await cerrar(t.id, token, "cancelada", d.motivo);
      return { taskId: t.id, action: "cancelada", detail: d.motivo };
    }
  }

  const block = await contactBlockReason(conv.contact_id);
  const pause = await getAutomationPause();
  const { calendar } = await loadContactCalendar(clock());
  const gate = decidirSalidaEmpresa(
    { origen: t.origin, pausaEnvios: pause.outboundPaused, detenido: !!block, chatTomado: !conv.ai_enabled },
    clock(),
    calendar
  );
  if (!gate.enviar) {
    if (gate.motivo === "fuera_de_horario") {
      const proxima = nextAllowedInstant(clock(), calendar);
      await cerrar(t.id, token, "programada", "Fuera de la franja: pasa a la próxima franja válida", {
        claim_token: null,
        ...(proxima ? { scheduled_at: proxima.toISOString() } : {}),
      });
      return { taskId: t.id, action: "reprogramada", detail: gate.motivo };
    }
    await cerrar(t.id, token, "cancelada", gate.motivo);
    return { taskId: t.id, action: "cancelada", detail: gate.motivo };
  }
  if (!channelWindow(lastIn, clock()).open) {
    // Fuera de la ventana de 24 h solo sale una plantilla aprobada: queda para una persona.
    await cerrar(t.id, token, "a_revisar", "Ventana del canal cerrada: hace falta una plantilla aprobada de reagendamiento o inicio de cita");
    return { taskId: t.id, action: "a_revisar", detail: "ventana_cerrada" };
  }

  const profile = await getProfile(profileIdForArea(conv.area as Area) ?? "");
  const nombre = profile?.agent_presentation_name ?? "";
  const body = t.kind === "inicio_cita" ? textoInicioCita(nombre) : textoReagendamiento(nombre);
  try {
    const sent = await sendOutboundMessage({ conversationId: conv.id, senderType: "agente_ia", body, origin: t.origin, clock });
    await cerrar(t.id, token, "enviada", null, { message_id: sent.messageId, sent_at: sent.sentAt });
    if (t.kind === "inicio_cita") {
      await registrarInicioEnviado({ appointmentId: cita.id, messageId: sent.messageId, sentAt: new Date(sent.sentAt) });
    }
    return { taskId: t.id, action: "enviada", detail: t.kind };
  } catch (err) {
    if (err instanceof AutomaticSendBlockedError) {
      await cerrar(t.id, token, "cancelada", err.reason);
      return { taskId: t.id, action: "cancelada", detail: err.reason };
    }
    // Resultado incierto: a revisar, sin reenvío automático.
    await cerrar(t.id, token, "a_revisar", `Envío incierto: ${String((err as Error)?.message ?? err).slice(0, 300)}`);
    return { taskId: t.id, action: "a_revisar", detail: "incierto" };
  }
}
