import { NextResponse } from "next/server";
import { setCampaignArchived } from "@/lib/archive";

export const dynamic = "force-dynamic";

/** body: { accion: "archivar" | "recuperar", nota? }. Archivar pausa; recuperar no reanuda. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  if (body?.accion !== "archivar" && body?.accion !== "recuperar") {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }
  try {
    await setCampaignArchived(params.id, body.accion === "archivar", typeof body?.nota === "string" ? body.nota.trim() || null : null);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 400 });
  }
}
