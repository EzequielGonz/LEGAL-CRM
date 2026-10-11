import { NextResponse } from "next/server";
import { CampaignNotReadyError, launchCampaign } from "@/lib/campaigns";
import { AutomationPausedError } from "@/lib/automation-pause";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
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
    return NextResponse.json({ error: String(err.message ?? err) }, { status: 500 });
  }
}
