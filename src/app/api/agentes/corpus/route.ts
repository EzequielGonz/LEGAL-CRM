import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { exportarCorpus, sembrarCasosControl, sembrarCorpus, sembrarModulos } from "@/lib/agentes/servicio";
import { planDistribucion } from "@/lib/agentes/corpus";
import { createAdminClient } from "@/lib/supabase/admin";
import { RUBRO_IDS } from "@/lib/rubros";
import { responderError } from "../_comun";

export const dynamic = "force-dynamic";

const SLUG: Record<string, string> = Object.fromEntries(Object.entries(RUBRO_IDS).map(([k, v]) => [v, k]));

/**
 * Corpus revisable. GET → conjuntos, casos (sin datos reales) y plan de
 * distribución. POST { accion: "sembrar" } siembra el piloto;
 * POST { accion: "exportar", setId, particion } devuelve el JSONL validado
 * (no sube nada a ningún proveedor). PATCH { id, revision, correccion? } revisa un caso.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const s = createAdminClient();
  const [{ data: sets }, { data: casos }] = await Promise.all([
    s.from("training_sets").select("*").order("created_at"),
    s.from("training_cases").select("id, set_id, clave, familia, rubro_id, area, modo, particion, revision, regla, procedencia, created_at").order("clave"),
  ]);
  const plan = planDistribucion((casos ?? []).map((c: any) => ({ rubro: SLUG[c.rubro_id] ?? "juridico", particion: c.particion, revision: c.revision })));
  return NextResponse.json({ sets: sets ?? [], casos: casos ?? [], plan });
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  try {
    if (body?.accion === "sembrar") return NextResponse.json({ ok: true, ...(await sembrarModulos()), ...(await sembrarCasosControl()), ...(await sembrarCorpus()) });
    if (body?.accion === "exportar") {
      if (!["entrenamiento", "validacion", "reservado"].includes(body?.particion)) return NextResponse.json({ error: "Partición no válida." }, { status: 400 });
      const r = await exportarCorpus(String(body?.setId ?? ""), body.particion);
      return NextResponse.json({ ok: true, ...r });
    }
    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  } catch (err) {
    return responderError(err);
  }
}

export async function PATCH(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  if (!["pendiente", "aprobado", "rechazado"].includes(body?.revision)) return NextResponse.json({ error: "Revisión no válida." }, { status: 400 });
  const cambios: Record<string, unknown> = { revision: body.revision, revisado_por: "operador", revisado_at: new Date().toISOString() };
  if (typeof body?.correccion === "string" && body.correccion.trim()) cambios.respuesta_correcta = body.correccion.trim().slice(0, 1200);
  const { error } = await createAdminClient().from("training_cases").update(cambios).eq("id", String(body?.id ?? ""));
  if (error) return NextResponse.json({ error: "No se pudo guardar la revisión." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
