import { NextResponse } from "next/server";
import { pauseCampaign } from "@/lib/campaigns";
import { requireSession } from "@/lib/acceso/autorizacion";
import { esUuid } from "@/lib/rutas/comprobar";

/** Pausa con motivo (bloque 1.8). body opcional: { motivo } */
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const motivo = typeof body?.motivo === "string" && body.motivo.trim() ? body.motivo.trim().slice(0, 300) : undefined;
  if (!esUuid(params.id)) return NextResponse.json({ error: "Campaña no válida." }, { status: 400 });
  try {
    if (!(await pauseCampaign(params.id, motivo))) return NextResponse.json({ error: "Esa campaña no existe." }, { status: 404 });
  } catch (err) {
    console.error("[campaigns/pause]", err);
    return NextResponse.json({ error: "No se pudo pausar la campaña." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
