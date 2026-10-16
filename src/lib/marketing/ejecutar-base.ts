/**
 * Marketing · «Ejecutar base» (16/10). Acción explícita de la responsable
 * (con PIN): crea la campaña con la línea, la plantilla de apertura, el
 * agente y los límites de Marketing, le suma la base y la lanza. Si falta
 * algo (o la pausa general está puesta), la campaña queda en borrador y se
 * informa exactamente qué falta. Nunca se ejecuta sola.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { attachRecipients, baseContacts, planRecipients, planSummary } from "@/lib/campaign-recipients";
import { CampaignNotReadyError, launchCampaign } from "@/lib/campaigns";
import { getAutomationPause } from "@/lib/automation-pause";
import { getProfile } from "@/lib/profiles";
import { RUBRO_IDS } from "@/lib/rubros";

export const PLANTILLA_APERTURA = "mkt_apertura_propuesta";

/** Ritmo seguro por defecto (igual que el resto de las campañas). */
export const LIMITES_MARKETING = { min_send_delay_seconds: 50, max_send_delay_seconds: 200, batch_size: 10, batch_pause_seconds: 300, daily_send_limit: 150 };

export interface RequisitosBase {
  faltan: string[];
  avisos: string[];
  channelId: string | null;
  lineId: string | null;
  templateId: string | null;
  templateName: string | null;
  pausa: boolean;
}

export async function requisitosEjecutarBase(): Promise<RequisitosBase> {
  const s = createAdminClient();
  const faltan: string[] = [];
  const avisos: string[] = [];
  const { data: canal } = await s.from("channels").select("id").eq("area", "marketing").eq("type", "whatsapp").limit(1).maybeSingle();
  if (!canal) faltan.push("Canal de WhatsApp de Marketing (Configuración → Canales).");
  const { data: lineas } = await s.from("profile_lines").select("id, label, active, use_for_campaigns").eq("rubro_id", RUBRO_IDS.marketing).eq("active", true).eq("use_for_campaigns", true);
  const linea = ((lineas ?? []) as any[])[0] ?? null;
  if (!linea) faltan.push("Línea de WhatsApp de Marketing activa y habilitada para campañas (Configuración → Líneas).");
  let templateId: string | null = null;
  let templateName: string | null = null;
  if (linea) {
    const { data: asig } = await s
      .from("template_assignments")
      .select("template:whatsapp_templates(id, name, status)")
      .eq("line_id", linea.id)
      .eq("purpose", "campana")
      .eq("active", true);
    const tpls = ((asig ?? []) as any[]).map((a) => a.template).filter(Boolean);
    const elegida = tpls.find((t) => t.name === PLANTILLA_APERTURA) ?? tpls[0] ?? null;
    if (!elegida) faltan.push(`Plantilla de campaña asignada a la línea «${linea.label}» (recomendada: ${PLANTILLA_APERTURA}, aprobada en Meta).`);
    else {
      templateId = elegida.id;
      templateName = elegida.name;
      if (elegida.status !== "APPROVED") faltan.push(`La plantilla ${elegida.name} no está aprobada en Meta (estado: ${elegida.status}).`);
      if (elegida.name !== PLANTILLA_APERTURA) avisos.push(`Se usa ${elegida.name}: la apertura nueva (${PLANTILLA_APERTURA}) todavía no está asignada a la línea.`);
    }
  }
  const { data: agente } = await s.from("ai_agents").select("active").eq("area", "marketing").maybeSingle();
  if (!(agente as any)?.active) faltan.push("Agente IA de Marketing encendido (Agentes IA → Marketing), para que responda a quien conteste.");
  const perfil = await getProfile(RUBRO_IDS.marketing);
  if (!perfil?.agent_presentation_name?.trim()) faltan.push("Nombre de presentación del asesor en el perfil de Marketing (va en la plantilla).");
  const pausa = await getAutomationPause();
  if (pausa.outboundPaused) faltan.push("Pausa general de envíos activa: levantala desde Configuración cuando decidan arrancar.");
  if (pausa.aiRepliesPaused) avisos.push("Las respuestas de la IA están en pausa: las respuestas a la apertura quedarían para atención manual.");
  return { faltan, avisos, channelId: (canal as any)?.id ?? null, lineId: linea?.id ?? null, templateId, templateName, pausa: pausa.outboundPaused };
}

export async function ejecutarBase(input: { baseId: string; extraccionId?: string | null; nombre: string }) {
  const s = createAdminClient();
  const { data: base } = await s.from("imported_bases").select("id, area, name").eq("id", input.baseId).maybeSingle();
  if (!base || (base as any).area !== "marketing") throw new Error("La base no existe o no es de Marketing.");
  const req = await requisitosEjecutarBase();
  if (!req.channelId) return { ok: false as const, campaignId: null, faltan: req.faltan, avisos: req.avisos };

  const { data: camp, error } = await s
    .from("campaigns")
    .insert({
      name: `Ejecutar · ${input.nombre}`.slice(0, 120),
      area: "marketing",
      channel_id: req.channelId,
      line_id: req.lineId,
      template_id: req.templateId,
      message_template_name: req.templateName,
      status: "borrador",
      marketing_extraccion_id: input.extraccionId ?? null,
      ...LIMITES_MARKETING,
    })
    .select("id")
    .single();
  if (error || !camp) throw new Error(`No se pudo crear la campaña: ${error?.message}`);
  const campaignId = (camp as any).id as string;
  const bc = await baseContacts(input.baseId);
  const plan = await planRecipients(bc.ids, { campaignId, includePreviouslyContacted: false, priority: bc.priority, filasSinContacto: bc.filasSinContacto });
  const agregados = await attachRecipients(campaignId, plan);
  const resumen = planSummary(plan);

  if (req.faltan.length) {
    return { ok: false as const, campaignId, agregados, resumen, faltan: req.faltan, avisos: req.avisos };
  }
  try {
    const r = await launchCampaign(campaignId);
    return { ok: true as const, campaignId, agregados, resumen, faltan: [], avisos: req.avisos, primerPaso: r };
  } catch (err: any) {
    const faltan = err instanceof CampaignNotReadyError ? err.missing : [String(err?.message ?? err)];
    return { ok: false as const, campaignId, agregados, resumen, faltan, avisos: req.avisos };
  }
}
