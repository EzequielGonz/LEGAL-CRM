/**
 * Campañas armadas por el asistente (19/10). Misma regla que la pantalla de
 * Campañas: la campaña siempre nace en borrador, la línea tiene que ser del
 * perfil, la plantilla sale del catálogo asignada a esa línea, los detenidos
 * nunca entran y los ya contactados quedan afuera. Crear no envía nada.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { attachRecipients, baseContacts, planRecipients, planSummary } from "@/lib/campaign-recipients";
import { AREA_TO_RUBRO_ID } from "@/lib/rubros";

export interface PedidoCampana {
  nombre: string;
  channel_id: string;
  area: string;
  base_id: string;
  line_id: string;
  template_id: string;
  run_days: number[] | null;
  daily_send_limit: number | null;
}

export function diasDeEjecucion(v: unknown): number[] | null {
  if (!Array.isArray(v)) return null;
  const dias = Array.from(new Set(v.map(Number).filter((d) => Number.isInteger(d) && d >= 1 && d <= 6))).sort();
  return dias.length > 0 && dias.length < 6 ? dias : null;
}

/** Valida el pedido contra la base real y devuelve la vista previa de destinatarios. Solo lectura. */
export async function validarPedidoCampana(p: PedidoCampana) {
  const s = createAdminClient();
  const rubroId = AREA_TO_RUBRO_ID[p.area];
  const { data: canal } = await s.from("channels").select("id, area").eq("id", p.channel_id).maybeSingle();
  if (!canal || canal.area !== p.area) throw new Error("El canal no es de este perfil.");
  const { data: base } = await s.from("imported_bases").select("id, area, name, archived_at").eq("id", p.base_id).maybeSingle();
  if (!base || base.area !== p.area || base.archived_at) throw new Error("La base no existe, está archivada o es de otro perfil.");
  const { data: linea } = await s.from("profile_lines").select("id, rubro_id, label, active, use_for_campaigns").eq("id", p.line_id).maybeSingle();
  if (!linea || linea.rubro_id !== rubroId || !linea.active || !linea.use_for_campaigns) throw new Error("La línea no es de este perfil o no está habilitada para campañas.");
  const { data: asig } = await s
    .from("template_assignments")
    .select("template:whatsapp_templates(id, name)")
    .eq("line_id", p.line_id)
    .eq("purpose", "campana")
    .eq("template_id", p.template_id)
    .eq("active", true)
    .maybeSingle();
  const plantilla = (asig as any)?.template;
  if (!plantilla) throw new Error("Esa plantilla no está asignada a la línea para campañas.");
  const bc = await baseContacts(p.base_id);
  const plan = await planRecipients(bc.ids, { campaignId: null, includePreviouslyContacted: false, priority: bc.priority, filasSinContacto: bc.filasSinContacto });
  return { base, linea, plantilla: { id: plantilla.id as string, name: plantilla.name as string }, destinatarios: planSummary(plan), plan };
}

/** Crea la campaña en borrador con sus destinatarios pendientes. No envía nada. */
export async function crearCampanaBorrador(p: PedidoCampana) {
  const v = await validarPedidoCampana(p);
  const s = createAdminClient();
  const { data: campana, error } = await s
    .from("campaigns")
    .insert({
      name: p.nombre.slice(0, 120),
      area: p.area,
      channel_id: p.channel_id,
      message_template_name: v.plantilla.name,
      template_id: v.plantilla.id,
      status: "borrador",
      line_id: p.line_id,
      run_days: p.run_days,
      min_send_delay_seconds: 50,
      max_send_delay_seconds: 200,
      daily_send_limit: p.daily_send_limit,
      batch_size: 10,
      batch_pause_seconds: 300,
    })
    .select("id, name")
    .single();
  if (error || !campana) throw new Error(`No se pudo crear la campaña: ${error?.message ?? "sin respuesta"}`);
  const plan = await planRecipients(v.plan.elegibles, { campaignId: campana.id, includePreviouslyContacted: false, priority: v.plan.priority });
  const agregados = await attachRecipients(campana.id, plan);
  return { campana_id: campana.id as string, nombre: campana.name as string, destinatarios_agregados: agregados, estado: "borrador" };
}
