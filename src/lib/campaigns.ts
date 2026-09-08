import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppTemplate } from "@/lib/whatsapp/client";
import { findOrCreateConversation } from "@/lib/contacts";

export interface LaunchResult {
  sent: number;
  failed: number;
  /** true si se frenó por alcanzar `daily_send_limit` de hoy, no porque no
   *  quedaran más destinatarios pendientes. */
  dailyLimitReached: boolean;
}

/**
 * Lanza (o continúa) una campaña: recorre los destinatarios pendientes y les
 * envía la plantilla aprobada de WhatsApp, respetando la velocidad de envío
 * (`send_delay_seconds`) y el límite diario (`daily_send_limit`) que se haya
 * configurado al crear la campaña.
 *
 * Nota de escalabilidad: para bases grandes esto debería moverse a un job en
 * background (cola / cron del propio servidor) en vez de correr dentro de
 * una request HTTP — acá se deja simple porque la infraestructura de colas
 * no está definida todavía. Ver docs/SETUP.md. Si se corta por el límite
 * diario, la campaña queda en `en_curso` y alcanza con volver a apretar
 * "Lanzar" al otro día (o programar un cron que llame a este mismo endpoint
 * una vez por día) para que retome donde quedó.
 */
export async function launchCampaign(campaignId: string): Promise<LaunchResult> {
  const supabase = createAdminClient();

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (campaignError || !campaign) throw new Error("Campaña no encontrada");

  await supabase
    .from("campaigns")
    .update({ status: "en_curso", started_at: campaign.started_at ?? new Date().toISOString() })
    .eq("id", campaignId);

  let sent = 0;
  let failed = 0;
  let dailyLimitReached = false;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  while (true) {
    if (campaign.daily_send_limit) {
      const { count: sentToday } = await supabase
        .from("campaign_contacts")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaignId)
        .in("status", ["enviado", "entregado", "leido", "respondio"])
        .gte("sent_at", startOfToday.toISOString());

      if ((sentToday ?? 0) >= campaign.daily_send_limit) {
        dailyLimitReached = true;
        break;
      }
    }

    // Si en el medio pausaron la campaña, cortamos.
    const { data: current } = await supabase
      .from("campaigns")
      .select("status")
      .eq("id", campaignId)
      .single();
    if (current?.status !== "en_curso") break;

    const { data: nextRow } = await supabase
      .from("campaign_contacts")
      .select("id, contact_id, contacts(full_name, phone)")
      .eq("campaign_id", campaignId)
      .eq("status", "pendiente")
      .limit(1)
      .maybeSingle();

    if (!nextRow) break; // no quedan pendientes

    const phone = (nextRow as any).contacts?.phone;
    const name = (nextRow as any).contacts?.full_name ?? "";

    if (!phone) {
      await supabase
        .from("campaign_contacts")
        .update({ status: "fallo", error: "Sin teléfono" })
        .eq("id", nextRow.id);
      failed++;
      continue;
    }

    try {
      await sendWhatsAppTemplate(campaign.area, phone, campaign.message_template_name, "es_AR", [
        name,
      ]);
      await supabase
        .from("campaign_contacts")
        .update({ status: "enviado", sent_at: new Date().toISOString() })
        .eq("id", nextRow.id);
      sent++;

      // Dejamos registro de la conversación y del mensaje saliente: si no,
      // cuando la persona responda por WhatsApp, el agente IA arranca sin
      // saber qué se le mandó ni de qué campaña vino.
      const conversation = await findOrCreateConversation({
        contactId: nextRow.contact_id,
        channelId: campaign.channel_id,
        area: campaign.area,
      });
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender_type: "agente_ia",
        direction: "saliente",
        body: `[Plantilla de campaña "${campaign.name}": ${campaign.message_template_name}] Primer contacto automático a ${name || "el prospecto"}.`,
        metadata: { campaign_id: campaign.id, template: campaign.message_template_name },
      });
      await supabase
        .from("conversations")
        .update({
          status: "esperando_respuesta_prospecto",
          last_message_at: new Date().toISOString(),
        })
        .eq("id", conversation.id);
      await supabase
        .from("contacts")
        .update({ status: "esperando_respuesta_prospecto" })
        .eq("id", nextRow.contact_id);
    } catch (err: any) {
      await supabase
        .from("campaign_contacts")
        .update({ status: "fallo", error: String(err.message ?? err) })
        .eq("id", nextRow.id);
      failed++;
    }

    // Pausa entre envíos configurable — cuida la calidad del número.
    await new Promise((r) => setTimeout(r, campaign.send_delay_seconds * 1000));
  }

  if (dailyLimitReached) {
    // La dejamos "pausada" (no en_curso) para que el panel refleje que no
    // hay nada corriendo ahora mismo — el admin la retoma con "Reanudar".
    await supabase.from("campaigns").update({ status: "pausada" }).eq("id", campaignId);
  } else {
    const { count: stillPending } = await supabase
      .from("campaign_contacts")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .eq("status", "pendiente");

    if (!stillPending) {
      await supabase
        .from("campaigns")
        .update({ status: "finalizada", finished_at: new Date().toISOString() })
        .eq("id", campaignId);
    }
  }

  return { sent, failed, dailyLimitReached };
}

export async function pauseCampaign(campaignId: string) {
  const supabase = createAdminClient();
  await supabase.from("campaigns").update({ status: "pausada" }).eq("id", campaignId);
}
