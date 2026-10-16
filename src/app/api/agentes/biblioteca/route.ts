import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { confirmPin } from "@/lib/acceso/confirmar-pin";
import { createAdminClient } from "@/lib/supabase/admin";
import { esClaveAgente, validarCambioAgente } from "@/lib/agentes/biblioteca";

export const dynamic = "force-dynamic";

/**
 * Etapa 2 · Bloque 4 — Biblioteca de agentes (solo configuración).
 * GET → principal y derivados, con su historial reciente.
 * PATCH { clave, cambios, motivo?, pin } → nueva versión (pide el PIN).
 * Ningún cambio activa un agente ni toca al que responde hoy.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const supabase = createAdminClient();
  const [{ data: agentes, error }, { data: versiones }] = await Promise.all([
    supabase.from("agent_library").select("*").order("rol", { ascending: false }).order("clave"),
    supabase.from("agent_library_versions").select("clave, version, motivo, created_by, created_at").order("created_at", { ascending: false }).limit(50),
  ]);
  if (error) return NextResponse.json({ error: "No se pudo leer la biblioteca." }, { status: 500 });
  return NextResponse.json({ agentes: agentes ?? [], versiones: versiones ?? [] });
}

export async function PATCH(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  if (!esClaveAgente(body?.clave)) return NextResponse.json({ error: "Agente no válido." }, { status: 400 });
  const v = validarCambioAgente(body?.cambios ?? {});
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  const pin = await confirmPin(request, body?.pin, "biblioteca_agentes", { agente: body.clave });
  if (!pin.ok) return NextResponse.json({ error: pin.error }, { status: pin.status });

  const supabase = createAdminClient();
  const { data: actual } = await supabase.from("agent_library").select("*").eq("clave", body.clave).maybeSingle();
  if (!actual) return NextResponse.json({ error: "Agente no encontrado." }, { status: 404 });
  const nueva = (actual.version as number) + 1;
  // Comparación y reemplazo sobre la versión: dos ediciones simultáneas no se pisan.
  const { data: guardado, error } = await supabase
    .from("agent_library")
    .update({ ...v.cambio, version: nueva, updated_at: new Date().toISOString(), updated_by: "operador" })
    .eq("clave", body.clave)
    .eq("version", actual.version)
    .select("*")
    .maybeSingle();
  if (error) return NextResponse.json({ error: `No se pudo guardar: ${error.message}` }, { status: 500 });
  if (!guardado) return NextResponse.json({ error: "Otra persona cambió este agente recién. Recargá y volvé a intentar." }, { status: 409 });
  const { id: _id, ...snapshot } = guardado as any;
  await supabase.from("agent_library_versions").insert({
    clave: body.clave,
    version: nueva,
    snapshot,
    motivo: typeof body?.motivo === "string" ? body.motivo.trim().slice(0, 300) || null : null,
    created_by: "operador",
  });
  return NextResponse.json({ ok: true, agente: guardado });
}
