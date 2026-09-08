import { NextResponse } from "next/server";
import { runAgentTurn } from "@/lib/ai-agent/agent";

/**
 * Dispara manualmente un turno del agente IA para una conversación.
 * Los webhooks (WhatsApp/Meta) ya lo llaman automáticamente ante cada
 * mensaje entrante; este endpoint sirve para reintentar o para pruebas
 * desde el panel.
 */
export async function POST(request: Request) {
  const { conversation_id } = await request.json();

  if (!conversation_id) {
    return NextResponse.json({ error: "Falta 'conversation_id'" }, { status: 400 });
  }

  try {
    await runAgentTurn(conversation_id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Error corriendo el agente IA:", err);
    return NextResponse.json({ error: String(err.message ?? err) }, { status: 500 });
  }
}
