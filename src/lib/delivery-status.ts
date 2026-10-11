import { createAdminClient } from "@/lib/supabase/admin";
import { DELIVERY_RANK, mapDeliveryStatus } from "@/lib/webhooks/whatsapp-parse";

/**
 * Guarda un estado de entrega de WhatsApp (sent/delivered/read/failed):
 * - siempre como evento en `message_status_events` (historial completo);
 * - en el mensaje (`messages.delivery_status`), sin retroceder (un
 *   "entregado" que llega tarde no pisa un "leído");
 * - en el destinatario de campaña (`campaign_contacts`), por el id que
 *   devolvió Meta al enviar la plantilla, sin pisar "respondió".
 */
export async function applyDeliveryStatus(status: any): Promise<void> {
  const mapped = mapDeliveryStatus(status?.status);
  const wamid: string | undefined = status?.id;
  if (!mapped || !wamid) return;

  const at =
    status?.timestamp && !Number.isNaN(Number(status.timestamp))
      ? new Date(Number(status.timestamp) * 1000).toISOString()
      : new Date().toISOString();
  const errors = Array.isArray(status?.errors) && status.errors.length ? status.errors : null;

  const supabase = createAdminClient();

  await supabase.from("message_status_events").insert({
    external_message_id: wamid,
    status: mapped,
    status_at: at,
    recipient: status?.recipient_id ?? null,
    errors,
    raw: status,
  });

  const { data: msg } = await supabase
    .from("messages")
    .select("id, delivery_status")
    .eq("external_message_id", wamid)
    .is("duplicate_of", null)
    .maybeSingle();

  if (msg && DELIVERY_RANK[mapped] > (DELIVERY_RANK[msg.delivery_status ?? ""] ?? 0)) {
    await supabase
      .from("messages")
      .update({ delivery_status: mapped, delivery_status_at: at, delivery_error: mapped === "fallido" ? errors : null })
      .eq("id", msg.id);
  }

  const campaignStatus = mapped === "entregado" ? "entregado" : mapped === "leido" ? "leido" : mapped === "fallido" ? "fallo" : null;
  if (campaignStatus) {
    const from =
      campaignStatus === "entregado" ? ["enviado"] : campaignStatus === "leido" ? ["enviado", "entregado"] : ["enviado", "entregado"];
    const update: Record<string, unknown> = { status: campaignStatus };
    if (campaignStatus === "fallo") {
      update.error = errors ? JSON.stringify(errors).slice(0, 1000) : "Meta informó que no se pudo entregar.";
    }
    await supabase.from("campaign_contacts").update(update).eq("message_id", wamid).in("status", from);
  }
}
