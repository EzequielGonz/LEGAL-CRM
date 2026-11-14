import { after, NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { RUBRO_IDS, type RubroSlug } from "@/lib/rubros";
import { InformeError, listarInformes, prepararInforme } from "@/lib/agentes/informe-mejoras";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Informes de mejora del bot (14/11).
 * GET  ?perfil=<slug>          → últimos informes del perfil.
 * POST { perfil, dias }        → deja el informe «procesando» y la IA lo completa en segundo plano
 *                                (la pantalla consulta con GET hasta que queda listo).
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
    const { informe, completar } = await prepararInforme(perfil, Number(body?.dias) || 14, "panel");
    if (completar) after(completar);
    return NextResponse.json({ ok: true, informe }, { status: 202 });
  } catch (err) {
    return error(err);
  }
}
