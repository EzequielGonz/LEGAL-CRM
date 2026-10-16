import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/acceso/autorizacion";

export const dynamic = "force-dynamic";

/**
 * Decisión de una persona sobre un destinatario "a revisar":
 *  - reintentar: vuelve a la cola. Si no se sabe si Meta aceptó el envío
 *    anterior, exige confirmar_incierto (podría llegarle dos veces).
 *  - descartar: queda como fallido, con la nota.
 * Nada se envía desde acá.
 */
export async function POST(request: Request, { params }: { params: { id: string; ccId: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const accion = body?.accion === "reintentar" || body?.accion === "descartar" ? body.accion : null;
  if (!accion) return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("campaign_contacts")
    .select("id, campaign_id")
    .eq("id", params.ccId)
    .maybeSingle();
  if (!row || row.campaign_id !== params.id) return NextResponse.json({ error: "Destinatario no encontrado" }, { status: 404 });
  const { data, error } = await supabase.rpc("campaign_review_action", {
    p_campaign_contact: params.ccId,
    p_action: accion,
    p_confirm_uncertain: body?.confirmar_incierto === true,
    p_note: typeof body?.nota === "string" ? body.nota.slice(0, 300) : null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (data === "requiere_confirmacion") {
    return NextResponse.json(
      { error: "No se sabe si Meta aceptó el envío anterior: para volver a la cola hay que confirmarlo (podría llegarle dos veces).", code: data },
      { status: 409 }
    );
  }
  if (data !== "ok") return NextResponse.json({ error: `No se pudo: ${data}`, code: data }, { status: 409 });
  return NextResponse.json({ ok: true });
}
