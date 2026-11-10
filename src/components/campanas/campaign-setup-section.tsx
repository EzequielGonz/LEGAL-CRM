import { createClient } from "@/lib/supabase/server";
import { credentialStatus } from "@/lib/profiles";
import { AREA_TO_RUBRO_ID, slugDeRubro } from "@/lib/rubros";
import { CampaignSetup } from "@/components/campanas/campaign-setup";
import { RolDeCampana } from "@/components/campanas/rol-de-campana";
import { consultarEstadosLineas } from "@/lib/whatsapp/estado-linea";
import { opcionesWasender } from "@/lib/wasender/campanas";

/** Carga la línea y los días de la campaña y las líneas disponibles del perfil. */
export async function CampaignSetupSection({ campaignId }: { campaignId: string }) {
  const supabase = createClient();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, area, status, line_id, run_days, archived_at, template_id, message_template_name, daily_send_limit, agent_role_id, proveedor, wasender_line_id, wasender_plantilla_id" as any)
    .eq("id", campaignId)
    .maybeSingle() as { data: any };
  if (!campaign) return null;
  const rubroId = AREA_TO_RUBRO_ID[campaign.area as string];
  const { data: lines } = await supabase
    .from("profile_lines")
    .select("id, label, credential_key, daily_limit, active, use_for_campaigns")
    .eq("rubro_id", rubroId)
    .eq("active", true)
    .eq("use_for_campaigns", true)
    .order("created_at");
  // 10/11: campaña por Wasender → su línea y su plantilla propias.
  const porWasender = campaign.proveedor === "wasender";
  const wa = porWasender && rubroId ? await opcionesWasender(rubroId).catch(() => ({ lineas: [], plantillas: [] })) : null;
  const estados = porWasender ? {} as Record<string, any> : await consultarEstadosLineas((lines ?? []).map((l: any) => l.credential_key));
  return (
    <div className="space-y-4">
    <CampaignSetup
      campaignId={campaign.id}
      lineId={campaign.line_id}
      runDays={campaign.run_days}
      archivedAt={campaign.archived_at}
      templateId={campaign.template_id ?? null}
      legacyTemplateName={campaign.template_id ? null : campaign.message_template_name ?? null}
      running={campaign.status === "en_curso"}
      dailyLimit={(campaign as any).daily_send_limit ?? null}
      wasender={wa ? { ...wa, lineaId: campaign.wasender_line_id ?? null, plantillaId: campaign.wasender_plantilla_id ?? null } : null}
      lines={(lines ?? []).map((l: any) => ({
        id: l.id,
        label: l.label,
        daily_limit: l.daily_limit,
        ok: credentialStatus(l.credential_key).ok && !!estados[l.credential_key]?.ok,
        motivo: !credentialStatus(l.credential_key).ok ? "faltan credenciales" : estados[l.credential_key]?.ok ? null : (estados[l.credential_key]?.etiqueta ?? "sin comprobar").toLowerCase(),
      }))}
    />
    {!campaign.archived_at && rubroId && (
      <RolDeCampana campaignId={campaign.id} perfil={slugDeRubro(rubroId)} rolActualId={(campaign as any).agent_role_id ?? null} />
    )}
    </div>
  );
}
