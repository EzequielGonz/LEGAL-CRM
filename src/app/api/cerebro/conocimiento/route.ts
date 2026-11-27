import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { createAdminClient } from "@/lib/supabase/admin";
import { esSlugPerfil } from "@/lib/marca";
import { RUBRO_IDS } from "@/lib/rubros";
import { validarEntrada } from "@/lib/cerebro/conocimiento";
import { COLUMNAS_CONOCIMIENTO, leerAprendido } from "@/lib/cerebro/conocimiento-servidor";

export const dynamic = "force-dynamic";

/** Lo que el cerebro aprendió (vigente). Si falta aplicar la migración 0650, `disponible: false`. */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  return NextResponse.json(await leerAprendido());
}

/** Enseñarle algo: { tipo, titulo, contenido, fuente?, perfil? }. La confirmación la pide la pantalla antes de llamar. */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const v = validarEntrada(body);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  const rubro_id = esSlugPerfil(body?.perfil) ? RUBRO_IDS[body.perfil as keyof typeof RUBRO_IDS] : null;
  const { data, error } = await createAdminClient().from("cerebro_conocimiento" as any).insert({ ...v.valor, rubro_id, creado_por: "operador" }).select(COLUMNAS_CONOCIMIENTO).single();
  if (error) {
    console.error("[cerebro/conocimiento]", error.message);
    const falta = /does not exist|relation|schema cache/i.test(error.message);
    return NextResponse.json({ error: falta ? "Todavía falta activar este cuaderno del cerebro (migración 0650). Avisale a Claude." : "No se pudo guardar. Probá de nuevo." }, { status: falta ? 503 : 500 });
  }
  return NextResponse.json({ item: data }, { status: 201 });
}

/** Archivar (no se borra): { id }. */
export async function PATCH(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  if (typeof body?.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id)) return NextResponse.json({ error: "Falta indicar cuál." }, { status: 400 });
  const { error } = await createAdminClient().from("cerebro_conocimiento" as any).update({ archivada_at: new Date().toISOString() }).eq("id", body.id).is("archivada_at", null);
  if (error) return NextResponse.json({ error: "No se pudo archivar." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
