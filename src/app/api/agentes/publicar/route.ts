import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { confirmPin } from "@/lib/acceso/confirmar-pin";
import { publicarVersion } from "@/lib/agentes/servicio";
import { responderError } from "../_comun";

export const dynamic = "force-dynamic";

/** POST { clave, version, publicacion: publicado|pausado|preparado|ajustado, pin }. Publicar exige evaluación aprobada. */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  if (!["publicado", "pausado", "preparado", "ajustado"].includes(body?.publicacion)) return NextResponse.json({ error: "Estado de publicación no válido." }, { status: 400 });
  const pin = await confirmPin(request, body?.pin, "biblioteca_agentes", { accion: "publicacion", clave: body?.clave, publicacion: body?.publicacion });
  if (!pin.ok) return NextResponse.json({ error: pin.error }, { status: pin.status });
  try {
    await publicarVersion({ clave: String(body?.clave ?? ""), version: Number(body?.version ?? 0), publicacion: body.publicacion });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return responderError(err);
  }
}
