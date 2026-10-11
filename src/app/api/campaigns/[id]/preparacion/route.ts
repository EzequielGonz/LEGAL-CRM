import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { campaignReadiness } from "@/lib/profiles";
import { getAutomationPause } from "@/lib/automation-pause";

export const dynamic = "force-dynamic";

/** Qué falta para poder lanzar la campaña (se muestra junto al botón). */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("area, line_id, message_template_name, template_id, archived_at, status, pause_reason")
    .eq("id", params.id)
    .maybeSingle();
  if (!campaign) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
  const readiness = await campaignReadiness(campaign as any);
  const pause = await getAutomationPause();
  const missing = [...readiness.missing];
  if (campaign.archived_at) missing.unshift("La campaña está archivada (recuperala primero)");
  return NextResponse.json({
    ready: missing.length === 0 && !pause.outboundPaused,
    missing,
    pausa_general: pause.outboundPaused,
    pause_reason:
      campaign.status === "pausada"
        ? campaign.pause_reason ?? "Pausada antes de la Etapa 1 (sin motivo registrado)"
        : null,
  });
}
