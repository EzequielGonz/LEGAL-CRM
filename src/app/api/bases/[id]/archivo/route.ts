import { NextResponse } from "next/server";
import { setBaseArchived } from "@/lib/archive";
import { requireSession } from "@/lib/acceso/autorizacion";

export const dynamic = "force-dynamic";

/** body: { accion: "archivar" | "recuperar", nota? } */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  if (body?.accion !== "archivar" && body?.accion !== "recuperar") {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }
  try {
    await setBaseArchived(params.id, body.accion === "archivar", typeof body?.nota === "string" ? body.nota.trim() || null : null);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 400 });
  }
}
