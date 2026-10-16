import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeTargetHours, FOLLOWUP_RANGE } from "@/lib/contacto/reglas";
import { logOpportunityEvent } from "@/lib/opportunities";

/**
 * Etapa 2 · Bloque 2.3 — Lo que el panel muestra y hace con el seguimiento
 * de un perfil: configuración, tareas, revisión y base para campaña manual.
 */

export class FollowupError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "FollowupError";
  }
}

export interface FollowupTaskRow {
  id: string;
  rubro_id: string;
  opportunity_id: string;
  contact_id: string;
  conversation_id: string;
  step: number;
  base_at: string;
  target_hours: number;
  scheduled_at: string | null;
  offset_hours: number | null;
  status: string;
  status_reason: string | null;
  sent_at: string | null;
  external_message_id: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
  contacts?: { full_name: string | null; phone: string | null } | null;
}

const TASK_COLUMNS =
  "id, rubro_id, opportunity_id, contact_id, conversation_id, step, base_at, target_hours, scheduled_at, offset_hours, status, status_reason, sent_at, external_message_id, resolved_at, resolution_note, created_at, updated_at, contacts(full_name, phone)";

export async function followupOverview(rubroId: string) {
  const supabase = createAdminClient();
  const [rubro, programadas, atencion, enviadas, detenidas, agotadas] = await Promise.all([
    supabase.from("rubros").select("id, name, followup_target_hours, followup_enabled_since").eq("id", rubroId).single(),
    supabase
      .from("followup_tasks")
      .select(TASK_COLUMNS)
      .eq("rubro_id", rubroId)
      .in("status", ["programada", "enviando"])
      .order("scheduled_at", { ascending: true })
      .limit(200),
    supabase
      .from("followup_tasks")
      .select(TASK_COLUMNS)
      .eq("rubro_id", rubroId)
      .in("status", ["conflicto", "pendiente", "a_revisar", "fallida"])
      .is("resolved_at", null)
      .order("updated_at", { ascending: false })
      .limit(200),
    supabase
      .from("followup_tasks")
      .select(TASK_COLUMNS)
      .eq("rubro_id", rubroId)
      .eq("status", "enviada")
      .order("sent_at", { ascending: false })
      .limit(50),
    supabase
      .from("opportunities")
      .select("id, contact_id, followup_reason, updated_at, contacts(full_name, phone)")
      .eq("rubro_id", rubroId)
      .eq("followup_state", "caido")
      .order("updated_at", { ascending: false })
      .limit(50),
    supabase
      .from("opportunities")
      .select("id, contact_id, area, followup_reason, followup_exhausted_at, repesca_base_id, contacts(full_name, phone)")
      .eq("rubro_id", rubroId)
      .eq("followup_state", "completado")
      .not("followup_exhausted_at", "is", null)
      .order("followup_exhausted_at", { ascending: false })
      .limit(300),
  ]);
  return {
    config: {
      enabledSince: (rubro.data as any)?.followup_enabled_since ?? null,
      targetHours: (rubro.data as any)?.followup_target_hours ?? FOLLOWUP_RANGE.defaultTargetHours,
      name: (rubro.data as any)?.name ?? "",
    },
    programadas: (programadas.data ?? []) as unknown as FollowupTaskRow[],
    atencion: (atencion.data ?? []) as unknown as FollowupTaskRow[],
    enviadas: (enviadas.data ?? []) as unknown as FollowupTaskRow[],
    detenidas: (detenidas.data ?? []) as any[],
    agotadas: (agotadas.data ?? []) as any[],
    error:
      rubro.error?.message ??
      programadas.error?.message ??
      atencion.error?.message ??
      enviadas.error?.message ??
      detenidas.error?.message ??
      agotadas.error?.message ??
      null,
  };
}

/**
 * Activa o apaga el seguimiento del perfil y fija el valor objetivo. Al
 * activar, solo entran las interrupciones posteriores (las conversaciones
 * anteriores no entran solas). Al apagar, las tareas programadas se cancelan
 * en la compuerta (no sale nada).
 */
