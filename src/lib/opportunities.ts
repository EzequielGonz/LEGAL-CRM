import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Oportunidad de captación (bloque 1.3): separada del contacto, con
 * dimensiones que coexisten y no se comprimen en una etiqueta única.
 * Todo cambio deja un evento en `opportunity_events` con su autor.
 */
export type Actor = "ia" | "operador" | "sistema";

export const CONTACT_STATE_LABEL: Record<string, string> = {
  sin_contactar: "Sin contactar",
  contactado_sin_respuesta: "Contactado sin respuesta",
  respondio: "Respondió",
  error_contacto: "Error de contacto",
};
export const CAPTURE_STATE_LABEL: Record<string, string> = {
  nuevo: "Nuevo",
  en_conversacion: "En conversación",
  en_seguimiento: "En seguimiento",
  captado: "Captado",
  perdido: "Perdido",
};
export const FOLLOWUP_STATE_LABEL: Record<string, string> = {
  ninguno: "Sin seguimiento",
  activo: "Seguimiento activo",
  completado: "Seguimiento completado",
  caido: "Seguimiento caído",
};
export const ATTENTION_STATE_LABEL: Record<string, string> = {
  ia: "Gestionado por IA",
  requiere_humano: "Requiere intervención humana",
  humano_en_curso: "Atención humana en curso",
};
export const DERIVATION_STATE_LABEL: Record<string, string> = {
  no_derivado: "No derivado",
  derivado: "Derivado",
};

export type Dimension =
  | "contacto"
  | "captacion"
  | "seguimiento"
  | "atencion"
  | "derivacion"
  | "ficha"
  | "detencion"
  | "revision"
  | "resultado_posterior"
  | "cita";

export async function logOpportunityEvent(input: {
  opportunityId: string;
  actor: Actor;
  dimension: Dimension;
  from?: string | null;
  to?: string | null;
  reason?: string | null;
  detail?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("opportunity_events").insert({
    opportunity_id: input.opportunityId,
    actor: input.actor,
    dimension: input.dimension,
    from_value: input.from ?? null,
    to_value: input.to ?? null,
    reason: input.reason ?? null,
    detail: input.detail ?? {},
  });
  if (error) console.error("[oportunidad] No se pudo registrar el evento:", error.message);
}

/** Oportunidad vigente del contacto (la más reciente). La crea si no existe. */
export async function ensureOpportunity(input: {
  contactId: string;
  conversationId?: string | null;
  campaignId?: string | null;
  actor?: Actor;
}): Promise<{ id: string; created: boolean; row: any }> {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("opportunities")
    .select("*")
    .eq("contact_id", input.contactId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    if (!existing.conversation_id && input.conversationId) {
      await supabase
        .from("opportunities")
        .update({ conversation_id: input.conversationId, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      existing.conversation_id = input.conversationId;
    }
    return { id: existing.id, created: false, row: existing };
  }

  const { data: contact, error } = await supabase
    .from("contacts")
    .select("id, rubro_id, area, source, imported_base_id")
    .eq("id", input.contactId)
    .single();
  if (error || !contact) throw new Error(`Contacto ${input.contactId} no encontrado`);

  const { data: created, error: insErr } = await supabase
    .from("opportunities")
    .insert({
      rubro_id: contact.rubro_id,
      area: contact.area,
      contact_id: contact.id,
      conversation_id: input.conversationId ?? null,
      origin_source: contact.source,
      imported_base_id: contact.imported_base_id,
      campaign_id: input.campaignId ?? null,
    })
    .select("*")
    .single();
  if (insErr || !created) throw new Error(`No se pudo crear la oportunidad: ${insErr?.message}`);
  await logOpportunityEvent({
    opportunityId: created.id,
    actor: input.actor ?? "sistema",
    dimension: "captacion",
    to: "nuevo",
    reason: "Oportunidad creada",
  });
  return { id: created.id, created: true, row: created };
}

/** Cambia un campo de estado y deja el evento (solo si cambió). */
export async function setOpportunityState(input: {
  opportunityId: string;
  dimension: Dimension;
  field: string;
  value: string | null;
  actor: Actor;
  reason?: string | null;
  extra?: Record<string, unknown>;
  detail?: Record<string, unknown>;
}): Promise<boolean> {
  const supabase = createAdminClient();
  const { data: current } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", input.opportunityId)
    .single();
  const before = (current as any)?.[input.field] ?? null;
  if (before === input.value && !input.extra) return false;

  const { error } = await supabase
    .from("opportunities")
    .update({ [input.field]: input.value, ...(input.extra ?? {}), updated_at: new Date().toISOString() })
    .eq("id", input.opportunityId);
  if (error) throw new Error(`No se pudo actualizar la oportunidad: ${error.message}`);

  if (before !== input.value) {
    await logOpportunityEvent({
      opportunityId: input.opportunityId,
      actor: input.actor,
      dimension: input.dimension,
      from: before,
      to: input.value,
      reason: input.reason ?? null,
      detail: input.detail,
    });
  }
  return true;
}
