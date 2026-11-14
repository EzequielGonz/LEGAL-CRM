import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { RUBRO_IDS, type RubroSlug } from "@/lib/rubros";
import { InformeError, sumarFichaDirecta } from "@/lib/agentes/informe-mejoras";

export const dynamic = "force-dynamic";

/**
 * Sumar una ficha de conocimiento al bot del perfil (14/11, la usa el asistente).
 * POST { perfil, titulo, contenido, capa?, disparadores? } → solo alta, nunca edita ni borra.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null);
  const perfil = typeof body?.perfil === "string" && body.perfil in RUBRO_IDS ? (body.perfil as RubroSlug) : null;
  if (!perfil) return NextResponse.json({ error: "Perfil no válido" }, { status: 400 });
  try {
    const r = await sumarFichaDirecta({ slug: perfil, titulo: body?.titulo, contenido: body?.contenido, capa: body?.capa, disparadores: body?.disparadores, actor: "asistente" });
    return NextResponse.json({ ok: true, ...r });
  } catch (err) {
    if (err instanceof InformeError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: String((err as Error)?.message ?? "No se pudo sumar la ficha.").slice(0, 300) }, { status: 400 });
  }
}
