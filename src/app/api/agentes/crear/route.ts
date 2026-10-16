import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { confirmPin } from "@/lib/acceso/confirmar-pin";
import { crearAgente } from "@/lib/agentes/servicio";
import { responderError } from "../_comun";

export const dynamic = "force-dynamic";

/** POST { clave, nombre, rubroId, desde?, objetivo?, pin } → crea un derivado (copia solo configuración). */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const pin = await confirmPin(request, body?.pin, "biblioteca_agentes", { accion: "crear", clave: body?.clave });
  if (!pin.ok) return NextResponse.json({ error: pin.error }, { status: pin.status });
  try {
    const agente = await crearAgente({ clave: String(body?.clave ?? ""), nombre: String(body?.nombre ?? ""), rubroId: String(body?.rubroId ?? ""), desde: typeof body?.desde === "string" ? body.desde : undefined, objetivo: typeof body?.objetivo === "string" ? body.objetivo : undefined });
    return NextResponse.json({ ok: true, agente });
  } catch (err) {
    return responderError(err);
  }
}
