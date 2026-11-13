import { NextResponse } from "next/server";
import { sendOutboundMessage } from "@/lib/messaging";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/acceso/autorizacion";
import { enlaceFirmado, tipoAdjunto } from "@/lib/adjuntos/salientes";

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
    .select("*")
    .eq("conversation_id", params.id)
    .order("created_at", { ascending: true })
    .limit(500);
  if (after && !Number.isNaN(Date.parse(after))) query = query.gt("created_at", after);

  const [{ data, error }, { data: estados }, { data: audios }] = await Promise.all([
    query,
    supabase
      .from("messages")
      .select("id, delivery_status, delivery_status_at, delivery_error")
      .eq("conversation_id", params.id)
      .eq("direction", "saliente")
      .not("delivery_status", "is", null)
      .order("created_at", { ascending: false })
      .limit(200),
    // 13/11: audios que se pasaron a texto (el texto puede llegar después que el mensaje).
    (supabase.from("messages") as any)
      .select("id, audio_texto, audio_texto_estado, audio_texto_detalle")
      .eq("conversation_id", params.id)
      .eq("message_type", "audio")
      .not("audio_texto_estado", "is", null)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
      return NextResponse.json({ error: String(err?.message ?? err) }, { status: 400 });
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
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
