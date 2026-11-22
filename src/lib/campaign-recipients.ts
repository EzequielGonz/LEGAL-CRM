import { createAdminClient } from "@/lib/supabase/admin";
import { detainedContactIds } from "@/lib/detention";
import { cambiosDePrioridad, prioridadDeEnvio, resumenPorGravedad, type FuenteDeDiagnostico } from "@/lib/bases/gravedad";
import { computeCampaignPriority } from "@/lib/bases/priority";
import { perfilDeArea } from "@/lib/navegacion";
import { extractRowFields } from "@/lib/bases/mapping";
import { CONTACT_STATE_RANK } from "@/lib/bases/import";

/**
 * Destinatarios de una campaña (bloques 1.6 y 1.8). Es el único lugar que
 * decide quién entra a la cola, venga de una base completa, de una
 * selección o de una carga hecha desde la campaña:
 *  - un contacto detenido nunca entra (bloque 1.2);
 *  - quien ya fue contactado (criterio de la sección 5.1: oportunidad
 *    contactada o con respuesta, o algún mensaje saliente) queda afuera
 *    salvo decisión explícita y visible;
 *  - quien ya está en la campaña no se duplica.
 * Agregar destinatarios no lanza la campaña ni envía nada.
 */

const ID_CHUNK = 150;

/** ¿El área es de Jurídico? Sin área conocida, no (vale la prioridad de siempre). */
function esJuridico(area: unknown): boolean {
  return typeof area === "string" && area.length > 0 && perfilDeArea(area) === "juridico";
}

/** Prioridad de un destinatario según el perfil de la campaña (gravedad solo en Jurídico). */
function prioridadSegunArea(juridico: boolean, diagnostico: unknown, tipo: unknown): number {
  const d = typeof diagnostico === "string" ? diagnostico : null;
  const t = typeof tipo === "string" ? tipo : null;
  return juridico ? prioridadDeEnvio("juridico", d, t) : computeCampaignPriority(d, t);
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export interface RecipientPlan {
  /** contactos distintos considerados */
  candidatos: number;
  /** contactos que se agregarían */
  elegibles: string[];
  detenidos: number;
  /** ya contactados antes (excluidos, salvo que se incluyan a propósito) */
  contactados_anteriormente: number;
  /** ya contactados que se incluyen por decisión explícita */
  contactados_incluidos: number;
  ya_en_campana: number;
  /** filas de la base sin contacto utilizable (sin teléfono o inválido) */
  filas_sin_contacto: number;
  priority: Map<string, number>;
}

/**
 * Contactos de una base, con la prioridad que surge de su propia fila. 22/11: en Jurídico la
 * prioridad sigue el orden de gravedad (`prioridadDeEnvio`); en los otros perfiles, la de siempre.
 */
export async function baseContacts(baseId: string): Promise<{ ids: string[]; priority: Map<string, number>; filasSinContacto: number }> {
  const supabase = createAdminClient();
  const { data: base } = await supabase.from("imported_bases").select("area").eq("id", baseId).maybeSingle();
  const juridico = esJuridico((base as any)?.area);
  const ids: string[] = [];
  const priority = new Map<string, number>();
  let filasSinContacto = 0;
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("imported_base_rows")
      .select("contact_id, raw_data, row_number")
      .eq("base_id", baseId)
      .order("row_number", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`No se pudieron leer las filas de la base: ${error.message}`);
    for (const r of data ?? []) {
      if (!r.contact_id) {
        filasSinContacto++;
        continue;
      }
      if (priority.has(r.contact_id)) continue;
      const f = extractRowFields((r.raw_data ?? {}) as Record<string, unknown>);
      priority.set(r.contact_id, prioridadSegunArea(juridico, f.diagnostico, f.tipo_de_consulta));
      ids.push(r.contact_id);
    }
    if (!data || data.length < PAGE) break;
  }
  return { ids, priority, filasSinContacto };
}

/**
 * Prioridad según lo guardado en cada contacto (selección manual). `area`: la de la campaña;
 * sin área (o fuera de Jurídico) vale la prioridad de siempre.
 */
export async function contactPriorities(ids: string[], area?: string | null): Promise<Map<string, number>> {
  const juridico = esJuridico(area);
  const supabase = createAdminClient();
  const out = new Map<string, number>();
  for (const part of chunk(ids, ID_CHUNK)) {
    const { data } = await supabase.from("contacts").select("id, qualification_data").in("id", part);
    for (const c of (data ?? []) as any[]) {
      out.set(c.id, prioridadSegunArea(juridico, c.qualification_data?.diagnostico, c.qualification_data?.tipo_de_consulta));
    }
  }
  return out;
}

