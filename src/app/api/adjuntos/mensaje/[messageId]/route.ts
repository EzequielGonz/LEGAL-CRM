import { attachmentIdForMessage, openAttachment } from "@/lib/adjuntos/guardar";
import { NextResponse } from "next/server";
import { isUuid, notSavedResponse } from "@/lib/adjuntos/respuesta";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Abre el original de un mensaje de la conversación (?n= para el segundo,
 * tercero... cuando un mensaje trae varios). Si el mensaje es anterior a
 * este guardado, lo registra en el momento.
 */
export async function GET(request: Request, { params }: { params: { messageId: string } }) {
  if (!isUuid(params.messageId)) return notSavedResponse(400, "Identificador inválido.");
  const n = Number(new URL(request.url).searchParams.get("n") ?? "0");
  const position = Number.isInteger(n) && n >= 0 && n < 20 ? n : 0;
  const id = await attachmentIdForMessage(params.messageId, position);
  if (!id) return notSavedResponse(404, "Este mensaje no tiene un archivo para abrir.");
  const result = await openAttachment(id);
  if (!result.ok) return notSavedResponse(result.httpStatus, result.message);
  return NextResponse.redirect(result.url, { status: 302, headers: { "Cache-Control": "no-store" } });
}
