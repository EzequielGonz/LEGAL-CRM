import { NextResponse } from "next/server";
import { launchCampaign } from "@/lib/campaigns";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await launchCampaign(params.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message ?? err) }, { status: 500 });
  }
}
