import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { deshacerCambioBot, deshacerCambioMenu } from "@/lib/asistente/acciones";

export const dynamic = "force-dynamic";

/** Deshacer un cambio confirmado: el bot vuelve a sus instrucciones anteriores, o el menú a como estaba. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return NextResponse.json({ error: "Propuesta no válida." }, { status: 400 });
  const ok = (await deshacerCambioBot(params.id)) || (await deshacerCambioMenu(params.id));
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "No se puede deshacer: ya se cambió de nuevo después, o el cambio no existe." }, { status: 409 });
}
