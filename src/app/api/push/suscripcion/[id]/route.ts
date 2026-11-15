import { NextResponse } from "next/server";
import { setDeviceStatus } from "@/lib/push";
import { requireSession } from "@/lib/acceso/autorizacion";
import { respuestaErrorInterno } from "@/lib/error-publico";

export const dynamic = "force-dynamic";

/** Desactivar, reactivar o retirar un dispositivo desde el panel (nada se borra). */
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const accion = body?.accion;
  const status = accion === "desactivar" ? "desactivado" : accion === "retirar" ? "retirado" : accion === "activar" ? "activo" : null;
  if (!status) return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  try {
    await setDeviceStatus(params.id, status);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return respuestaErrorInterno(err, "push/suscripcion/[id]", 500);
  }
}
