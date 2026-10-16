import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processMetaPayload, processWhatsAppPayload } from "@/lib/webhooks/process";
import { requireSession } from "@/lib/acceso/autorizacion";

export const dynamic = "force-dynamic";

/**
 * Mensajes retenidos: una persona decide. "Reprocesar" lo pasa por el
 * circuito normal (se guarda el mensaje; la pausa general y las
 * detenciones siguen aplicando). "Descartar" lo deja marcado, sin borrarlo.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const accion = body?.accion;
  const nota = typeof body?.nota === "string" ? body.nota.trim() : null;
  if (accion !== "reprocesar" && accion !== "descartar") {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { data: item } = await supabase
    .from("webhook_quarantine")
    .select("id, source, payload, reviewed_at")
    .eq("id", params.id)
    .maybeSingle();
  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (item.reviewed_at) return NextResponse.json({ error: "Ya fue revisado" }, { status: 409 });

  let resumen: unknown = null;
  if (accion === "reprocesar") {
    try {
      resumen =
        item.source === "whatsapp" ? await processWhatsAppPayload(item.payload) : await processMetaPayload(item.payload);
    } catch (err: any) {
      return NextResponse.json({ error: `No se pudo reprocesar: ${String(err?.message ?? err)}` }, { status: 500 });
    }
  }

  const { error } = await supabase
    .from("webhook_quarantine")
    .update({
      reviewed_at: new Date().toISOString(),
      reviewed_action: accion === "reprocesar" ? "reprocesado" : "descartado",
      note: nota,
    })
    .eq("id", item.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, resumen });
}
