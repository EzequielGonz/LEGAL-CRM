import { NextResponse } from "next/server";
import { MissingAccessError } from "@/lib/plantillas";
import { enviarPropuestasALinea } from "@/lib/plantillas/enviar";
import { requireSession } from "@/lib/acceso/autorizacion";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Envía a Meta, para su revisión, las plantillas propuestas del rubro de una
 * línea. No manda mensajes a nadie. Sin `confirmar: true` solo muestra qué se
 * enviaría. Requiere sesión; el token queda en el servidor.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const lineId = typeof body?.line_id === "string" ? body.line_id : "";
  if (!lineId) return NextResponse.json({ error: "Falta la línea" }, { status: 400 });
  try {
    const result = await enviarPropuestasALinea(lineId, body?.confirmar === true);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof MissingAccessError) {
      return NextResponse.json({ error: err.message, faltantes: err.missing }, { status: 409 });
    }
    const message = String((err as any)?.message ?? err);
    return NextResponse.json({ error: message }, { status: message === "Línea no encontrada" ? 404 : 500 });
  }
}
