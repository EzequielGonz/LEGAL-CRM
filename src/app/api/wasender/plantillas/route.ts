import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { copiarDesdeMetaTodos, crearPlantilla, listarPlantillas } from "@/lib/wasender/plantillas-servidor";
import { perfilDe, respuestaError } from "@/lib/wasender/rutas";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Plantillas de Wasender del perfil. */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const perfil = perfilDe(new URL(request.url).searchParams.get("perfil"));
  if (!perfil) return NextResponse.json({ error: "Perfil inválido." }, { status: 400 });
  try {
    return NextResponse.json({ plantillas: await listarPlantillas(perfil.rubroId) }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return respuestaError(err);
  }
}

/** Crear una plantilla, o copiar como base las aprobadas de Meta en los cuatro perfiles (accion: "copiar_meta"). */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const perfil = perfilDe(body?.perfil);
  if (!perfil) return NextResponse.json({ error: "Perfil inválido." }, { status: 400 });
  try {
    if (body?.accion === "copiar_meta") return NextResponse.json({ ok: true, ...(await copiarDesdeMetaTodos()) });
    return NextResponse.json({ ok: true, plantilla: await crearPlantilla(perfil.rubroId, body) });
  } catch (err) {
    return respuestaError(err);
  }
}
