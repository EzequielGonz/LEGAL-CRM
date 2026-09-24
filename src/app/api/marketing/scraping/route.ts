import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchGooglePlaces } from "@/lib/marketing/google-places";
import { importScrapedPlaces } from "@/lib/marketing/import-scrape";
import { launchCampaign } from "@/lib/campaigns";

// Una búsqueda de hasta 60 negocios + hasta 2 pausas de 2s entre páginas de
// Google puede llevar unos segundos — le damos margen extra a la función.
export const maxDuration = 60;

/**
 * Dispara una búsqueda de negocios en Google Maps (rubro + zona), los
 * carga como leads nuevos de Marketing (sin repetir ninguno ya visto en
 * una corrida anterior) y, si se pidió, crea y lanza de una la campaña de
 * WhatsApp con el primer mensaje a los leads nuevos.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  const {
    rubro,
    zona,
    cantidad,
    auto_send,
    message_template_name,
    min_send_delay_seconds,
    max_send_delay_seconds,
    batch_size,
    batch_pause_seconds,
    daily_send_limit,
  } = body as {
    rubro: string;
    zona: string;
    cantidad: number;
    auto_send?: boolean;
    message_template_name?: string;
    min_send_delay_seconds?: number;
    max_send_delay_seconds?: number;
    batch_size?: number;
    batch_pause_seconds?: number;
    daily_send_limit?: number | null;
  };

  if (!rubro || !zona) {
    return NextResponse.json({ error: "Faltan el rubro o la zona a buscar" }, { status: 400 });
  }
  if (auto_send && !message_template_name) {
    return NextResponse.json(
      { error: "Para enviar automáticamente hace falta el nombre de la plantilla de WhatsApp aprobada" },
      { status: 400 }
    );
  }

  let places;
  try {
    places = await searchGooglePlaces({
      query: `${rubro} en ${zona}`,
      maxResults: typeof cantidad === "number" && cantidad > 0 ? cantidad : 20,
    });
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message ?? err) }, { status: 502 });
  }

  if (places.length === 0) {
    return NextResponse.json(
      { error: "Google Maps no encontró negocios para esa búsqueda." },
      { status: 404 }
    );
  }

  let summary;
  try {
    summary = await importScrapedPlaces({ rubroBuscado: rubro, zona, places });
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message ?? err) }, { status: 500 });
  }

  let campaign_id: string | null = null;

  if (auto_send && summary.new_contact_ids.length > 0) {
    const supabase = createAdminClient();
    const { data: channel } = await supabase
      .from("channels")
      .select("id")
      .eq("area", "marketing")
      .eq("type", "whatsapp")
      .maybeSingle();

    if (!channel) {
      return NextResponse.json({
        ...summary,
        campaign_id: null,
        warning:
          "Se cargaron los negocios pero no se pudo enviar el primer mensaje: no hay un canal de WhatsApp de Marketing configurado.",
      });
    }

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert({
        name: `Captación Google Maps — ${rubro} en ${zona}`,
        area: "marketing",
        channel_id: channel.id,
        message_template_name,
        status: "borrador",
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

    if (campaignError || !campaign) {
      return NextResponse.json({
        ...summary,
        campaign_id: null,
        warning: `Se cargaron los negocios pero no se pudo crear la campaña de envío: ${campaignError?.message}`,
      });
    }

    const { error: attachError } = await supabase.from("campaign_contacts").insert(
      summary.new_contact_ids.map((contact_id) => ({
        campaign_id: campaign.id,
        contact_id,
        status: "pendiente",
      }))
    );

    if (attachError) {
      return NextResponse.json({
        ...summary,
        campaign_id: campaign.id,
        warning: `Campaña creada, pero falló agregar los contactos: ${attachError.message}`,
      });
    }

    try {
      await launchCampaign(campaign.id);
      campaign_id = campaign.id;
    } catch (err: any) {
      return NextResponse.json({
        ...summary,
        campaign_id: campaign.id,
        warning: `Los negocios se cargaron y la campaña quedó creada (en borrador), pero no se pudo lanzar automáticamente: ${String(
          err.message ?? err
        )}. Podés lanzarla a mano desde Campañas.`,
      });
    }
  }

  return NextResponse.json({ ...summary, campaign_id });
}
