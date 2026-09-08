import { NextResponse } from "next/server";
import { pauseCampaign } from "@/lib/campaigns";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  await pauseCampaign(params.id);
  return NextResponse.json({ ok: true });
}
