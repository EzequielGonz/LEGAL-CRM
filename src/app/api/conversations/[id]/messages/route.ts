import { NextResponse } from "next/server";
import { sendOutboundMessage } from "@/lib/messaging";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/acceso/autorizacion";

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
      .select("id, delivery_status, delivery_status_at")
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
  const { body } = await request.json().catch(() => ({ body: null }));

  if (!body || typeof body !== "string") {
    return NextResponse.json({ error: "Falta 'body'" }, { status: 400 });
  }

  try {
    await sendOutboundMessage({
      conversationId: params.id,
      senderType: "admin",
      body,
    });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
