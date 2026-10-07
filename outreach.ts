import { createAdminClient } from "@/lib/supabase/admin";
import { ensureLead } from "./leads";

/**
 * Selección de a quién se le manda el PRIMER mensaje en una campaña de
 * Marketing. A diferencia de las campañas de otros rubros (que van en
 * orden de carga), acá:
 *  - solo se contacta a leads ya analizados con prioridad ALTA o MEDIA
 *    (los más calificados primero, por puntaje);
 *  - si un lead todavía no terminó de analizarse, se espera (no se saltea);
 *  - un lead de prioridad baja, sin análisis o que ya fue contactado antes
 *    se descarta de la campaña (nunca se contacta dos veces);
 *  - el mensaje lleva el "gancho" del análisis como variable de la plantilla.
 */

export const AUTO_CAMPAIGN_NAME = "Prospección automática Marketing";

export type MarketingPick =
  | {
      kind: "ready";
      campaignContactId: string;
      contactId: string;
      leadId: string;
      phone: string | null;
      name: string;
      hook: string;
    }
  | { kind: "waiting"; detail: string }
  | { kind: "empty" };

/** Deja un texto apto como variable de plantilla de WhatsApp. */
export function templateVar(text: string, maxLen: number): string {
  return text.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, maxLen).trim();
}

export async function pickNextMarketingContact(campaignId: string): Promise<MarketingPick> {
  const supabase = createAdminClient();

  const { data: pending } = await supabase
    .from("campaign_contacts")
    .select("id, contact_id, contacts(full_name, phone, source, qualification_data)")
    .eq("campaign_id", campaignId)
    .eq("status", "pendiente")
    .order("queued_at", { ascending: true })
    .limit(300);

  if (!pending || pending.length === 0) return { kind: "empty" };

  const contactIds = pending.map((p) => p.contact_id);
  const { data: leadRows } = await supabase.from("marketing_leads").select("*").in("contact_id", contactIds);
  const leadByContact = new Map<string, any>((leadRows ?? []).map((l: any) => [l.contact_id, l]));

  const discard = new Map<string, string[]>(); // motivo -> ids de campaign_contacts
  const addDiscard = (reason: string, id: string) => {
    discard.set(reason, [...(discard.get(reason) ?? []), id]);
  };

  let waiting = 0;
  const candidates: { row: any; lead: any }[] = [];

  for (const row of pending as any[]) {
    let lead = leadByContact.get(row.contact_id);

    if (!lead) {
      // Solo los contactos que vienen de Google Maps tienen datos reales para analizar: a un
      // contacto de otra base no se le puede inventar un "gancho" sin haber visto su negocio.
      if (row.contacts?.source !== "google_maps") {
        addDiscard("Sin análisis disponible (no viene de Google Maps)", row.id);
        continue;
      }
      // Contacto agregado a la campaña sin pasar por el scraper: se le crea el lead para analizarlo.
      const qd = (row.contacts?.qualification_data ?? {}) as Record<string, any>;
      const created = await ensureLead({
        contactId: row.contact_id,
        sourceKind: "scraper",
        sourceDetail: "Google Maps",
        website: typeof qd.sitio_web === "string" ? qd.sitio_web : null,
        mapsData: {
          rating: qd.rating ?? null,
          rubro_buscado: qd.rubro_buscado ?? null,
          zona_buscada: qd.zona_buscada ?? null,
          address: qd.direccion ?? null,
        },
      });
      lead = created.lead;
    }

    if (lead.outreach_status !== "sin_contactar") {
      addDiscard("Ya fue contactado antes: no se le escribe de nuevo", row.id);
      continue;
    }
    if (lead.analysis_status === "pendiente" || lead.analysis_status === "analizando") {
      waiting++;
      continue;
    }
    if (lead.analysis_status !== "listo") {
      addDiscard("Sin análisis disponible", row.id);
      continue;
    }
    if (lead.priority === "baja" || !lead.hook) {
      addDiscard(`Prioridad baja (puntaje ${lead.lead_score ?? "?"}): no se contacta`, row.id);
      continue;
    }
    candidates.push({ row, lead });
  }

  for (const [reason, ids] of discard) {
    await supabase.from("campaign_contacts").update({ status: "fallo", error: reason }).in("id", ids);
  }

  if (candidates.length === 0) {
    if (waiting > 0) return { kind: "waiting", detail: `Esperando que termine el análisis de ${waiting} negocio(s)` };
    return { kind: "empty" };
  }

  candidates.sort((a, b) => {
    const rank = (p: string) => (p === "alta" ? 0 : 1);
    return rank(a.lead.priority) - rank(b.lead.priority) || (b.lead.lead_score ?? 0) - (a.lead.lead_score ?? 0);
  });

  const best = candidates[0];
  return {
    kind: "ready",
    campaignContactId: best.row.id,
    contactId: best.row.contact_id,
    leadId: best.lead.id,
    phone: best.row.contacts?.phone ?? null,
    name: templateVar(best.row.contacts?.full_name ?? "tu negocio", 60),
    hook: best.lead.hook,
  };
}

/**
 * Prospección automática: si existe (y está en curso) la campaña
 * "Prospección automática Marketing", suma a ella los leads recién
 * analizados con prioridad alta o media que todavía no fueron contactados.
 */
export async function enqueueQualifiedLeads(): Promise<number> {
  const supabase = createAdminClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id")
    .eq("area", "marketing")
    .eq("name", AUTO_CAMPAIGN_NAME)
    .eq("status", "en_curso")
    .maybeSingle();
  if (!campaign) return 0;

  const { data: leads } = await supabase
    .from("marketing_leads")
    .select("contact_id, priority, lead_score")
    .eq("analysis_status", "listo")
    .eq("source_kind", "scraper")
    .eq("outreach_status", "sin_contactar")
    .in("priority", ["alta", "media"])
    .order("lead_score", { ascending: false })
    .limit(200);

  if (!leads || leads.length === 0) return 0;

  const ids = leads.map((l) => l.contact_id);
  const { data: already } = await supabase.from("campaign_contacts").select("contact_id").in("contact_id", ids);
  const alreadySet = new Set((already ?? []).map((a) => a.contact_id));

  const fresh = leads.filter((l) => !alreadySet.has(l.contact_id)).slice(0, 100);
  if (fresh.length === 0) return 0;

  const { error } = await supabase.from("campaign_contacts").insert(
    fresh.map((l) => ({
      campaign_id: campaign.id,
      contact_id: l.contact_id,
      status: "pendiente",
      priority: l.priority === "alta" ? 0 : 1,
    }))
  );
  if (error) {
    console.error("[marketing] No se pudieron sumar leads a la prospección automática:", error.message);
    return 0;
  }
  return fresh.length;
}
