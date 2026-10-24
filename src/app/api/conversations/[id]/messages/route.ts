import { NextResponse } from "next/server";
import { sendOutboundMessage } from "@/lib/messaging";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/acceso/autorizacion";
import { enlaceFirmado, tipoMedio } from "@/lib/adjuntos/salientes";

export const dynamic = "force-dynamic";

/**
 * Mensajes de una conversación (lectura del lado del servidor). Con
 * ?after=<fecha ISO> devuelve solo los posteriores: el Inbox lo consulta
 * cada pocos segundos para mostrar lo que va entrando. Además devuelve el
 * estado de entrega actual de los mensajes salientes recientes, para que
 * el Inbox actualice "Enviado → Entregado → Leído" en los que ya muestra.
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
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

  const [{ data, error }, { data: estados }] = await Promise.all([
    query,
    supabase
      .from("messages")
      .select("id, delivery_status, delivery_status_at, delivery_error")
      .eq("conversation_id", params.id)
      .eq("direction", "saliente")
      .not("delivery_status", "is", null)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data ?? [], estados: estados ?? [] });
}

/**
 * El admin responde manualmente desde el Inbox. El chat pasa a atención
 * humana ANTES de enviar (dentro de sendOutboundMessage), así una
 * respuesta de la IA que se estuviera generando ya no puede salir encima.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const { body, adjunto } = await request.json().catch(() => ({ body: null, adjunto: null }));
  const texto = typeof body === "string" ? body : "";

  // Foto o video (22/10): { path, nombre } subido antes con /subida.
  let media: { kind: "image" | "video"; link: string; path: string; filename?: string } | null = null;
  if (adjunto && typeof adjunto?.path === "string") {
    const kind = tipoMedio(String(adjunto.path));
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
