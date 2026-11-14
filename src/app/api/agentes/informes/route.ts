import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { RUBRO_IDS, type RubroSlug } from "@/lib/rubros";
import { generarInforme, InformeError, listarInformes } from "@/lib/agentes/informe-mejoras";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Informes de mejora del bot (14/11).
 * GET  ?perfil=<slug>          → últimos informes del perfil.
 * POST { perfil, dias }        → la IA relee las conversaciones del período y deja hallazgos y propuestas.
 * No envía mensajes ni cambia el bot: aplicar una propuesta es otra acción.
 */
function perfilDe(v: unknown): RubroSlug | null {
  return typeof v === "string" && v in RUBRO_IDS ? (v as RubroSlug) : null;
}

function error(err: unknown) {
  if (err instanceof InformeError) return NextResponse.json({ error: err.message }, { status: err.status });
  console.error("[informes-bot]", err);
  return NextResponse.json({ error: "No se pudo completar la acción." }, { status: 500 });
}

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const perfil = perfilDe(new URL(request.url).searchParams.get("perfil"));
  if (!perfil) return NextResponse.json({ error: "Perfil no válido" }, { status: 400 });
  try {
    return NextResponse.json({ informes: await listarInformes(perfil) }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return error(err);
  }
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null);
  const perfil = perfilDe(body?.perfil);
  if (!perfil) return NextResponse.json({ error: "Perfil no válido" }, { status: 400 });
  try {
    const informe = await generarInforme(perfil, Number(body?.dias) || 14, "panel");
    return NextResponse.json({ ok: informe.estado === "listo", informe, ...(informe.estado === "error" ? { error: "La IA no pudo terminar el informe. Probá de nuevo en un rato." } : {}) });
  } catch (err) {
    return error(err);
  }
}
