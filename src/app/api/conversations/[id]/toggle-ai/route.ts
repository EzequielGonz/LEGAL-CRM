import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/acceso/autorizacion";
import { esUuid } from "@/lib/rutas/comprobar";

/**
 * Prende o apaga la IA en una conversación. Apagarla es tomar el chat: se
 * anula cualquier acuse final pendiente de la IA.
 */
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (!esUuid(params.id)) return NextResponse.json({ error: "Chat no válido." }, { status: 400 });
  const { ai_enabled } = await request.json().catch(() => ({}) as any);
  if (typeof ai_enabled !== "boolean") return NextResponse.json({ error: "Falta indicar si la IA queda encendida o apagada." }, { status: 400 });
  const supabase = createAdminClient();
  const enabled = Boolean(ai_enabled);

  const { data, error } = await supabase
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
    .eq("id", params.id)
    .select("id");

  if (error) return NextResponse.json({ error: "No se pudo cambiar la IA de este chat." }, { status: 500 });
  if (!(data ?? []).length) return NextResponse.json({ error: "Ese chat no existe." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
