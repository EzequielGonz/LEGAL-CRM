import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOutboundMessage } from "@/lib/messaging";

/** El admin responde manualmente desde el Inbox: esto apaga el agente IA
 *  para esa conversación (para que no se pisen las respuestas). */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { body } = await request.json();

  if (!body || typeof body !== "string") {
    return NextResponse.json({ error: "Falta 'body'" }, { status: 400 });
  }

  const supabase = createAdminClient();

  await sendOutboundMessage({
    conversationId: params.id,
    senderType: "admin",
    body,
  });

  await supabase
    .from("conversations")
    .update({ ai_enabled: false, status: "requiere_atencion_humana" })
    .eq("id", params.id);

  return NextResponse.json({ ok: true });
}
