import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { correrEvaluacion } from "@/lib/agentes/servicio";
import { UMBRALES_PROPUESTOS } from "@/lib/agentes/evaluacion";
import { createAdminClient } from "@/lib/supabase/admin";
import { responderError } from "../_comun";

export const dynamic = "force-dynamic";

/**
 * «Ver resultados»: corre los casos de control sobre un agente/variante y
 * guarda el resumen por rol. GET → últimos resultados y umbrales fijos.
 * POST { clave, variante?, proveedor?, soloReservados? }.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const s = createAdminClient();
  const [{ data: resultados }, { data: comparaciones }] = await Promise.all([
    s.from("eval_results").select("id, agente_clave, version, variante, caso_id, modelo_identificador, comercial, naturalidad, fallos_criticos, created_at").order("created_at", { ascending: false }).limit(100),
    s.from("model_comparisons").select("*").order("created_at", { ascending: false }).limit(10),
  ]);
  return NextResponse.json({ umbrales: UMBRALES_PROPUESTOS, resultados: resultados ?? [], comparaciones: comparaciones ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  try {
    const r = await correrEvaluacion({ clave: String(body?.clave ?? "principal"), variante: body?.variante, proveedor: body?.proveedor === "simulado" ? "simulado" : undefined, soloReservados: body?.soloReservados === true });
    return NextResponse.json({ ok: true, ...r });
  } catch (err) {
    return responderError(err);
  }
}
