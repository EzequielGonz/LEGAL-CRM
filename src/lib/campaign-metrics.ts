import { createAdminClient } from "@/lib/supabase/admin";
import { AREA_TO_RUBRO_ID } from "@/lib/rubros";

/**
 * Cifras de una campaña (doc. 1, 3.3): un solo cálculo en la base
 * (`campaign_metrics`) que leen PC y teléfono, sin el tope de 1.000 filas.
 * Unidad: destinatarios de la campaña, salvo "mensajes_enviados" y
 * "respuestas", que cuentan mensajes.
 */
export interface CampaignMetrics {
  prospectos: number;
  pendientes: number;
  /** reservados por una ejecución en curso (puede faltar en cifras calculadas antes de 0116) */
  en_envio?: number;
  /** no se sabe si Meta los aceptó, o Meta los rechazó por un motivo no clasificado */
  a_revisar?: number;
  enviados: number;
  entregados: number;
  leidos: number;
  fallidos: number;
  mensajes_enviados: number;
  respuestas: number;
  personas_responden: number;
  sin_respuesta: number;
  en_seguimiento: number;
  caidos: number;
  cierres: number;
  detenidos: number;
  actualizado: string | null;
  calculado_en: string;
}

export async function getCampaignMetrics(campaignId: string): Promise<CampaignMetrics | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("campaign_metrics", { p_campaign: campaignId });
  if (error) {
    console.error("[campaña] No se pudieron calcular las cifras:", error.message);
    return null;
  }
  return (data as CampaignMetrics | null) ?? null;
}

/** Información de una campaña para confirmar antes de actuar (perfil, canal, línea, estado). */
export interface CampaignInfo {
  id: string;
  name: string;
  status: string;
  area: string;
  archived: boolean;
  template: string | null;
  profile_name: string | null;
  channel_label: string | null;
  line_label: string | null;
  pause_reason: string | null;
}

export async function getCampaignInfo(campaignId: string): Promise<CampaignInfo | null> {
  const supabase = createAdminClient();
  const { data: c } = await supabase
    .from("campaigns")
    .select("id, name, status, area, archived_at, message_template_name, pause_reason, channel_id, line_id, channels(label)")
    .eq("id", campaignId)
    .maybeSingle();
  if (!c) return null;
  const [{ data: rubro }, { data: line }] = await Promise.all([
    supabase.from("rubros").select("name").eq("id", AREA_TO_RUBRO_ID[c.area as string]).maybeSingle(),
    c.line_id
      ? supabase.from("profile_lines").select("label, phone_display").eq("id", c.line_id).maybeSingle()
      : Promise.resolve({ data: null as any }),
  ]);
  return {
    id: c.id,
    name: c.name,
    status: c.status,
    area: c.area,
    archived: !!c.archived_at,
    template: c.message_template_name ?? null,
    profile_name: rubro?.name ?? null,
    channel_label: (c as any).channels?.label ?? null,
    line_label: line ? `${line.label}${line.phone_display ? ` (${line.phone_display})` : ""}` : null,
    pause_reason: c.pause_reason ?? null,
  };
}

export { CAMPAIGN_STATUS_LABEL } from "@/lib/campaign-status";
