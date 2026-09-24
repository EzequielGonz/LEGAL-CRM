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
    min_send_delay_seconds,
    max_send_delay_seconds,
    daily_send_limit,
    batch_size,
    batch_pause_seconds,
  } = await request.json();

  if (!name || !channel_id || !message_template_name) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // El área de la campaña tiene que ser la del canal que se eligió, no un
  // valor fijo. Antes acá se guardaba siempre "civil" sin importar qué
  // canal se hubiera seleccionado en el formulario — así que cualquier
  // campaña creada desde el panel de otro rubro (por ejemplo Agencia 0KM)
  // quedaba mal etiquetada como Jurídico/Civil y terminaba mezclada en las
  // estadísticas, el envío y el filtrado por área de esa otra línea.
  const { data: channel, error: channelError } = await supabase
    .from("channels")
    .select("area")
    .eq("id", channel_id)
    .single();

  if (channelError || !channel) {
    return NextResponse.json({ error: "El canal seleccionado no existe." }, { status: 400 });
  }

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      name,
      area: channel.area,
      channel_id,
      message_template_name,
      status: "borrador",
      // Ritmo "seguro" para no generar bloqueos de WhatsApp: por defecto un
      // tiempo al azar entre 50s y 200s antes de cada mensaje nuevo (no un
      // número fijo, para que parezca una persona mandando a mano), en
      // lotes de 10, con 5min de pausa entre lote y lote. Configurable,
      // pero estos son los valores que pidió el estudio.
      min_send_delay_seconds:
        typeof min_send_delay_seconds === "number" && min_send_delay_seconds > 0
          ? min_send_delay_seconds
          : 50,
      max_send_delay_seconds:
        typeof max_send_delay_seconds === "number" && max_send_delay_seconds > 0
          ? max_send_delay_seconds
          : 200,
      daily_send_limit:
        typeof daily_send_limit === "number" && daily_send_limit > 0 ? daily_send_limit : null,
      batch_size: typeof batch_size === "number" && batch_size > 0 ? batch_size : 10,
      batch_pause_seconds:
        typeof batch_pause_seconds === "number" && batch_pause_seconds > 0
          ? batch_pause_seconds
          : 300,
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
