import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { ajustarPlan } from "@/lib/asistente/general-servidor";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * Asistente general (15/11): cambios al boceto de un plan de campañas antes
 * de confirmar (nombre, línea del mismo perfil, días, límite por día,
 * entrenamiento y si se lanza). Solo mientras es propuesta; no ejecuta nada.
 */
export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Propuesta no válida." }, { status: 400 });
  const body = await request.json().catch(() => null);
  const r = await ajustarPlan(params.id, body?.ajustes);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ titulo: r.titulo, resumen: r.resumen, detalle: r.detalle });
}
