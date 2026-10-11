import { NextResponse } from "next/server";
import { setDeviceStatus } from "@/lib/push";

export const dynamic = "force-dynamic";

/** Desactivar, reactivar o retirar un dispositivo desde el panel (nada se borra). */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  const accion = body?.accion;
  const status = accion === "desactivar" ? "desactivado" : accion === "retirar" ? "retirado" : accion === "activar" ? "activo" : null;
  if (!status) return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  try {
    await setDeviceStatus(params.id, status);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
