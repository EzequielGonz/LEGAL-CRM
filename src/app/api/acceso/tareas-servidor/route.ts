import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { confirmPin } from "@/lib/acceso/confirmar-pin";
import { getTareasServidor, setTareasServidor } from "@/lib/tareas-servidor";

export const dynamic = "force-dynamic";

/**
 * Ejecutor de tareas del servidor (Etapa 3). GET → estado.
 * POST { pin, citas?: boolean, contenido?: boolean } → cambia con PIN y queda
 * en access_events (ejecutor_tareas). Encenderlo no levanta la pausa general.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  return NextResponse.json(await getTareasServidor());
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const antes = await getTareasServidor();
  const despues = {
    citas: typeof body?.citas === "boolean" ? body.citas : antes.citas,
    contenido: typeof body?.contenido === "boolean" ? body.contenido : antes.contenido,
  };
  const pin = await confirmPin(request, body?.pin, "ejecutor_tareas", { antes: { citas: antes.citas, contenido: antes.contenido }, despues });
  if (!pin.ok) return NextResponse.json({ error: pin.error }, { status: pin.status });
  try {
    await setTareasServidor(despues);
  } catch {
    return NextResponse.json({ error: "No se pudo guardar." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, ...despues });
}
