import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  attachRecipients,
  baseContacts,
  CAMPAIGN_STATES_ACCEPTING_RECIPIENTS,
  planRecipients,
  planSummary,
} from "@/lib/campaign-recipients";
import { getCampaignInfo } from "@/lib/campaign-metrics";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Agrega a una campaña los contactos de una base ya importada (con el
 * mismo criterio que la vista previa de /api/campaigns/plan). Es una acción
 * explícita y separada de la carga: subir un archivo nunca agrega a nadie
 * por sí solo. No lanza la campaña ni envía: si la campaña está en curso
 * hay que pausarla antes, para que nadie reciba mensajes sin una
 * confirmación de lanzamiento.
 *
 * Body: { base_id, include_previously_contacted? }
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => null);
  const baseId = body?.base_id;
  if (typeof baseId !== "string" || !baseId) {
    return NextResponse.json({ error: "Falta la base" }, { status: 400 });
  }

  const campaign = await getCampaignInfo(params.id);
  if (!campaign) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
  if (campaign.archived) {
    return NextResponse.json({ error: "La campaña está archivada: recuperala antes de agregar contactos." }, { status: 409 });
  }
  if (!CAMPAIGN_STATES_ACCEPTING_RECIPIENTS.includes(campaign.status)) {
    return NextResponse.json(
      { error: "La campaña está en curso: pausala antes de agregar contactos, así nadie recibe mensajes sin confirmar." },
      { status: 409 }
    );
  }

  const supabase = createAdminClient();
  const { data: base } = await supabase.from("imported_bases").select("id, area").eq("id", baseId).maybeSingle();
  if (!base) return NextResponse.json({ error: "Base no encontrada" }, { status: 404 });
  if (base.area !== campaign.area) {
    return NextResponse.json({ error: "La base y la campaña son de áreas o perfiles distintos." }, { status: 400 });
  }

  try {
    const bc = await baseContacts(baseId);
    const plan = await planRecipients(bc.ids, {
      campaignId: campaign.id,
      includePreviouslyContacted: body?.include_previously_contacted === true,
      priority: bc.priority,
      filasSinContacto: bc.filasSinContacto,
    });
    const agregados = await attachRecipients(campaign.id, plan);
    return NextResponse.json({ ok: true, agregados, plan: planSummary(plan), campaign });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
