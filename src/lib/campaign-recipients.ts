import { createAdminClient } from "@/lib/supabase/admin";
import { detainedContactIds } from "@/lib/detention";
import { computeCampaignPriority } from "@/lib/bases/priority";
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

/** Contactos de una base, con la prioridad que surge de su propia fila. */
export async function baseContacts(baseId: string): Promise<{ ids: string[]; priority: Map<string, number>; filasSinContacto: number }> {
  const supabase = createAdminClient();
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
      priority.set(r.contact_id, computeCampaignPriority(f.diagnostico, f.tipo_de_consulta));
      ids.push(r.contact_id);
    }
    if (!data || data.length < PAGE) break;
  }
  return { ids, priority, filasSinContacto };
}

/** Prioridad según lo guardado en cada contacto (selección manual). */
export async function contactPriorities(ids: string[]): Promise<Map<string, number>> {
  const supabase = createAdminClient();
  const out = new Map<string, number>();
  for (const part of chunk(ids, ID_CHUNK)) {
    const { data } = await supabase.from("contacts").select("id, qualification_data").in("id", part);
    for (const c of (data ?? []) as any[]) {
      out.set(c.id, computeCampaignPriority(c.qualification_data?.diagnostico, c.qualification_data?.tipo_de_consulta));
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

/** Estados en los que se pueden sumar destinatarios sin que salgan solos. */
export const CAMPAIGN_STATES_ACCEPTING_RECIPIENTS = ["borrador", "pausada", "finalizada"];
