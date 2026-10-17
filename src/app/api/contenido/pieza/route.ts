import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { rubroIdDe } from "@/lib/indicadores";
import { faltantesDelBrief, generarPieza, PILARES, type BriefMarca } from "@/lib/contenido/brief";
import { CANALES, evaluarPieza, type Canal } from "@/lib/contenido/politica";
import { crearPieza, politica } from "@/lib/contenido/cola";
import { consecuencias, faltaImprescindible, fechaProgramable, type AccionPieza } from "@/lib/contenido/guiado";
import { createAdminClient } from "@/lib/supabase/admin";
import { RUBRO_IDS, type RubroSlug } from "@/lib/rubros";

export const dynamic = "force-dynamic";

const SLUG = Object.fromEntries(Object.entries(RUBRO_IDS).map(([k, v]) => [v, k])) as Record<string, RubroSlug>;

/**
 * Una pieza del recorrido guiado de Contenido (Simple y Avanzado usan la
 * misma). POST { perfil, canal, tema?, indicePilar?, textoPropio?, accion, fecha? }.
 *  - «vista»: texto, imagen y qué pasaría con cada acción. No guarda nada.
 *  - «borrador»: se guarda en estado borrador (no se programa ni se publica).
 *  - «programar»: entra a la cola con fecha; la política del canal decide si
 *    queda programada, lista o retenida (con motivo). Nunca publica desde acá.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const rubroId = rubroIdDe(body?.perfil);
  if (!rubroId) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const canal = body?.canal as Canal;
  if (!CANALES.includes(canal) || canal === "landing") return NextResponse.json({ error: "Elegí Instagram o Facebook.", campo: "guiado-canal" }, { status: 400 });
  const accion: AccionPieza = body?.accion === "borrador" || body?.accion === "programar" ? body.accion : "vista";
  const tema = typeof body?.tema === "string" ? body.tema : "";
  const textoPropio = typeof body?.textoPropio === "string" ? body.textoPropio : "";
  if (!tema.trim() && !textoPropio.trim() && !Number.isInteger(body?.indicePilar)) {
    return NextResponse.json({ error: "Contá qué querés comunicar o elegí un tema sugerido.", campo: "guiado-tema" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: b } = await db.from("brand_briefs").select("*").eq("rubro_id", rubroId).maybeSingle();
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
  const pol = await politica(rubroId, canal);
  const cta = pol.ctas[0] ?? null;
  const indicePilar = Number.isInteger(body?.indicePilar) ? Number(body.indicePilar) : 0;
  const p = generarPieza({ brief, canal, indicePilar, cta, tema, textoPropio });
  const ev = evaluarPieza(p, pol);
  const resumen = consecuencias(ev, p.motivosRetencion);
  const faltan = faltaImprescindible(faltantesDelBrief(brief));

  if (accion === "vista") {
    return NextResponse.json({
      ok: true,
      pieza: { titulo: p.titulo, texto: p.texto, svg: p.svg, pilar: p.pilar, canal: p.canal, formato: p.formato },
      faltan,
      consecuencias: resumen,
      pilares: PILARES[SLUG[rubroId]].map((x) => x.pilar),
    });
  }

  if (accion === "borrador") {
    const huella = createHash("sha256").update(`${canal}\n${p.titulo}\n${p.texto}`).digest("hex").slice(0, 24);
    const fila = {
      rubro_id: rubroId, canal: p.canal, formato: p.formato, titulo: p.titulo, texto: p.texto, cta_url: p.cta_url, media: p.media, afirmaciones: p.afirmaciones,
      estado: "borrador", motivo: null, dedupe_key: `guiado:${rubroId}:borrador:${huella}`, zona_horaria: pol.zona_horaria, created_by: "guiado",
    };
    const { data, error } = await db.from("content_pieces").insert(fila as any).select("id, estado").maybeSingle();
    if (error && (error as any).code === "23505") {
      return NextResponse.json({ ok: true, estado: "borrador", duplicada: true, mensaje: "Ese mismo borrador ya estaba guardado." });
    }
    if (error) return NextResponse.json({ error: "No se pudo guardar el borrador." }, { status: 500 });
    return NextResponse.json({ ok: true, id: data?.id ?? null, estado: "borrador", mensaje: resumen.borrador });
  }

  // programar
  const f = fechaProgramable(body?.fecha);
  if (!f.ok) return NextResponse.json({ error: f.error, campo: "guiado-fecha" }, { status: 400 });
  if (p.motivosRetencion.length) {
    const huella = createHash("sha256").update(`${canal}\n${p.titulo}\n${p.texto}\n${f.fecha}`).digest("hex").slice(0, 24);
    const { data, error } = await db.from("content_pieces").insert({
      rubro_id: rubroId, canal: p.canal, formato: p.formato, titulo: p.titulo, texto: p.texto, cta_url: p.cta_url, media: p.media, afirmaciones: p.afirmaciones,
      estado: "retenida", motivo: p.motivosRetencion.join("; ").slice(0, 300), programada_para: f.fecha, zona_horaria: pol.zona_horaria,
      dedupe_key: `guiado:${rubroId}:${huella}`, created_by: "guiado",
    }).select("id, estado, motivo").maybeSingle();
    if (error && (error as any).code !== "23505") return NextResponse.json({ error: "No se pudo guardar la pieza." }, { status: 500 });
    return NextResponse.json({ ok: true, id: data?.id ?? null, estado: "retenida", motivo: data?.motivo ?? null, mensaje: resumen.programar, bloqueos: resumen.bloqueos });
  }
  try {
    const r: any = await crearPieza({ ...p, rubroId, programadaPara: f.fecha, createdBy: "guiado" });
    return NextResponse.json({ ok: true, id: r?.id ?? null, estado: r?.estado ?? null, motivo: r?.motivo ?? null, duplicada: !!r?.duplicada, mensaje: resumen.programar, bloqueos: resumen.bloqueos });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar la pieza." }, { status: 500 });
  }
}