/** Contactados anteriormente, con la evidencia que existe hoy. */
export async function previouslyContactedIds(ids: string[]): Promise<Set<string>> {
  const supabase = createAdminClient();
  const out = new Set<string>();
  for (const part of chunk(ids, ID_CHUNK)) {
    const { data } = await supabase.from("opportunities").select("contact_id, contact_state").in("contact_id", part);
    for (const o of (data ?? []) as any[]) {
      if ((CONTACT_STATE_RANK[o.contact_state] ?? 0) >= CONTACT_STATE_RANK.contactado_sin_respuesta) out.add(o.contact_id);
    }
  }
  for (const part of chunk(ids, 1000)) {
    const { data, error } = await supabase.rpc("contacts_last_outbound", { p_ids: part });
    if (error) throw new Error(`No se pudo verificar el contacto anterior: ${error.message}`);
    for (const r of (data ?? []) as any[]) out.add(r.contact_id);
  }
  return out;
}

export async function planRecipients(
  contactIds: string[],
  opts: { campaignId?: string | null; includePreviouslyContacted?: boolean; priority?: Map<string, number>; filasSinContacto?: number }
): Promise<RecipientPlan> {
  const supabase = createAdminClient();
  const unique = [...new Set(contactIds)];
  const detained = await detainedContactIds(unique);
  const notDetained = unique.filter((id) => !detained.has(id));

  const inCampaign = new Set<string>();
  if (opts.campaignId) {
    for (const part of chunk(notDetained, ID_CHUNK)) {
      const { data } = await supabase
        .from("campaign_contacts")
        .select("contact_id")
        .eq("campaign_id", opts.campaignId)
        .in("contact_id", part);
      for (const r of (data ?? []) as any[]) inCampaign.add(r.contact_id);
    }
  }
  const candidates = notDetained.filter((id) => !inCampaign.has(id));
  const contacted = await previouslyContactedIds(candidates);
  const contactadosEnCandidatos = candidates.filter((id) => contacted.has(id)).length;
  const elegibles = opts.includePreviouslyContacted ? candidates : candidates.filter((id) => !contacted.has(id));

  return {
    candidatos: unique.length,
    elegibles,
    detenidos: unique.length - notDetained.length,
    contactados_anteriormente: contactadosEnCandidatos,
    contactados_incluidos: opts.includePreviouslyContacted ? contactadosEnCandidatos : 0,
    ya_en_campana: inCampaign.size,
    filas_sin_contacto: opts.filasSinContacto ?? 0,
    priority: opts.priority ?? new Map(),
  };
}

/** Agrega a la cola como pendientes. No lanza la campaña. */
export async function attachRecipients(campaignId: string, plan: RecipientPlan): Promise<number> {
  const supabase = createAdminClient();
  let added = 0;
  for (const part of chunk(plan.elegibles, 500)) {
    const { data, error } = await supabase
      .from("campaign_contacts")
      .upsert(
        part.map((contact_id) => ({
          campaign_id: campaignId,
          contact_id,
          status: "pendiente",
          priority: plan.priority.get(contact_id) ?? 1,
        })),
        { onConflict: "campaign_id,contact_id", ignoreDuplicates: true }
      )
      .select("id");
    if (error) throw new Error(`No se pudieron agregar los destinatarios: ${error.message}`);
    added += data?.length ?? 0;
  }
  return added;
}

/** Resumen apto para responder (sin la lista completa de identificadores). */
export function planSummary(plan: RecipientPlan) {
  return {
    candidatos: plan.candidatos,
    elegibles: plan.elegibles.length,
    detenidos: plan.detenidos,
    contactados_anteriormente: plan.contactados_anteriormente,
    contactados_incluidos: plan.contactados_incluidos,
    ya_en_campana: plan.ya_en_campana,
    filas_sin_contacto: plan.filas_sin_contacto,
  };
}

/**
 * 22/11: reordena por gravedad lo que falta enviar de una campaña de Jurídico. Solo cambia la
 * prioridad de los destinatarios pendientes (el filtro por estado va también en la escritura):
 * lo enviado, lo que se está enviando y lo que está a revisar no se toca, así que reordenar nunca
 * genera un reenvío ni un duplicado. En los otros perfiles no hace nada.
 */
/** Presupuesto de tiempo del reordenamiento al lanzar (la ruta de lanzamiento tiene `maxDuration = 60`). */
export const PRESUPUESTO_REORDEN_MS = 20_000;

