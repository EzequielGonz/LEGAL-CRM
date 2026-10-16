import { NextResponse } from "next/server";
import { pauseCampaign } from "@/lib/campaigns";
import { requireSession } from "@/lib/acceso/autorizacion";

/** Pausa con motivo (bloque 1.8). body opcional: { motivo } */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const motivo = typeof body?.motivo === "string" && body.motivo.trim() ? body.motivo.trim().slice(0, 300) : undefined;
  await pauseCampaign(params.id, motivo);
  return NextResponse.json({ ok: true });
}
