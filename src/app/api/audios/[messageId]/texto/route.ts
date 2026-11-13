import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { isUuid } from "@/lib/adjuntos/respuesta";
import { ESTADO_AUDIO_TEXTO } from "@/lib/audios/reglas";
import { transcribirMensaje } from "@/lib/audios/transcribir";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * «Pasar a texto»: transcribe un audio ya recibido y guarda el texto en el
 * mensaje. No responde, no cambia el estado de la persona y no envía nada.
 */
export async function POST(request: Request, { params }: { params: { messageId: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (!isUuid(params.messageId)) return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
  try {
    const r = await transcribirMensaje(params.messageId);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.httpStatus });
    const t = r.transcripcion;
    return NextResponse.json({
      estado: t.estado,
      texto: t.estado === "hecha" ? t.texto : null,
      detalle: t.detalle ?? (t.estado === "hecha" && t.claridad === "a_medias" ? "Algunas partes no se entendieron bien." : null),
      rotulo: ESTADO_AUDIO_TEXTO[t.estado],
    });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
