import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { confirmPin } from "@/lib/acceso/confirmar-pin";
import { asignarAgente } from "@/lib/agentes/servicio";
import { createAdminClient } from "@/lib/supabase/admin";
import { responderError } from "../_comun";

export const dynamic = "force-dynamic";

/**
 * Asignaciones: qué derivado/versión responde en cada perfil y área.
 * GET → lista. POST { rubroId, area, clave, version, estado, motivo?, pin }.
 * Activar exige versión publicada y PIN (queda en access_events como asignacion_agente).
 * Mientras la pausa general siga, una asignación activa tampoco envía nada.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const { data } = await createAdminClient().from("agent_assignments").select("*").order("area");
  return NextResponse.json({ asignaciones: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const estado = body?.estado;
  if (!["apagada", "activa", "pausada"].includes(estado)) return NextResponse.json({ error: "Estado no válido." }, { status: 400 });
  const pin = await confirmPin(request, body?.pin, "asignacion_agente", { area: body?.area, clave: body?.clave, version: body?.version, estado });
  if (!pin.ok) return NextResponse.json({ error: pin.error }, { status: pin.status });
  try {
    const asignacion = await asignarAgente({ rubroId: String(body?.rubroId ?? ""), area: body?.area, clave: String(body?.clave ?? ""), version: Number(body?.version ?? 0), estado, motivo: typeof body?.motivo === "string" ? body.motivo.slice(0, 300) : undefined });
    return NextResponse.json({ ok: true, asignacion });
  } catch (err) {
    return responderError(err);
  }
}
