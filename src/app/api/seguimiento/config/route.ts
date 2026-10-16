import { NextResponse } from "next/server";
import { confirmPin } from "@/lib/acceso/confirmar-pin";
import { FollowupError, setFollowupConfig } from "@/lib/seguimiento/panel";
import { requireSession } from "@/lib/acceso/autorizacion";

export const dynamic = "force-dynamic";

/**
 * Etapa 2 · Bloque 2.3 — Seguimiento automático de un perfil.
 * POST { rubro_id, enabled?: boolean, target_hours?: number (48–72), pin? }
 * Activarlo o apagarlo pide el PIN (puede hacer salir mensajes). Cambiar solo
 * el valor objetivo no lo pide.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const rubroId = typeof body?.rubro_id === "string" ? body.rubro_id : "";
  if (!/^[0-9a-f-]{36}$/i.test(rubroId)) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const enabled = typeof body?.enabled === "boolean" ? body.enabled : undefined;
  if (enabled !== undefined) {
    const pin = await confirmPin(request, body?.pin, "seguimiento_automatico", { perfil: rubroId, activo: enabled });
    if (!pin.ok) return NextResponse.json({ error: pin.error }, { status: pin.status });
  }
  try {
    const after = await setFollowupConfig(rubroId, { enabled, targetHours: body?.target_hours });
    return NextResponse.json({ ok: true, config: after });
  } catch (err) {
    const e = err as FollowupError;
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
