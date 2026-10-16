import { NextResponse } from "next/server";
import { FollowupError, generateRepescaBase } from "@/lib/seguimiento/panel";
import { requireSession } from "@/lib/acceso/autorizacion";

export const dynamic = "force-dynamic";

/**
 * Etapa 2 · Bloque 2.3 — Genera la base para campaña manual con quienes
 * llegaron al tercer contacto sin avanzar. No envía nada.
 * POST { rubro_id }
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const rubroId = typeof body?.rubro_id === "string" ? body.rubro_id : "";
  if (!/^[0-9a-f-]{36}$/i.test(rubroId)) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  try {
    const bases = await generateRepescaBase(rubroId);
    return NextResponse.json({ ok: true, bases });
  } catch (err) {
    const e = err as FollowupError;
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
