import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { createAdminClient } from "@/lib/supabase/admin";
import { RUBRO_IDS, type RubroSlug } from "@/lib/rubros";
import { AREAS_DE_PERFIL } from "@/lib/cartera-servidor";
import { probarBotReal } from "@/lib/ai-agent/probar-real";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * «Probar el bot real» (24/10). POST { perfil, area?, base_id?, mensajes[], apertura? }.
 * Usa el mismo prompt y el mismo modelo que responden hoy, con mensajes
 * ficticios. No escribe a nadie, no agenda y no cambia estados.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null);
  const perfil = typeof body?.perfil === "string" && body.perfil in RUBRO_IDS ? (body.perfil as RubroSlug) : null;
  if (!perfil) return NextResponse.json({ error: "Perfil no válido" }, { status: 400 });
  const areas = AREAS_DE_PERFIL[perfil] ?? [perfil];
  const area = typeof body?.area === "string" && areas.includes(body.area) ? body.area : areas[0];
  const mensajes: string[] = Array.isArray(body?.mensajes)
    ? body.mensajes.filter((m: unknown) => typeof m === "string" && m.trim()).map((m: string) => m.trim().slice(0, 1000)).slice(0, 8)
    : [];
  if (!mensajes.length) return NextResponse.json({ error: "Escribí al menos un mensaje de la persona." }, { status: 400 });
  let baseId: string | null = null;
  if (typeof body?.base_id === "string" && body.base_id) {
    const { data: base } = await createAdminClient().from("imported_bases" as any).select("id, area").eq("id", body.base_id).maybeSingle();
    if (!base || !areas.includes((base as any).area)) return NextResponse.json({ error: "Esa base no es de este perfil." }, { status: 400 });
    baseId = (base as any).id;
  }
  try {
    const r = await probarBotReal({
      area: area as any,
      rubroId: RUBRO_IDS[perfil],
      baseId,
      mensajes,
      apertura: typeof body?.apertura === "string" ? body.apertura.slice(0, 1500) : null,
    });
    return NextResponse.json({ ok: true, ...r });
  } catch (err) {
    console.error("[probar-real]", err);
    return NextResponse.json({ error: String((err as Error)?.message ?? "No se pudo probar el bot.").slice(0, 300) }, { status: 500 });
  }
}
