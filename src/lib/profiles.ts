import { createAdminClient } from "@/lib/supabase/admin";
import { AREA_TO_RUBRO_ID } from "@/lib/rubros";
import type { Area } from "@/lib/supabase/database.types";
import { campaignTemplateCheck, type ResolvedCampaignTemplate } from "@/lib/plantillas";

/**
 * Perfiles y líneas (bloque 1.4). Los nombres (perfil o marca, nombre de
 * presentación del agente) y las líneas se cargan a mano en cada perfil:
 * nada de eso viene del código. Si falta algo necesario para contactar,
 * la acción que lo necesita no se ejecuta y el panel muestra qué falta.
 *
 * Las credenciales de WhatsApp siguen en la configuración privada del
 * servidor; una línea guarda solo el prefijo de sus variables.
 */
export interface ProfileRow {
  id: string;
  slug: string;
  name: string;
  emoji: string | null;
  description: string | null;
  brand_name: string | null;
  agent_presentation_name: string | null;
  whatsapp_phone: string | null;
}

export interface ProfileLine {
  id: string;
  rubro_id: string;
  area: Area;
  label: string;
  phone_display: string | null;
  credential_key: string;
  answers_with_agent: boolean;
  use_for_campaigns: boolean;
  daily_limit: number | null;
  active: boolean;
}

/** Áreas internas de cada perfil (Civil y Penal son áreas internas de Jurídico). */
export function areasForProfile(rubroId: string): Area[] {
  return (Object.entries(AREA_TO_RUBRO_ID) as [Area, string][])
    .filter(([, id]) => id === rubroId)
    .map(([area]) => area);
}

export function profileIdForArea(area: Area): string | null {
  return AREA_TO_RUBRO_ID[area] ?? null;
}

/** ¿Están cargadas las variables privadas de esta línea? (solo sí/no, nunca el valor) */
export function credentialStatus(key: string): { phoneNumberId: boolean; accessToken: boolean; ok: boolean } {
  const phoneNumberId = !!process.env[`${key}_PHONE_NUMBER_ID`];
  const accessToken = !!process.env[`${key}_ACCESS_TOKEN`];
  return { phoneNumberId, accessToken, ok: phoneNumberId && accessToken };
}

/** Conexiones de WhatsApp existentes en la configuración privada (por nombre de variable). */
export function detectedCredentialKeys(): string[] {
  return Object.keys(process.env)
    .map((k) => /^(WHATSAPP_[A-Z0-9_]+)_PHONE_NUMBER_ID$/.exec(k)?.[1])
    .filter((k): k is string => !!k)
    .sort();
}

export function lineCredentials(key: string): { phoneNumberId: string; accessToken: string } | null {
  const phoneNumberId = process.env[`${key}_PHONE_NUMBER_ID`];
  const accessToken = process.env[`${key}_ACCESS_TOKEN`];
  return phoneNumberId && accessToken ? { phoneNumberId, accessToken } : null;
}

export async function getProfile(rubroId: string): Promise<ProfileRow | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("rubros")
    .select("id, slug, name, emoji, description, brand_name, agent_presentation_name, whatsapp_phone")
    .eq("id", rubroId)
    .maybeSingle();
  return (data as ProfileRow) ?? null;
}

export async function getProfileLines(rubroId: string, onlyActive = true): Promise<ProfileLine[]> {
  const supabase = createAdminClient();
  let q = supabase.from("profile_lines").select("*").eq("rubro_id", rubroId).order("created_at");
  if (onlyActive) q = q.eq("active", true);
  const { data } = await q;
  return (data ?? []) as ProfileLine[];
}

export async function getLine(lineId: string): Promise<ProfileLine | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("profile_lines").select("*").eq("id", lineId).maybeSingle();
  return (data as ProfileLine) ?? null;
}

/** Línea registrada cuyo phone_number_id (en la configuración privada) coincide. */
export async function findLineByPhoneNumberId(phoneNumberId: string): Promise<ProfileLine | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("profile_lines").select("*").eq("active", true);
  for (const line of (data ?? []) as ProfileLine[]) {
    if (process.env[`${line.credential_key}_PHONE_NUMBER_ID`] === phoneNumberId) return line;
  }
  return null;
}

export interface Readiness {
  ready: boolean;
  missing: string[];
}

/**
 * Qué falta para que el agente del perfil pueda presentarse y responder.
 * (Faltar esto nunca impide guardar mensajes ni registrar una captación.)
 */
export async function agentReadiness(area: Area): Promise<Readiness> {
  const rubroId = profileIdForArea(area);
  const profile = rubroId ? await getProfile(rubroId) : null;
  const missing: string[] = [];
  if (!profile) missing.push("Perfil del área");
  else {
    if (!profile.brand_name?.trim()) missing.push("Nombre del perfil o marca");
    if (!profile.agent_presentation_name?.trim()) missing.push("Nombre de presentación del agente");
  }
  return { ready: missing.length === 0, missing };
}

/**
 * Qué falta para que una campaña pueda enviar: nombres del perfil, línea
 * asignada, activa, habilitada para campañas y con sus credenciales
 * cargadas, y una plantilla del catálogo aprobada según Meta, asignada a esa
 * línea para campañas y con cada variable resuelta (pregunta 22). Un nombre
 * de plantilla escrito a mano no alcanza.
 */
export async function campaignReadiness(campaign: {
  area: Area;
  line_id: string | null;
  message_template_name: string | null;
  template_id?: string | null;
}): Promise<Readiness & { line: ProfileLine | null; template: ResolvedCampaignTemplate | null }> {
  const missing: string[] = [];
  const rubroId = profileIdForArea(campaign.area);
  const profile = rubroId ? await getProfile(rubroId) : null;
  const usesNames = campaign.area !== "marketing"; // la plantilla de Marketing no lleva variables
  if (!profile) missing.push("Perfil del área");
  else if (usesNames) {
    if (!profile.brand_name?.trim()) missing.push("Nombre del perfil o marca (perfil)");
    if (!profile.agent_presentation_name?.trim()) missing.push("Nombre de presentación del agente (perfil)");
  }

  let line: ProfileLine | null = null;
  if (!campaign.line_id) missing.push("Línea de WhatsApp asignada a la campaña");
  else {
    line = await getLine(campaign.line_id);
    if (!line) missing.push("La línea asignada no existe");
    else {
      if (!line.active) missing.push(`La línea «${line.label}» está desactivada`);
      if (!line.use_for_campaigns) missing.push(`La línea «${line.label}» no está habilitada para campañas`);
      if (rubroId && line.rubro_id !== rubroId) missing.push(`La línea «${line.label}» es de otro perfil`);
      const cred = credentialStatus(line.credential_key);
      if (!cred.ok) missing.push(`Credenciales de la línea «${line.label}» (${line.credential_key}_*) en la configuración privada`);
    }
  }
  const tpl = await campaignTemplateCheck(campaign, line);
  missing.push(...tpl.missing);
  return { ready: missing.length === 0, missing, line, template: missing.length === 0 ? tpl.resolved : null };
}
