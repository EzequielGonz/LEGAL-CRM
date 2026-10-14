import { NextResponse } from "next/server";
import { openAttachment } from "@/lib/adjuntos/guardar";
import { isUuid, notSavedResponse } from "@/lib/adjuntos/respuesta";
import { requireSession } from "@/lib/acceso/autorizacion";

export const dynamic = "force-dynamic";
// Si el original todavía no se guardó, se descarga de Meta en este pedido.
export const maxDuration = 60;

/**
 * Abre un original guardado (requiere sesión: lo controla el middleware).
 * Redirige a un enlace firmado del almacenamiento privado que vence a los
 * pocos minutos. No envía nada a nadie.
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (!isUuid(params.id)) return notSavedResponse(400, "Identificador inválido.");
  const result = await openAttachment(params.id);
  if (!result.ok) return notSavedResponse(result.httpStatus, result.message);
  return NextResponse.redirect(result.url, { status: 302, headers: { "Cache-Control": "no-store" } });
}
