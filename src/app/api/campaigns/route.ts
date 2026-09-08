import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Crea una campaña. Si viene `contact_ids`, además los agrega de una como
 * destinatarios pendientes — es el camino directo "seleccioné estos
 * contactos de una base → creo la campaña ya con ellos adentro", sin pasar
 * por la carga de CSV suelta de `/api/campaigns/import`.
 */
export async function POST(request: Request) {
  const {
    name,
    channel_id,
    message_template_name,
    contact_ids,
    send_delay_seconds,
    daily_send_limit,
  } = await request.json();

  if (!name || !channel_id || !message_template_name) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      name,
      area: "civil",
      channel_id,
      message_template_name,
      status: "borrador",
      send_delay_seconds:
        typeof send_delay_seconds === "number" && send_delay_seconds > 0 ? send_delay_seconds : 2,
      daily_send_limit:
        typeof daily_send_limit === "number" && daily_send_limit > 0 ? daily_send_limit : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (Array.isArray(contact_ids) && contact_ids.length > 0) {
    const { error: attachError } = await supabase.from("campaign_contacts").insert(
      contact_ids.map((contact_id: string) => ({
        campaign_id: campaign.id,
        contact_id,
        status: "pendiente",
      }))
    );
    if (attachError) {
      return NextResponse.json(
        { campaign, warning: `Campaña creada, pero falló agregar contactos: ${attachError.message}` },
        { status: 207 }
      );
    }
  }

  return NextResponse.json({ campaign });
}