export async function setFollowupConfig(rubroId: string, input: { enabled?: boolean; targetHours?: unknown }) {
  const supabase = createAdminClient();
  const { data: before, error } = await supabase
    .from("rubros")
    .select("id, followup_target_hours, followup_enabled_since")
    .eq("id", rubroId)
    .maybeSingle();
  if (error) throw new FollowupError(error.message, 500);
  if (!before) throw new FollowupError("Perfil no encontrado", 404);

  const update: Record<string, unknown> = {};
  if (input.targetHours !== undefined) {
    const n = typeof input.targetHours === "string" ? Number(input.targetHours) : input.targetHours;
    if (!(typeof n === "number" && Number.isInteger(n) && n >= FOLLOWUP_RANGE.minHours && n <= FOLLOWUP_RANGE.maxHours)) {
      throw new FollowupError(`El valor objetivo tiene que ser un número entero de horas entre ${FOLLOWUP_RANGE.minHours} y ${FOLLOWUP_RANGE.maxHours}.`);
    }
    update.followup_target_hours = normalizeTargetHours(n);
  }
  if (input.enabled === true && !before.followup_enabled_since) update.followup_enabled_since = new Date().toISOString();
  if (input.enabled === false) update.followup_enabled_since = null;
  if (!Object.keys(update).length) return before;

  const { data: after, error: upErr } = await supabase
    .from("rubros")
    .update(update)
    .eq("id", rubroId)
    .select("id, followup_target_hours, followup_enabled_since")
    .single();
  if (upErr) throw new FollowupError(upErr.message, 500);

  // Al apagar, lo programado se cancela ya (no queda esperando a la compuerta).
  let canceladas = 0;
  if (input.enabled === false) {
    const { data: cancelled } = await supabase
      .from("followup_tasks")
      .update({
        status: "cancelada",
        status_reason: "Se apagó el seguimiento automático del perfil",
        resolved_at: new Date().toISOString(),
        resolved_by: "panel",
        updated_at: new Date().toISOString(),
      })
      .eq("rubro_id", rubroId)
      .in("status", ["programada", "pendiente", "conflicto"])
      .select("id");
    canceladas = cancelled?.length ?? 0;
  }
  await supabase.from("ops_change_log").insert({
    actor: "panel",
    action: "seguimiento_configuracion",
    target: `rubros.${rubroId}`,
    before: { followup_target_hours: before.followup_target_hours, followup_enabled_since: before.followup_enabled_since },
    after: { ...after, tareas_canceladas: canceladas },
  });
  return after;
}

export type ReviewAction = "descartar" | "reintentar" | "marcar_enviado";

/**
 * Decisión desde el panel sobre una tarea que quedó para revisión.
 *  - descartar: no se envía; esa interrupción no vuelve a generar la tarea.
 *  - reintentar: vuelve a programarse ya (el ejecutor repite todas las
 *    comprobaciones). Si el resultado fue incierto exige confirmar que
 *    podría llegarle dos veces.
 *  - marcar_enviado: solo para inciertos que se confirmaron (por ejemplo, la
 *    persona lo recibió): cuenta como enviado.
 */
export async function reviewFollowupTask(taskId: string, action: ReviewAction, opts: { confirmUncertain?: boolean; note?: string | null } = {}) {
  const supabase = createAdminClient();
  const { data: task } = await supabase.from("followup_tasks").select("*").eq("id", taskId).maybeSingle();
  if (!task) throw new FollowupError("Tarea no encontrada", 404);
  const reviewable = ["conflicto", "pendiente", "a_revisar", "fallida"];
  if (!reviewable.includes(task.status)) throw new FollowupError("Esta tarea no está para revisión.", 409);
  const now = new Date().toISOString();
  const note = opts.note?.trim().slice(0, 300) || null;

  let update: Record<string, unknown>;
  if (action === "descartar") {
    update = { status: "cancelada", resolved_at: now, resolved_by: "panel", resolution_note: note ?? "Descartada desde el panel" };
  } else if (action === "reintentar") {
    if (task.status === "a_revisar" && !opts.confirmUncertain) {
      throw new FollowupError("No se sabe si el mensaje anterior llegó: reintentar podría hacer que le llegue dos veces. Confirmalo para seguir.", 409);
    }
    if (task.status === "fallida" && /tel[eé]fono/i.test(task.status_reason ?? "")) {
      throw new FollowupError("El contacto no tiene teléfono: corregilo antes de reintentar.", 409);
    }
    update = {
      status: "programada",
      scheduled_at: now,
      claim_token: null,
      send_started_at: null,
      status_reason: `Reintento pedido desde el panel${task.status === "a_revisar" ? " (confirmado: podría llegarle dos veces)" : ""}`,
      resolution_note: note,
    };
  } else if (action === "marcar_enviado") {
    if (task.status !== "a_revisar") throw new FollowupError("Solo un envío incierto se puede marcar como enviado.", 409);
    update = { status: "enviada", sent_at: task.send_started_at ?? now, resolved_at: now, resolved_by: "panel", resolution_note: note ?? "Confirmado como enviado desde el panel" };
  } else {
    throw new FollowupError("Acción desconocida");
  }

  const { data: after, error } = await supabase
    .from("followup_tasks")
    .update({ ...update, updated_at: now })
    .eq("id", taskId)
    .eq("status", task.status)
    .select("*")
    .maybeSingle();
  if (error) {
    if ((error as any).code === "23505") throw new FollowupError("Ya hay otra tarea abierta o enviada para este contacto.", 409);
    throw new FollowupError(error.message, 500);
  }
  if (!after) throw new FollowupError("La tarea cambió mientras tanto: actualizá la pantalla.", 409);
  await logOpportunityEvent({
    opportunityId: task.opportunity_id,
    actor: "operador",
    dimension: "seguimiento",
    from: task.status,
    to: after.status,
    reason: `Revisión desde el panel: ${action}`,
    detail: { tarea: taskId, nota: note },
  });
  return after;
}

