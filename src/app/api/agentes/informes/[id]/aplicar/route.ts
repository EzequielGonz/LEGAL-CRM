import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { RUBRO_IDS, type RubroSlug } from "@/lib/rubros";
import { aplicarPropuesta, InformeError } from "@/lib/agentes/informe-mejoras";

export const dynamic = "force-dynamic";

/**
 * Aplica una propuesta del informe de mejoras (14/11).
 * POST { perfil, indice, destino: "conocimiento" | "rol", titulo?, contenido?, disparadores? }
 * «conocimiento» suma una ficha nueva al bot del perfil; «rol» crea un rol sin asignar.
 * Nunca edita ni borra lo que hay y no envía mensajes.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const perfil = typeof body?.perfil === "string" && body.perfil in RUBRO_IDS ? (body.perfil as RubroSlug) : null;
  if (!perfil) return NextResponse.json({ error: "Perfil no válido" }, { status: 400 });
  const destino = body?.destino === "rol" ? "rol" : body?.destino === "conocimiento" ? "conocimiento" : null;
  if (!destino) return NextResponse.json({ error: "Elegí si se suma al bot del perfil o como rol nuevo." }, { status: 400 });
  const indice = Number(body?.indice);
  if (!Number.isInteger(indice) || indice < 0) return NextResponse.json({ error: "Propuesta no válida." }, { status: 400 });
  try {
    const r = await aplicarPropuesta({
      slug: perfil,
      informeId: id,
      indice,
      destino,
      cambios: { titulo: body?.titulo, contenido: body?.contenido, disparadores: body?.disparadores },
      actor: "panel",
    });
    return NextResponse.json({ ok: true, ...r });
  } catch (err) {
    if (err instanceof InformeError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[informes-bot] aplicar:", err);
    return NextResponse.json({ error: String((err as Error)?.message ?? "No se pudo aplicar.").slice(0, 300) }, { status: 400 });
  }
}
