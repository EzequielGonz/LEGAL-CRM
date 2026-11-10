import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { estadoYQr } from "@/lib/wasender/lineas";
import { lineaDelPerfil, perfilDe, respuestaError } from "@/lib/wasender/rutas";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Estado en vivo de la línea en Wasender y, si hace falta escanear, el QR (como imagen). */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const perfil = perfilDe(new URL(request.url).searchParams.get("perfil"));
  if (!perfil) return NextResponse.json({ error: "Perfil inválido." }, { status: 400 });
  if (!(await lineaDelPerfil(params.id, perfil.rubroId))) return NextResponse.json({ error: "Línea no encontrada en este perfil." }, { status: 404 });
  try {
    return NextResponse.json(await estadoYQr(params.id), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return respuestaError(err);
  }
}
