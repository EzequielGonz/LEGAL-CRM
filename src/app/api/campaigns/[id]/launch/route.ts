import { NextResponse } from "next/server";
import { CampaignNotReadyError, launchCampaign } from "@/lib/campaigns";
import { AutomationPausedError } from "@/lib/automation-pause";
import { requireSession } from "@/lib/acceso/autorizacion";
import { respuestaErrorInterno } from "@/lib/error-publico";

// 22/11: al lanzar o reanudar una campaña de Jurídico se reordena la cola por gravedad (con presupuesto de 20 s).
export const maxDuration = 60;

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  try {
    const result = await launchCampaign(params.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    if (err instanceof CampaignNotReadyError) {
      return NextResponse.json({ error: err.message, faltantes: err.missing }, { status: 409 });
    }
    if (err instanceof AutomationPausedError) {
      return NextResponse.json({ error: err.message, pausa_general: true }, { status: 409 });
    }
    return respuestaErrorInterno(err, "campaigns/[id]/launch", 500);
  }
}
