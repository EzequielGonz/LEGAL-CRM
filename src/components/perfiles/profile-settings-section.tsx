import { createClient } from "@/lib/supabase/server";
import {
  agentReadiness,
  areasForProfile,
  credentialStatus,
  detectedCredentialKeys,
  type ProfileLine,
} from "@/lib/profiles";
import { ProfileSettings } from "@/components/perfiles/profile-settings";
import { profileHasCampaignTemplate } from "@/lib/plantillas";
import type { Area } from "@/lib/supabase/database.types";

/**
 * Sección "Perfil" de Configuración (bloque 1.4): nombre del perfil o
 * marca, nombre de presentación del agente, líneas y qué falta para
 * contactar. Se usa en la Configuración de cada perfil.
 */
export async function ProfileSettingsSection({ slug }: { slug: string }) {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("rubros")
    .select("id, slug, name, emoji, brand_name, agent_presentation_name, whatsapp_phone, settings_updated_at")
    .eq("slug", slug)
    .maybeSingle();
  if (!profile) return null;

  const { data: linesData } = await supabase
    .from("profile_lines")
    .select("*")
    .eq("rubro_id", profile.id)
    .order("created_at");
  const lines = ((linesData ?? []) as ProfileLine[]).map((l) => ({ ...l, credentials: credentialStatus(l.credential_key) }));

  const areas = areasForProfile(profile.id);
  const registered = new Set(lines.filter((l) => l.active).map((l) => l.credential_key));
  const detected = detectedCredentialKeys()
    .filter((k) => !registered.has(k))
    .map((k) => ({ key: k, credentials: credentialStatus(k) }));

  // Qué falta para contactar desde este perfil.
  const agent = await agentReadiness(areas[0] as Area);
  const missing = [...agent.missing];
  const usable = lines.filter((l) => l.active && l.use_for_campaigns && l.credentials.ok);
  if (usable.length === 0) missing.push("Al menos una línea activa, habilitada para campañas y con credenciales cargadas");
  if (!(await profileHasCampaignTemplate(profile.id))) {
    missing.push("Al menos una plantilla aprobada según Meta, asignada a una línea para campañas (Plantillas de WhatsApp)");
  }

  return (
    <ProfileSettings
      profile={profile as any}
      areas={areas}
      lines={lines as any}
      detected={detected}
      missing={missing}
    />
  );
}
