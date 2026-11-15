import { NextResponse } from "next/server";
import { sendOutboundMessage } from "@/lib/messaging";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/acceso/autorizacion";
import { enlaceFirmado, tipoAdjunto } from "@/lib/adjuntos/salientes";
import { COLUMNAS_HILO } from "@/lib/chat-mensajes";
import { mensajeVisible, respuestaErrorInterno } from "@/lib/error-publico";

/**
 * 15/11: en cada consulta periódica (con ?after) los audios pasados a texto se
 * piden solo si se escribieron desde un poco antes del último mensaje que ya
 * tiene el hilo (margen de 2 minutos por diferencias de reloj); lo anterior ya
 * llegó en consultas previas. Los estados de entrega NO se filtran así: su
 * fecha es la que informa Meta, no la de escritura, y un aviso que llega tarde
 * quedaría afuera.
 */
const MARGEN_CAMBIOS_MS = 2 * 60_000;

export const dynamic = "force-dynamic";

/**
 * Mensajes de una conversación (lectura del lado del servidor). Con
 * ?after=<fecha ISO> devuelve solo los posteriores: el Inbox lo consulta
 * cada pocos segundos para mostrar lo que va entrando. Además devuelve el
 * estado de entrega actual de los mensajes salientes recientes, para que
 * el Inbox actualice "Enviado → Entregado → Leído" en los que ya muestra.
 */
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(request.url);
  const after = searchParams.get("after");
  const supabase = createAdminClient();

  let query = supabase
    .from("messages")
    .select(COLUMNAS_HILO)
    .eq("conversation_id", params.id)
    .order("created_at", { ascending: true })
    .limit(500);
  const conAfter = !!after && !Number.isNaN(Date.parse(after));
  if (conAfter) query = query.gt("created_at", after!);
  const cambiosDesde = conAfter ? new Date(Date.parse(after!) - MARGEN_CAMBIOS_MS).toISOString() : null;

  const qEstados: any = supabase
    .from("messages")
    .select("id, delivery_status, delivery_status_at, delivery_error")
    .eq("conversation_id", params.id)
    .eq("direction", "saliente")
    .not("delivery_status", "is", null);
  // 13/11: audios que se pasaron a texto (el texto puede llegar después que el mensaje).
  let qAudios: any = (supabase.from("messages") as any)
    .select("id, audio_texto, audio_texto_estado, audio_texto_detalle")
    .eq("conversation_id", params.id)
    .eq("message_type", "audio")
    .not("audio_texto_estado", "is", null);
  // audio_texto_at se escribe junto con el estado (guardarTranscripcion); sin fecha, se sigue mandando.
  if (cambiosDesde) qAudios = qAudios.or(`audio_texto_at.gte.${cambiosDesde},audio_texto_at.is.null`);

  const [{ data, error }, { data: estados }, { data: audios }] = await Promise.all([
    query,
    qEstados.order("created_at", { ascending: false }).limit(200),
    qAudios.order("created_at", { ascending: false }).limit(50),
  ]);
  if (error) return respuestaErrorInterno(error, "conversations/[id]/messages");
  return NextResponse.json({ messages: data ?? [], estados: estados ?? [], audios: audios ?? [] });
}

/**
 * El admin responde manualmente desde el Inbox. El chat pasa a atención
 * humana ANTES de enviar (dentro de sendOutboundMessage), así una
 * respuesta de la IA que se estuviera generando ya no puede salir encima.
 */
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const { body, adjunto } = await request.json().catch(() => ({ body: null, adjunto: null }));
  const texto = typeof body === "string" ? body : "";

  // Foto, video o PDF (22/10; PDF 01/11): { path, nombre } subido antes con /subida.
  let media: { kind: "image" | "video" | "document"; link: string; path: string; filename?: string } | null = null;
  if (adjunto && typeof adjunto?.path === "string") {
    const kind = tipoAdjunto(String(adjunto.path));
    if (!kind || !adjunto.path.startsWith(`${params.id}/`)) return NextResponse.json({ error: "Adjunto inválido." }, { status: 400 });
    try {
      media = { kind, link: await enlaceFirmado(adjunto.path), path: adjunto.path, filename: typeof adjunto.nombre === "string" ? adjunto.nombre.slice(0, 200) : undefined };
    } catch (err: any) {
      return NextResponse.json({ error: mensajeVisible(err, "conversations/[id]/messages") }, { status: 400 });
    }
  }

  if (!texto.trim() && !media) {
    return NextResponse.json({ error: "Falta el mensaje o el adjunto." }, { status: 400 });
  }

  try {
    await sendOutboundMessage({
      conversationId: params.id,
      senderType: "admin",
      body: texto,
      media,
    });
  } catch (err: any) {
    return NextResponse.json({ error: mensajeVisible(err, "conversations/[id]/messages") }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
