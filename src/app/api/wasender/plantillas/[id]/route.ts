import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { archivarPlantilla, editarPlantilla } from "@/lib/wasender/plantillas-servidor";
import { perfilDe, respuestaError } from "@/lib/wasender/rutas";

export const dynamic = "force-dynamic";

/** Editar una plantilla del perfil. */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const perfil = perfilDe(body?.perfil);
  if (!perfil) return NextResponse.json({ error: "Perfil inválido." }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, plantilla: await editarPlantilla(perfil.rubroId, params.id, body) });
  } catch (err) {
    return respuestaError(err);
  }
}

/** Archivar con motivo (no se borra). */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const perfil = perfilDe(body?.perfil);
  if (!perfil) return NextResponse.json({ error: "Perfil inválido." }, { status: 400 });
  if (body?.accion !== "archivar") return NextResponse.json({ error: "Acción desconocida." }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, plantilla: await archivarPlantilla(perfil.rubroId, params.id, body?.motivo) });
  } catch (err) {
    return respuestaError(err);
  }
}
