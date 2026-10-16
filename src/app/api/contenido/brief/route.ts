import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { rubroIdDe } from "@/lib/indicadores";
import { briefCompleto, faltantesDelBrief, PILARES } from "@/lib/contenido/brief";
import { createAdminClient } from "@/lib/supabase/admin";
import { RUBRO_IDS, type RubroSlug } from "@/lib/rubros";

export const dynamic = "force-dynamic";

const SLUG = Object.fromEntries(Object.entries(RUBRO_IDS).map(([k, v]) => [v, k])) as Record<string, RubroSlug>;

/**
 * Brief de marca por perfil (Etapa 3 · contenido). GET ?perfil= → brief,
 * faltantes y pilares editoriales. PUT { perfil, ...campos } → guarda (sin
 * PIN: no publica nada). Los secretos de redes NO van acá: solo nombre,
 * logo (enlace), colores, servicios, público, zonas, tono, contacto público.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const rubroId = rubroIdDe(new URL(request.url).searchParams.get("perfil"));
  if (!rubroId) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const { data } = await createAdminClient().from("brand_briefs").select("*").eq("rubro_id", rubroId).maybeSingle();
  const brief = data ?? { rubro_id: rubroId, servicios: [], colores: {}, contacto: {}, afirmaciones_autorizadas: [], prohibido: [] };
  return NextResponse.json({ brief, faltantes: faltantesDelBrief(brief as any), completo: briefCompleto(brief as any), pilares: PILARES[SLUG[rubroId]] });
}

const TEXTO = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) || null : null);
const LISTA = (v: unknown, max = 20) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim().slice(0, 200)).slice(0, max) : []);

export async function PUT(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const rubroId = rubroIdDe(body?.perfil);
  if (!rubroId) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const logo = TEXTO(body?.logo_ref, 500);
  if (logo && !/^https:\/\//.test(logo)) return NextResponse.json({ error: "El logo tiene que ser un enlace https." }, { status: 400 });
  const colores: Record<string, string> = {};
  for (const k of ["primario", "secundario", "texto"]) {
    const v = body?.colores?.[k];
    if (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v.trim())) colores[k] = v.trim();
  }
  const contacto: Record<string, string> = {};
  for (const k of ["whatsapp", "web", "direccion"]) {
    const v = TEXTO(body?.contacto?.[k], 200);
    if (v) contacto[k] = v;
  }
  const fila = {
    rubro_id: rubroId,
    nombre_publico: TEXTO(body?.nombre_publico, 120),
    logo_ref: logo,
    colores,
    servicios: LISTA(body?.servicios),
    publico: TEXTO(body?.publico),
    zonas: TEXTO(body?.zonas, 200),
    tono: TEXTO(body?.tono, 300),
    contacto,
    web: TEXTO(body?.web, 300),
    objetivos: TEXTO(body?.objetivos, 600),
    afirmaciones_autorizadas: LISTA(body?.afirmaciones_autorizadas, 30),
    prohibido: LISTA(body?.prohibido, 30),
    updated_at: new Date().toISOString(),
  };
  const completo = briefCompleto(fila as any);
  const { error } = await createAdminClient().from("brand_briefs").upsert({ ...fila, completo }, { onConflict: "rubro_id" });
  if (error) return NextResponse.json({ error: "No se pudo guardar el brief." }, { status: 500 });
  return NextResponse.json({ ok: true, completo, faltantes: faltantesDelBrief(fila as any) });
}
