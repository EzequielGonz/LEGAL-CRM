import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhoneAR } from "@/lib/phone";
import { setOpportunityState } from "@/lib/opportunities";

/**
 * Detención persistente (bloque 1.2). Se guarda por perfil y por teléfono
 * normalizado, así sigue vigente ante una carga nueva, otra campaña, otra
 * línea u otro agente. No responder o agotar intentos NO detiene.
 *
 * - Bloqueo "duro": pedido de no contacto o número informado como de una
 *   menor. No sale nada, ni automático ni manual, salvo que la persona
 *   vuelva a escribir por su cuenta (se le puede contestar a mano).
 * - Resto de los motivos: no sale nada automático; una persona puede
 *   escribir a mano desde el Inbox.
 */
export const DETENTION_MOTIVES = [
  "necesidad_resuelta",
  "compra_otro_canal",
  "desinteres",
  "no_contacto",
  "enojo",
  "numero_equivocado",
  "abogado_existente",
  "motivo_no_confirmado",
] as const;
export type DetentionMotive = (typeof DETENTION_MOTIVES)[number];

export const DETENTION_LABEL: Record<DetentionMotive, string> = {
  necesidad_resuelta: "Necesidad resuelta",
  compra_otro_canal: "Compró por otro canal",
  desinteres: "Desinterés",
  no_contacto: "Pidió no ser contactado",
  enojo: "Enojo por el contacto",
  numero_equivocado: "Número equivocado",
  abogado_existente: "Ya tiene abogado",
  motivo_no_confirmado: "Motivo no confirmado (retenido para revisión)",
};

export interface ContactBlock {
  detentionId: string;
  motive: DetentionMotive;
  minorReported: boolean;
  hardBlock: boolean;
  label: string;
}

export async function contactBlockReason(contactId: string): Promise<ContactBlock | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("contact_detention", { p_contact_id: contactId });
  if (error) {
    // Ante la duda no se contacta: se informa como bloqueo para que nada salga solo.
    console.error("[detención] No se pudo verificar la detención:", error.message);
    return {
      detentionId: "",
      motive: "motivo_no_confirmado",
      minorReported: false,
      hardBlock: false,
      label: "No se pudo verificar si el contacto está detenido",
    };
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.detention_id) return null;
  const motive = row.motive as DetentionMotive;
  return {
    detentionId: row.detention_id,
    motive,
    minorReported: !!row.minor_reported,
    hardBlock: !!row.hard_block,
    label: (DETENTION_LABEL[motive] ?? motive) + (row.minor_reported ? " · número de una menor" : ""),
  };
}

export class ContactDetainedError extends Error {
  constructor(public block: ContactBlock) {
    super(`Contacto detenido: ${block.label}. No se envían mensajes automáticos.`);
    this.name = "ContactDetainedError";
  }
}

/** Corta cualquier envío automático (IA, campañas, seguimientos, plantillas). */
export async function assertAutomaticContactAllowed(contactId: string): Promise<void> {
  const block = await contactBlockReason(contactId);
  if (block) throw new ContactDetainedError(block);
}

/**
 * Envío manual desde el panel: permitido salvo bloqueo duro. Con bloqueo
 * duro, solo si la persona volvió a escribir después de la detención.
 */
export async function manualContactCheck(
  contactId: string,
  conversationId: string
): Promise<{ allowed: boolean; reason?: string; block?: ContactBlock }> {
  const block = await contactBlockReason(contactId);
  if (!block) return { allowed: true };
  if (!block.hardBlock) return { allowed: true, block };

  const supabase = createAdminClient();
  const { data: det } = await supabase
    .from("contact_detentions")
    .select("created_at")
    .eq("id", block.detentionId)
    .maybeSingle();
  const { data: lastInbound } = await supabase
    .from("messages")
    .select("created_at")
    .eq("conversation_id", conversationId)
    .eq("direction", "entrante")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (det?.created_at && lastInbound?.created_at && lastInbound.created_at > det.created_at) {
    return { allowed: true, block };
  }
  return {
    allowed: false,
    block,
    reason: `No se puede escribir: ${block.label}. Solo se responde si la persona vuelve a escribir.`,
  };
}

