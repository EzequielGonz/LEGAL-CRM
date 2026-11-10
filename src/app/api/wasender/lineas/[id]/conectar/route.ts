import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { conectar, desconectar } from "@/lib/wasender/lineas";
import { lineaDelPerfil, perfilDe, respuestaError } from "@/lib/wasender/rutas";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Conectar (genera el QR para escanear) o desconectar la línea en Wasender. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const perfil = perfilDe(body?.perfil);
  if (!perfil) return NextResponse.json({ error: "Perfil inválido." }, { status: 400 });
  if (!(await lineaDelPerfil(params.id, perfil.rubroId))) return NextResponse.json({ error: "Línea no encontrada en este perfil." }, { status: 404 });
  try {
    if (body?.accion === "desconectar") return NextResponse.json({ ok: true, linea: await desconectar(params.id), qrImagen: null });
    return NextResponse.json({ ok: true, ...(await conectar(params.id)) });
  } catch (err) {
    return respuestaError(err);
  }
}
