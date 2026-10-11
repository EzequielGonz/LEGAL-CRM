import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { baseContacts, contactPriorities, planRecipients, planSummary } from "@/lib/campaign-recipients";
import { getCampaignInfo } from "@/lib/campaign-metrics";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vista previa de destinatarios, sin guardar nada: cuántos contactos de una
 * base (o de una selección) entrarían a una campaña, cuántos quedan afuera
 * por detención, por contacto anterior o porque ya están en la campaña.
 * Se muestra antes de confirmar; no agrega ni envía.
 *
 * Body: { base_id? | contact_ids?, campaign_id?, include_previously_contacted? }
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  const { base_id, contact_ids, campaign_id, include_previously_contacted } = body as {
    base_id?: string;
    contact_ids?: string[];
    campaign_id?: string;
    include_previously_contacted?: boolean;
  };
  if (!base_id && !(Array.isArray(contact_ids) && contact_ids.length > 0)) {
    return NextResponse.json({ error: "Falta la base o la selección de contactos" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const campaign = campaign_id ? await getCampaignInfo(campaign_id) : null;
  if (campaign_id && !campaign) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });

  try {
    let ids: string[];
    let priority: Map<string, number>;
    let filasSinContacto = 0;
    let base: { id: string; name: string; area: string; total_rows: number } | null = null;
    if (base_id) {
      const { data } = await supabase
        .from("imported_bases")
        .select("id, name, area, total_rows")
        .eq("id", base_id)
        .maybeSingle();
      if (!data) return NextResponse.json({ error: "Base no encontrada" }, { status: 404 });
      base = data as any;
      if (campaign && campaign.area !== data.area) {
        return NextResponse.json(
          { error: "La base y la campaña son de áreas o perfiles distintos." },
          { status: 400 }
        );
      }
      const bc = await baseContacts(base_id);
      ids = bc.ids;
      priority = bc.priority;
      filasSinContacto = bc.filasSinContacto;
    } else {
      ids = contact_ids as string[];
      priority = await contactPriorities(ids);
    }
    const plan = await planRecipients(ids, {
      campaignId: campaign?.id ?? null,
      includePreviouslyContacted: include_previously_contacted === true,
      priority,
      filasSinContacto,
    });
    return NextResponse.json({ campaign, base, plan: planSummary(plan) });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
