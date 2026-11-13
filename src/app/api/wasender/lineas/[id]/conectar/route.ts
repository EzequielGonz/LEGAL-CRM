import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { entornoPuedeRecibirMensajes } from "@/lib/rutas/comprobar";
import { conectar, desconectar, recibirAqui } from "@/lib/wasender/lineas";
import { lineaDelPerfil, perfilDe, respuestaError } from "@/lib/wasender/rutas";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Conectar (genera el QR), desconectar, o hacer que la línea le avise a este entorno (accion: "recibir_aqui"). */
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const perfil = perfilDe(body?.perfil);
  if (!perfil) return NextResponse.json({ error: "Perfil inválido." }, { status: 400 });
  if (!(await lineaDelPerfil(params.id, perfil.rubroId))) return NextResponse.json({ error: "Línea no encontrada en este perfil." }, { status: 404 });
  try {
    // 13/11: desde una vista previa no se desvían los mensajes entrantes de producción.
    if (body?.accion === "recibir_aqui" && !entornoPuedeRecibirMensajes())
      return NextResponse.json({ error: "Esto solo se puede hacer desde el panel publicado: una vista previa desviaría los mensajes que entran." }, { status: 409 });
    if (body?.accion === "recibir_aqui") return NextResponse.json({ ok: true, ...(await recibirAqui(params.id)) });
    if (body?.accion === "desconectar") return NextResponse.json({ ok: true, linea: await desconectar(params.id), qrImagen: null });
    return NextResponse.json({ ok: true, ...(await conectar(params.id)) });
  } catch (err) {
    return respuestaError(err);
  }
}
