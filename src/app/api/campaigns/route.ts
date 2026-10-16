import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { attachRecipients, baseContacts, contactPriorities, planRecipients, planSummary } from "@/lib/campaign-recipients";
import { AREA_TO_RUBRO_ID } from "@/lib/rubros";
import { requireSession } from "@/lib/acceso/autorizacion";

/**
 * Crea una campaña (siempre en borrador). Si viene `base_id` (toda una
 * base) o `contact_ids` (una selección), además los agrega como
 * destinatarios pendientes con el criterio único de
 * src/lib/campaign-recipients.ts. Nada se envía hasta lanzarla a mano.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json();
  const contact_ids: string[] | undefined = body?.contact_ids;
  const base_id: string | undefined = typeof body?.base_id === "string" ? body.base_id : undefined;
  const include_previously_contacted = body?.include_previously_contacted;
  const {
    name,
    channel_id,
    message_template_name,
    min_send_delay_seconds,
    max_send_delay_seconds,
    daily_send_limit,
    batch_size,
    batch_pause_seconds,
    line_id,
    run_days,
    template_id,
  } = body;

  // La plantilla se elige del catálogo (pregunta 22) y puede quedar para
  // después: sin plantilla aprobada la campaña queda en borrador y no se lanza.
  if (!name || !channel_id) {
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

  // Línea asignada (opcional al crear: sin línea la campaña queda en borrador
  // y no se puede lanzar hasta asignarla). Tiene que ser del mismo perfil.
  let lineId: string | null = null;
  if (line_id) {
    const { data: line } = await supabase.from("profile_lines").select("id, rubro_id, area").eq("id", line_id).maybeSingle();
    if (!line || line.rubro_id !== AREA_TO_RUBRO_ID[channel.area as string]) {
      return NextResponse.json({ error: "La línea elegida no pertenece a este perfil." }, { status: 400 });
    }
    lineId = line.id;
  }
  // Días de ejecución: los domingos no se envía (pregunta 39), así que no se guardan.
  const runDays = Array.isArray(run_days)
    ? Array.from(new Set(run_days.map(Number).filter((d: number) => Number.isInteger(d) && d >= 1 && d <= 6))).sort()
    : null;

  // Plantilla del catálogo asignada a esa línea para campañas. Un nombre
  // escrito a mano se guarda solo como referencia: no cuenta como aprobada.
  let templateId: string | null = null;
  let templateName: string | null =
    typeof message_template_name === "string" && message_template_name.trim() ? message_template_name.trim() : null;
  if (template_id) {
    if (!lineId) {
      return NextResponse.json({ error: "Para elegir la plantilla, primero asigná la línea que envía." }, { status: 400 });
    }
    const { data: assignment } = await supabase
      .from("template_assignments")
      .select("id, template:whatsapp_templates(id, name)")
      .eq("line_id", lineId)
      .eq("purpose", "campana")
      .eq("template_id", template_id)
      .eq("active", true)
      .maybeSingle();
    const tpl = (assignment as any)?.template;
    if (!tpl) {
      return NextResponse.json({ error: "Esa plantilla no está asignada a la línea para campañas." }, { status: 400 });
    }
    templateId = tpl.id;
    templateName = tpl.name;
  }

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      name,
      area: channel.area,
      channel_id,
      message_template_name: templateName,
      template_id: templateId,
      status: "borrador",
      line_id: lineId,
      run_days: runDays && runDays.length > 0 && runDays.length < 6 ? runDays : null,
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

  // Destinatarios: de una base completa (base_id) o de una selección
  // (contact_ids). Un solo criterio para los dos casos (ver
  // src/lib/campaign-recipients.ts): los detenidos nunca entran y los ya
  // contactados quedan afuera salvo decisión explícita. La campaña queda en
  // borrador: crearla no envía nada. La prioridad de envío sale de la lesión
  // ("diagnostico"/"tipo_de_consulta"): fractura, muerte o amputación van
  // primero — ver computeCampaignPriority.
  let destinatarios: ReturnType<typeof planSummary> | null = null;
  try {
    if (base_id || (Array.isArray(contact_ids) && contact_ids.length > 0)) {
      let ids: string[] = [];
      let priority = new Map<string, number>();
      let filasSinContacto = 0;
      if (base_id) {
        const { data: base } = await supabase.from("imported_bases").select("id, area").eq("id", base_id).maybeSingle();
        if (!base || base.area !== channel.area) {
          return NextResponse.json(
            { campaign, warning: "Campaña creada sin destinatarios: la base no es de este perfil o no existe." },
            { status: 207 }
          );
        }
        const bc = await baseContacts(base_id);
        ids = bc.ids;
        priority = bc.priority;
        filasSinContacto = bc.filasSinContacto;
      } else {
        ids = contact_ids as string[];
        priority = await contactPriorities(ids);
      }
      const plan = await planRecipients(ids, {
        campaignId: campaign.id,
        includePreviouslyContacted: include_previously_contacted === true,
        priority,
        filasSinContacto,
      });
      await attachRecipients(campaign.id, plan);
      destinatarios = planSummary(plan);
    }
  } catch (err: any) {
    return NextResponse.json(
      { campaign, warning: `Campaña creada, pero falló agregar contactos: ${String(err?.message ?? err)}` },
      { status: 207 }
    );
  }

  return NextResponse.json({
    campaign,
    destinatarios,
    excluidos_por_detencion: destinatarios?.detenidos ?? 0,
  });
}
