import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { correrSimulacion } from "@/lib/agentes/servicio";
import { CASOS } from "@/lib/agentes/casos";
import { createAdminClient } from "@/lib/supabase/admin";
import { responderError } from "../_comun";

export const dynamic = "force-dynamic";

/**
 * «Probar conversación»: corre una simulación con datos sintéticos y
 * herramientas simuladas. No escribe mensajes ni toca prospectos.
 * GET → casos de control y últimas corridas. POST { clave, casoId? | mensajes[], area?, modo?, proveedor?, fallar? }.
 * Sin clave de proveedor configurada se usa el generador simulado y se informa.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const { data: corridas } = await createAdminClient().from("simulation_runs").select("id, agente_clave, version, caso_id, variante, modelo_proveedor, modelo_identificador, resultado, created_at").order("created_at", { ascending: false }).limit(30);
  return NextResponse.json({ casos: CASOS.map((c) => ({ id: c.id, familia: c.familia, rubro: c.rubro, area: c.area, modo: c.modo, titulo: c.titulo, regla: c.regla })), corridas: corridas ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const mensajes = Array.isArray(body?.mensajes) ? body.mensajes.filter((m: unknown) => typeof m === "string" && m.trim()).slice(0, 12) : undefined;
  if (!body?.casoId && !mensajes?.length) return NextResponse.json({ error: "Elegí un caso de control o escribí al menos un mensaje." }, { status: 400 });
  try {
    const r = await correrSimulacion({
      clave: String(body?.clave ?? "principal"),
      casoId: typeof body?.casoId === "string" ? body.casoId : undefined,
      mensajes,
      area: body?.area,
      modo: body?.modo,
      proveedor: body?.proveedor === "simulado" ? "simulado" : undefined,
      fallar: Array.isArray(body?.fallar) ? body.fallar : undefined,
    });
    return NextResponse.json({ ok: true, ...r });
  } catch (err) {
    return responderError(err);
  }
}
