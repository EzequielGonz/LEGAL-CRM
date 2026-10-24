import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { createAdminClient } from "@/lib/supabase/admin";
import { RUBRO_IDS, type RubroSlug } from "@/lib/rubros";
import { guardarFichaNegocio } from "@/lib/agentes/ficha-negocio";

export const dynamic = "force-dynamic";

/**
 * Ficha del negocio por rubro (24/10).
 * GET  ?perfil=<slug>        → { ficha, actualizada }
 * POST { perfil, ficha }     → guarda. No envía mensajes ni cambia campañas.
 */
function perfilDe(v: unknown): RubroSlug | null {
  return typeof v === "string" && v in RUBRO_IDS ? (v as RubroSlug) : null;
}

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const perfil = perfilDe(new URL(request.url).searchParams.get("perfil"));
  if (!perfil) return NextResponse.json({ error: "Perfil no válido" }, { status: 400 });
  const { data } = await createAdminClient().from("rubros").select("*").eq("id", RUBRO_IDS[perfil]).maybeSingle();
  return NextResponse.json({ ficha: (data as any)?.business_sheet ?? "", actualizada: (data as any)?.business_sheet_updated_at ?? null });
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null);
  const perfil = perfilDe(body?.perfil);
  if (!perfil) return NextResponse.json({ error: "Perfil no válido" }, { status: 400 });
  try {
    const r = await guardarFichaNegocio(RUBRO_IDS[perfil], body?.ficha);
    return NextResponse.json(r);
  } catch (err) {
    return NextResponse.json({ error: String((err as Error)?.message ?? err).slice(0, 300) }, { status: 400 });
  }
}