/**
 * Base para campaña manual con quienes llegaron al tercer contacto sin
 * avanzar (y todavía no están en una base de repesca). Generarla no envía
 * nada: la campaña se arma aparte, a mano, y como ya fueron contactados hay
 * que incluirlos a propósito.
 */
export async function generateRepescaBase(rubroId: string) {
  const supabase = createAdminClient();
  const { data: rubro } = await supabase.from("rubros").select("id, name").eq("id", rubroId).maybeSingle();
  if (!rubro) throw new FollowupError("Perfil no encontrado", 404);
  const { data: opps, error } = await supabase
    .from("opportunities")
    .select("id, area, contact_id, followup_reason, contacts(full_name, phone)")
    .eq("rubro_id", rubroId)
    .eq("followup_state", "completado")
    .not("followup_exhausted_at", "is", null)
    .is("repesca_base_id", null)
    .limit(5000);
  if (error) throw new FollowupError(error.message, 500);
  if (!opps?.length) throw new FollowupError("No hay contactos nuevos que hayan llegado al tercer contacto sin avanzar.", 409);

  const byArea = new Map<string, any[]>();
  for (const o of opps as any[]) {
    const list = byArea.get(o.area) ?? [];
    list.push(o);
    byArea.set(o.area, list);
  }
  const day = new Date().toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
  const created: { baseId: string; area: string; filas: number }[] = [];
  for (const [area, list] of byArea) {
    const { data: base, error: baseErr } = await supabase
      .from("imported_bases")
      .insert({
        area,
        name: `Repesca manual · ${rubro.name} · ${day}`,
        source_label: "Seguimiento agotado (llegaron al tercer contacto sin avanzar)",
        total_rows: list.length,
        created_rows: 0,
        duplicate_rows: list.length,
        invalid_rows: 0,
        import_summary: { origen: "repesca_manual", perfil: rubroId, generada: new Date().toISOString() },
      })
      .select("id")
      .single();
    if (baseErr || !base) throw new FollowupError(`No se pudo crear la base: ${baseErr?.message}`, 500);
    const rows = list.map((o, i) => ({
      base_id: base.id,
      row_number: i + 1,
      raw_data: { nombre: o.contacts?.full_name ?? null, telefono: o.contacts?.phone ?? null, origen: "repesca_manual", motivo: o.followup_reason },
      status: "duplicado",
      contact_id: o.contact_id,
      match_kind: "contacto_existente",
      previously_contacted: true,
    }));
    const { error: rowsErr } = await supabase.from("imported_base_rows").insert(rows);
    if (rowsErr) {
      // La base no se borra: queda archivada con el motivo (no se usa para campañas).
      await supabase
        .from("imported_bases")
        .update({ archived_at: new Date().toISOString(), archived_note: `No se pudieron guardar las filas: ${rowsErr.message}`.slice(0, 300) })
        .eq("id", base.id);
      throw new FollowupError(`No se pudieron guardar las filas: ${rowsErr.message}`, 500);
    }
    await supabase.from("opportunities").update({ repesca_base_id: base.id }).in("id", list.map((o) => o.id));
    for (const o of list) {
      await logOpportunityEvent({
        opportunityId: o.id,
        actor: "operador",
        dimension: "seguimiento",
        to: "base_repesca",
        reason: "Sumado a la base para campaña manual (no se envió nada)",
        detail: { base: base.id },
      });
    }
    created.push({ baseId: base.id, area, filas: list.length });
  }
  await supabase.from("ops_change_log").insert({
    actor: "panel",
    action: "seguimiento_base_repesca",
    target: `rubros.${rubroId}`,
    before: null,
    after: { bases: created },
  });
  return created;
}
