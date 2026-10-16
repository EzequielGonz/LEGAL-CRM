import { NextResponse } from "next/server";
import { FollowupError, reviewFollowupTask, type ReviewAction } from "@/lib/seguimiento/panel";
import { requireSession } from "@/lib/acceso/autorizacion";

export const dynamic = "force-dynamic";

/**
 * Etapa 2 · Bloque 2.3 — Revisión de una tarea de seguimiento.
 * PATCH { action: "descartar" | "reintentar" | "marcar_enviado", confirm_uncertain?: boolean, note?: string }
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return NextResponse.json({ error: "Tarea no encontrada." }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const action = body?.action as ReviewAction;
  if (!["descartar", "reintentar", "marcar_enviado"].includes(action)) {
    return NextResponse.json({ error: "Acción desconocida." }, { status: 400 });
  }
  try {
    const task = await reviewFollowupTask(params.id, action, {
      confirmUncertain: body?.confirm_uncertain === true,
      note: typeof body?.note === "string" ? body.note : null,
    });
    return NextResponse.json({ ok: true, task });
  } catch (err) {
    const e = err as FollowupError;
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
