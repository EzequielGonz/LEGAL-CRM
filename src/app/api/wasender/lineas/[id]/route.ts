import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { archivarLinea, editarLinea } from "@/lib/wasender/lineas";
import { lineaDelPerfil, perfilDe, respuestaError } from "@/lib/wasender/rutas";

export const dynamic = "force-dynamic";

/** Cambiar nombre, habilitar el envío, que responda el bot o el modo prueba. */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const perfil = perfilDe(body?.perfil);
  if (!perfil) return NextResponse.json({ error: "Perfil inválido." }, { status: 400 });
  if (!(await lineaDelPerfil(params.id, perfil.rubroId))) return NextResponse.json({ error: "Línea no encontrada en este perfil." }, { status: 404 });
  try {
    const linea = await editarLinea(params.id, {
      nombre: body?.nombre,
      habilitada: body?.habilitada,
      responde_con_bot: body?.responde_con_bot,
      modo_prueba: body?.modo_prueba,
      limite_diario: body?.limite_diario,
      reemplaza_linea_meta_id: body?.reemplaza_linea_meta_id,
      para_avisos: body?.para_avisos,
    });
    return NextResponse.json({ ok: true, linea });
  } catch (err) {
    return respuestaError(err);
  }
}

/** Archivar la línea con motivo (no se borra). */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const perfil = perfilDe(body?.perfil);
  if (!perfil) return NextResponse.json({ error: "Perfil inválido." }, { status: 400 });
  if (body?.accion !== "archivar") return NextResponse.json({ error: "Acción desconocida." }, { status: 400 });
  if (!(await lineaDelPerfil(params.id, perfil.rubroId))) return NextResponse.json({ error: "Línea no encontrada en este perfil." }, { status: 404 });
  try {
    return NextResponse.json({ ok: true, linea: await archivarLinea(params.id, body?.motivo) });
  } catch (err) {
    return respuestaError(err);
  }
}
