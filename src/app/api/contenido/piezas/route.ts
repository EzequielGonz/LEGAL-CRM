import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { rubroIdDe } from "@/lib/indicadores";
import { generarPieza, planCalendario, type BriefMarca } from "@/lib/contenido/brief";
import { CANALES, type Canal } from "@/lib/contenido/politica";
import { crearPieza, politica } from "@/lib/contenido/cola";
import { createAdminClient } from "@/lib/supabase/admin";
import { RUBRO_IDS, type RubroSlug } from "@/lib/rubros";

export const dynamic = "force-dynamic";

const SLUG = Object.fromEntries(Object.entries(RUBRO_IDS).map(([k, v]) => [v, k])) as Record<string, RubroSlug>;

/**
 * Generación de piezas desde el brief. POST { perfil, canales?, semanas?, porSemana?, soloVista? }.
 * Con soloVista devuelve las piezas (texto + SVG) sin guardar. Sin soloVista
 * las encola: cada una queda «lista», «programada» o «retenida» según la
 * política del canal (apagada → retenida). Nunca publica desde acá.
 * GET ?perfil= → piezas de la cola con estado y motivo.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const rubroId = rubroIdDe(new URL(request.url).searchParams.get("perfil"));
  if (!rubroId) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const { data } = await createAdminClient().from("content_pieces").select("id, canal, formato, titulo, texto, estado, motivo, programada_para, publicada_at, url_publicada, created_at").eq("rubro_id", rubroId).order("created_at", { ascending: false }).limit(60);
  return NextResponse.json({ piezas: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const rubroId = rubroIdDe(body?.perfil);
  if (!rubroId) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const canales = (Array.isArray(body?.canales) ? body.canales : ["instagram", "facebook"]).filter((c: unknown): c is Canal => CANALES.includes(c as Canal) && c !== "landing");
  if (!canales.length) return NextResponse.json({ error: "Elegí al menos un canal (instagram o facebook)." }, { status: 400 });
  const semanas = Math.min(4, Math.max(1, Number(body?.semanas) || 1));
  const porSemana = Math.min(3, Math.max(1, Number(body?.porSemana) || 2));
  const { data: b } = await createAdminClient().from("brand_briefs").select("*").eq("rubro_id", rubroId).maybeSingle();
  const brief: BriefMarca = {
    rubro: SLUG[rubroId],
    nombre_publico: b?.nombre_publico ?? null,
    logo_ref: b?.logo_ref ?? null,
    colores: (b?.colores as any) ?? {},
    servicios: (b?.servicios as string[]) ?? [],
    publico: b?.publico ?? null,
    zonas: b?.zonas ?? null,
    tono: b?.tono ?? null,
    contacto: (b?.contacto as any) ?? {},
    objetivos: b?.objetivos ?? null,
    afirmaciones_autorizadas: (b?.afirmaciones_autorizadas as string[]) ?? [],
    prohibido: (b?.prohibido as string[]) ?? [],
  };
  const desde = new Date();
  desde.setUTCDate(desde.getUTCDate() + 1);
  const plan = planCalendario({ desde, semanas, canales, porSemana });
  const piezas = [];
  for (const slot of plan) {
    const pol = await politica(rubroId, slot.canal);
    const cta = pol.ctas[0] ?? null;
    const p = generarPieza({ brief, canal: slot.canal, indicePilar: slot.indicePilar, cta, fecha: slot.fecha });
    if (body?.soloVista === true) {
      piezas.push({ ...p, fecha: slot.fecha });
      continue;
    }
    if (p.motivosRetencion.length) {
      // Brief incompleto o texto no autorizado: entra retenida con el motivo, sin fecha.
      const { data, error } = await createAdminClient().from("content_pieces").insert({
        rubro_id: rubroId, canal: p.canal, formato: p.formato, titulo: p.titulo, texto: p.texto, cta_url: p.cta_url, media: p.media, afirmaciones: p.afirmaciones,
        estado: "retenida", motivo: p.motivosRetencion.join("; ").slice(0, 300), dedupe_key: `brief:${rubroId}:${p.canal}:${slot.fecha}:${p.titulo}`, created_by: "generador",
      }).select("id, estado, motivo").single();
      piezas.push({ id: data?.id ?? null, estado: data?.estado ?? "retenida", motivo: data?.motivo ?? p.motivosRetencion.join("; "), error: error?.message ?? null, canal: p.canal, titulo: p.titulo, fecha: slot.fecha });
      continue;
    }
    try {
      const r = await crearPieza({ ...p, rubroId, programadaPara: slot.fecha, createdBy: "generador" });
      piezas.push({ id: (r as any)?.id ?? null, estado: (r as any)?.estado ?? null, motivo: (r as any)?.motivo ?? null, canal: p.canal, titulo: p.titulo, fecha: slot.fecha });
    } catch (err: any) {
      piezas.push({ id: null, estado: "error", motivo: String(err?.message ?? err), canal: p.canal, titulo: p.titulo, fecha: slot.fecha });
    }
  }
  return NextResponse.json({ ok: true, piezas });
}
