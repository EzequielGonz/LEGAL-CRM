import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { rubroIdDe } from "@/lib/indicadores";
import { auditarUrl, validarUrlAuditoria } from "@/lib/seo/auditoria";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function hostsPermitidos(): string[] {
  return (process.env.LANDING_HOSTS ?? "").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
}

/**
 * Auditoría de landings (solo lectura). GET ?perfil= → últimas auditorías.
 * POST { perfil, url } → descarga la página propia (dominios de LANDING_HOSTS;
 * sin la variable, cualquier dominio público, nunca direcciones privadas) y guarda el resultado.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const rubroId = rubroIdDe(new URL(request.url).searchParams.get("perfil"));
  if (!rubroId) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const { data } = await createAdminClient().from("landing_audits").select("*").eq("rubro_id", rubroId).order("created_at", { ascending: false }).limit(10);
  return NextResponse.json({ auditorias: data ?? [], hostsPermitidos: hostsPermitidos() });
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const rubroId = rubroIdDe(body?.perfil);
  if (!rubroId) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const v = validarUrlAuditoria(String(body?.url ?? ""), hostsPermitidos());
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  try {
    const r = await auditarUrl(v.url.toString(), { hostsPermitidos: hostsPermitidos() });
    const { data } = await createAdminClient().from("landing_audits").insert({ rubro_id: rubroId, url: r.url, resultado: r, problemas: r.problemas, puntaje: r.puntaje }).select("id").single();
    return NextResponse.json({ ok: true, id: data?.id ?? null, auditoria: r });
  } catch (err: any) {
    return NextResponse.json({ error: `No se pudo auditar: ${String(err?.message ?? err)}` }, { status: 502 });
  }
}
