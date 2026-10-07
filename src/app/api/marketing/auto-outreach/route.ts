import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AUTO_CAMPAIGN_NAME } from "@/lib/marketing/outreach";

/**
 * Prende / apaga la prospección automática de Marketing: una campaña
 * permanente ("Prospección automática Marketing") a la que el cron suma
 * solo los negocios recién analizados con prioridad alta o media. Cada uno
 * recibe el primer mensaje (plantilla aprobada con el gancho del análisis),
 * respetando el ritmo, el horario y el límite diario de la campaña.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  const { action, message_template_name, daily_send_limit } = body as {
    action: "activar" | "pausar";
    message_template_name?: string;
    daily_send_limit?: number;
  };

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("campaigns")
    .select("id, message_template_name")
    .eq("area", "marketing")
    .eq("name", AUTO_CAMPAIGN_NAME)
    .maybeSingle();

  if (action === "pausar") {
    if (existing) await supabase.from("campaigns").update({ status: "pausada" }).eq("id", existing.id);
    return NextResponse.json({ ok: true, status: "pausada" });
  }

  if (action !== "activar") {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }

  const template = (message_template_name ?? existing?.message_template_name ?? "").trim();
  if (!template) {
    return NextResponse.json(
      { error: "Falta el nombre de la plantilla de WhatsApp aprobada para el primer mensaje." },
      { status: 400 }
    );
  }
  const limit =
    typeof daily_send_limit === "number" && daily_send_limit > 0 ? Math.floor(daily_send_limit) : 30;

  if (existing) {
    await supabase
      .from("campaigns")
      .update({
        status: "en_curso",
        message_template_name: template,
        daily_send_limit: limit,
        batch_paused_until: null,
        finished_at: null,
      })
      .eq("id", existing.id);
    return NextResponse.json({ ok: true, status: "en_curso" });
  }

  const { data: channel } = await supabase
    .from("channels")
    .select("id")
    .eq("area", "marketing")
    .eq("type", "whatsapp")
    .maybeSingle();
  if (!channel) {
    return NextResponse.json(
      { error: "No hay un canal de WhatsApp de Marketing configurado." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("campaigns").insert({
    name: AUTO_CAMPAIGN_NAME,
    area: "marketing",
    channel_id: channel.id,
    message_template_name: template,
    status: "en_curso",
    started_at: new Date().toISOString(),
    min_send_delay_seconds: 50,
    max_send_delay_seconds: 200,
    batch_size: 10,
    batch_pause_seconds: 300,
    daily_send_limit: limit,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, status: "en_curso" });
}