/** Detención nueva (desde el panel o, en la Etapa 2, desde el agente). */
export async function createDetention(input: {
  contactId: string;
  motive: DetentionMotive;
  source: "operador" | "agente" | "importacion";
  evidence?: Record<string, unknown>;
  minorReported?: boolean;
  extraMotives?: DetentionMotive[];
}): Promise<string> {
  const supabase = createAdminClient();
  const { data: contact, error } = await supabase
    .from("contacts")
    .select("id, rubro_id, phone")
    .eq("id", input.contactId)
    .single();
  if (error || !contact) throw new Error("Contacto no encontrado");

  const motives = Array.from(new Set([input.motive, ...(input.extraMotives ?? [])]));
  const { data, error: insErr } = await supabase
    .from("contact_detentions")
    .insert({
      rubro_id: contact.rubro_id,
      contact_id: contact.id,
      phone_normalized: normalizePhoneAR(contact.phone).phone,
      motive: input.motive,
      motives,
      minor_reported: !!input.minorReported,
      source: input.source,
      evidence: input.evidence ?? {},
      created_by: input.source,
    })
    .select("id")
    .single();
  if (insErr) throw new Error(`No se pudo registrar la detención: ${insErr.message}`);
  await marcarPerdidoPorDetencion(contact.id, input.motive, input.source === "agente" ? "ia" : "operador");
  return data.id as string;
}

/**
 * 20/10 (pedido de la responsable): un contacto detenido (no le interesa,
 * enojo, número equivocado, ya resuelto…) pasa a Perdido con el motivo y sale
 * de la revisión manual. Captados y derivados no se tocan. Si falla, la
 * detención igual queda registrada.
 */
export async function marcarPerdidoPorDetencion(contactId: string, motive: DetentionMotive, actor: "ia" | "operador" = "operador"): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { data: opps } = await supabase
      .from("opportunities")
      .select("id, capture_state, attention_state")
      .eq("contact_id", contactId)
      .not("capture_state", "in", "(captado,derivado,perdido)");
    const motivo = `Detenido: ${DETENTION_LABEL[motive] ?? motive}`;
    for (const o of (opps ?? []) as any[]) {
      await setOpportunityState({ opportunityId: o.id, dimension: "captacion", field: "capture_state", value: "perdido", actor, reason: motivo, extra: { capture_reason: motivo } });
      if (o.attention_state === "requiere_humano") {
        await setOpportunityState({ opportunityId: o.id, dimension: "atencion", field: "attention_state", value: "ia", actor, reason: motivo });
      }
    }
  } catch (err) {
    console.error("[detencion] No se pudo pasar a Perdido:", err);
  }
}

export async function liftDetention(detentionId: string, reason: string, by = "operador"): Promise<void> {
  if (!reason.trim()) throw new Error("Para levantar una detención hay que escribir el motivo.");
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("contact_detentions")
    .update({ status: "levantada", lift_reason: reason.trim(), lifted_by: by, lifted_at: new Date().toISOString() })
    .eq("id", detentionId)
    .eq("status", "vigente");
  if (error) throw new Error(error.message);
}

/** Contactos detenidos dentro de una lista (consulta en lote). */
export async function detainedContactIds(ids: string[]): Promise<Map<string, { motive: DetentionMotive; hardBlock: boolean }>> {
  const result = new Map<string, { motive: DetentionMotive; hardBlock: boolean }>();
  if (ids.length === 0) return result;
  const supabase = createAdminClient();
  for (let i = 0; i < ids.length; i += 1000) {
    const chunk = ids.slice(i, i + 1000);
    const { data, error } = await supabase.rpc("detained_contact_ids", { p_ids: chunk });
    if (error) throw new Error(`No se pudo verificar detenciones: ${error.message}`);
    for (const row of (data ?? []) as any[]) {
      result.set(row.contact_id, { motive: row.motive, hardBlock: !!row.hard_block });
    }
  }
  return result;
}
