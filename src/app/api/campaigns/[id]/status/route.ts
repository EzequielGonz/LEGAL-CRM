import { NextResponse } from "next/server";
import { getCampaignStatus } from "@/lib/campaigns";

/**
 * Foto de solo lectura del estado actual de una campaña, para el panel de
 * seguimiento en vivo del panel (se consulta cada pocos segundos mientras
 * ese panel está abierto). Nunca dispara envíos: eso lo sigue haciendo
 * únicamente el cron que pega a /api/campaigns/tick.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const snapshot = await getCampaignStatus(params.id);
    return NextResponse.json(snapshot);
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message ?? err) }, { status: 404 });
  }
}
