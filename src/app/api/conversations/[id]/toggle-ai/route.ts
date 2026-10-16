import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/acceso/autorizacion";

/**
 * Prende o apaga la IA en una conversación. Apagarla es tomar el chat: se
 * anula cualquier acuse final pendiente de la IA.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const { ai_enabled } = await request.json();
  const supabase = createAdminClient();
  const enabled = Boolean(ai_enabled);

  await supabase
    .from("conversations")
    .update(
      enabled
        ? { ai_enabled: true, status: "en_conversacion" }
        : {
            ai_enabled: false,
            status: "requiere_atencion_humana",
            ai_ack_token: null,
            ai_ack_expires_at: null,
            human_takeover_at: new Date().toISOString(),
          }
    )
    .eq("id", params.id);

  return NextResponse.json({ ok: true });
}
