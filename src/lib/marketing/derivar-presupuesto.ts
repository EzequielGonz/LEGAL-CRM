import { createAdminClient } from "@/lib/supabase/admin";
import { setOpportunityState } from "@/lib/opportunities";
import { RUBRO_IDS } from "@/lib/rubros";

/**
 * Marketing (24/10): cuando el equipo envía el presupuesto, la persona ya
 * pasó al equipo. Si estaba captada y sin derivar, se marca Derivado (antes
 * quedaba en «Captados para derivar» con el presupuesto ya enviado).
 * No envía nada. Si falla, solo se registra en el log.
 */
export async function derivarPorPresupuesto(contactId: string, enviadoAt: string): Promise<void> {
  try {
    const { data } = await createAdminClient()
      .from("opportunities")
      .select("id, capture_state, derivation_state")
      .eq("rubro_id", RUBRO_IDS.marketing)
      .eq("contact_id", contactId)
      .eq("capture_state", "captado")
      .neq("derivation_state", "derivado")
      .limit(5);
    for (const o of (data ?? []) as any[]) {
      await setOpportunityState({
        opportunityId: o.id,
        dimension: "derivacion",
        field: "derivation_state",
        value: "derivado",
        actor: "sistema",
        reason: "Presupuesto enviado por el equipo",
        extra: { derived_at: enviadoAt, derived_by: "sistema", derivation_recipient: "Equipo de Marketing", derivation_notes: "Presupuesto enviado" },
        detail: { destinatario: "Equipo de Marketing" },
      });
    }
  } catch (err) {
    console.error("[presupuesto] No se pudo marcar derivado:", err);
  }
}