export async function reordenarPendientesPorGravedad(
  campaignId: string,
  opts: { presupuestoMs?: number; ahora?: () => number } = {}
): Promise<{ revisados: number; cambiados: number; porGrupo: ReturnType<typeof resumenPorGravedad>; cortado?: boolean } | null> {
  const reloj = opts.ahora ?? Date.now;
  const limite = reloj() + (opts.presupuestoMs ?? PRESUPUESTO_REORDEN_MS);
  const sinTiempo = () => reloj() > limite;
  const supabase = createAdminClient();
  const { data: campaign } = await supabase.from("campaigns").select("area").eq("id", campaignId).maybeSingle();
  if (!campaign || !esJuridico((campaign as any).area)) return null;
  const filas: { id: string; contact_id: string; status: string; priority: number }[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("campaign_contacts")
      .select("id, contact_id, status, priority")
      .eq("campaign_id", campaignId)
      .eq("status", "pendiente")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`No se pudo leer la cola de la campaña: ${error.message}`);
    filas.push(...((data ?? []) as any[]));
    if (!data || data.length < PAGE) break;
  }
  // Fuentes del diagnóstico: las mismas con que se encoló. Una cola armada desde una base usó la fila de
  // la base (`imported_base_rows.raw_data`); una armada desde una selección usó `contacts.qualification_data`.
  // Se mira cada una y vale la más grave. Si cualquier lectura falla, se aborta sin tocar nada.
  const contactIds = [...new Set(filas.map((f) => f.contact_id))];
  const fuentes = new Map<string, FuenteDeDiagnostico[]>();
  const agregar = (contactId: string, f: FuenteDeDiagnostico) => fuentes.set(contactId, [...(fuentes.get(contactId) ?? []), f]);
  // Si se agota el tiempo ANTES de escribir, se corta sin tocar nada y la campaña sigue con el orden actual.
  const corte = { revisados: filas.length, cambiados: 0, porGrupo: resumenPorGravedad(filas.map((f) => f.priority)), cortado: true };
  for (const part of chunk(contactIds, ID_CHUNK)) {
    if (sinTiempo()) return corte;
    const { data, error } = await supabase.from("contacts").select("id, qualification_data").in("id", part);
    if (error) throw new Error(`No se pudieron leer los contactos para reordenar la cola (no se cambió nada): ${error.message}`);
    for (const c of (data ?? []) as any[]) {
      agregar(c.id, { diagnostico: c.qualification_data?.diagnostico ?? null, tipoDeConsulta: c.qualification_data?.tipo_de_consulta ?? null });
    }
  }
  const baseJuridico = new Map<string, boolean>();
  // Filas de base: de a 50 contactos y paginado (un contacto puede estar en varias bases; el tope de PostgREST es de 1000 filas).
  for (const part of chunk(contactIds, 50)) {
    for (let from = 0; ; from += PAGE) {
      if (sinTiempo()) return corte;
      const { data, error } = await supabase
        .from("imported_base_rows")
        .select("id, contact_id, base_id, raw_data")
        .in("contact_id", part)
        .order("id")
        .range(from, from + PAGE - 1);
      if (error) throw new Error(`No se pudieron leer las filas de las bases para reordenar la cola (no se cambió nada): ${error.message}`);
      const filasBase = (data ?? []) as any[];
      const faltan = [...new Set(filasBase.map((r) => r.base_id as string))].filter((id) => !baseJuridico.has(id));
      if (faltan.length) {
        const { data: bases, error: errBases } = await supabase.from("imported_bases").select("id, area").in("id", faltan);
        if (errBases) throw new Error(`No se pudieron leer las bases para reordenar la cola (no se cambió nada): ${errBases.message}`);
        for (const b of (bases ?? []) as any[]) baseJuridico.set(b.id, esJuridico(b.area));
        for (const id of faltan) if (!baseJuridico.has(id)) baseJuridico.set(id, false);
      }
      for (const r of filasBase) {
        if (!r.contact_id || !baseJuridico.get(r.base_id)) continue;
        const f = extractRowFields((r.raw_data ?? {}) as Record<string, unknown>);
        agregar(r.contact_id, { diagnostico: f.diagnostico, tipoDeConsulta: f.tipo_de_consulta });
      }
      if (filasBase.length < PAGE) break;
    }
  }
  const cambios = cambiosDePrioridad(filas.map((f) => ({ id: f.id, status: f.status, prioridad: f.priority, fuentes: fuentes.get(f.contact_id) ?? [] })));
  let cambiados = 0;
  let cortado = false;
  const escritos = new Map<number, string[]>();
  // Los grupos van del más grave al menos grave. Un grupo (misma prioridad nueva) se termina de escribir
  // entero; si se agota el tiempo, se corta entre grupos y lo que falta sigue con el orden actual.
  for (const [prioridad, ids] of [...cambios].sort((a, b) => a[0] - b[0])) {
    if (sinTiempo()) {
      cortado = true;
      break;
    }
    for (const part of chunk(ids, ID_CHUNK)) {
      const { data, error } = await supabase.from("campaign_contacts").update({ priority: prioridad }).in("id", part).eq("status", "pendiente").select("id");
      if (error) throw new Error(`No se pudo reordenar la cola: ${error.message}`);
      cambiados += data?.length ?? 0;
    }
    escritos.set(prioridad, ids);
  }
  const nueva = new Map<string, number>();
  for (const [prioridad, ids] of escritos) for (const id of ids) nueva.set(id, prioridad);
  const finales = filas.map((f) => nueva.get(f.id) ?? f.priority);
  return { revisados: filas.length, cambiados, porGrupo: resumenPorGravedad(finales), ...(cortado ? { cortado: true } : {}) };
}

/** Estados en los que se pueden sumar destinatarios sin que salgan solos. */
export const CAMPAIGN_STATES_ACCEPTING_RECIPIENTS = ["borrador", "pausada", "finalizada"];
