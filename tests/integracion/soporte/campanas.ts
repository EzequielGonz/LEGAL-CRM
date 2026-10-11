/**
 * Campaña de prueba lista para enviar (perfil con nombres, línea con
 * credenciales de prueba, plantilla aprobada del catálogo asignada a la
 * línea). Todo inventado; Meta está simulado por la red de entorno.ts.
 */
import { analyzeTemplate } from "@/lib/plantillas/catalogo";
import { canalId, crearContacto, db } from "./entorno";

export const AGENCIA = "22222222-2222-2222-2222-222222222222";
export const CLAVE = "PRUEBA_CAMPANAS";
export const PHONE_ID = "100000000000010";
export const WABA = "200000000000010";
/** Martes 6/10/2026, 12:00 en Argentina: dentro del horario general (lunes a sábado, 8 a 21). */
export const EN_HORARIO = new Date("2026-10-06T15:00:00Z");

process.env[`${CLAVE}_PHONE_NUMBER_ID`] = PHONE_ID;
process.env[`${CLAVE}_ACCESS_TOKEN`] = "token-campanas-de-prueba";
process.env[`${CLAVE}_WABA_ID`] = WABA;

let cache: { lineId: string; templateId: string } | null = null;

export async function lineaYPlantilla(): Promise<{ lineId: string; templateId: string }> {
  if (cache) return cache;
  const s = db();
  const ok = (r: { error: any }, what: string) => {
    if (r.error) throw new Error(`${what}: ${r.error.message}`);
  };
  ok(await s.from("rubros").update({ brand_name: "Marca De Prueba", agent_presentation_name: "Asesor De Prueba" }).eq("id", AGENCIA), "perfil");

  let { data: line } = await s.from("profile_lines").select("id").eq("credential_key", CLAVE).eq("active", true).maybeSingle();
  if (!line) {
    const r = await s
      .from("profile_lines")
      .insert({ rubro_id: AGENCIA, area: "agencia_0km", label: "Línea de prueba", credential_key: CLAVE, answers_with_agent: false, use_for_campaigns: true })
      .select("id")
      .single();
    ok(r, "línea");
    line = r.data;
  }

  const meta = {
    id: "meta-prueba-primer-contacto",
    name: "prueba_primer_contacto",
    language: "es_AR",
    status: "APPROVED",
    category: "MARKETING",
    components: [{ type: "BODY", text: "Hola {{1}}, soy {{2}} de {{3}}.", example: { body_text: [["Juan", "Ana", "Marca"]] } }],
  };
  const a = analyzeTemplate(meta as any);
  let { data: tpl } = await s.from("whatsapp_templates").select("id").eq("waba_id", WABA).eq("name", meta.name).maybeSingle();
  if (!tpl) {
    const r = await s
      .from("whatsapp_templates")
      .insert({
        waba_id: WABA,
        meta_template_id: meta.id,
        name: meta.name,
        language: meta.language,
        category: meta.category,
        status: meta.status,
        parameter_format: a.format,
        components: meta.components,
        body_text: a.bodyText,
        variables: a,
        campaign_compatible: a.campaignCompatible,
        incompatibilities: a.incompatibilities,
      })
      .select("id")
      .single();
    ok(r, "plantilla");
    tpl = r.data;
  }

  const { data: asg } = await s
    .from("template_assignments")
    .select("id")
    .eq("line_id", line!.id)
    .eq("purpose", "campana")
    .eq("template_id", tpl!.id)
    .eq("active", true)
    .maybeSingle();
  if (!asg) {
    ok(
      await s.from("template_assignments").insert({
        rubro_id: AGENCIA,
        line_id: line!.id,
        purpose: "campana",
        template_id: tpl!.id,
        variable_sources: ["contacto.nombre", "perfil.presentacion", "perfil.marca"],
      }),
      "asignación"
    );
  }
  cache = { lineId: line!.id as string, templateId: tpl!.id as string };
  return cache;
}

export interface Destinatario {
  contactId: string;
  phone: string;
  ccId: string;
}

export async function crearCampana(nombre: string, cantidad: number): Promise<{ campaignId: string; destinatarios: Destinatario[] }> {
  const { lineId, templateId } = await lineaYPlantilla();
  const s = db();
  const camp = await s
    .from("campaigns")
    .insert({
      name: `PRUEBA ${nombre}`,
      area: "agencia_0km",
      channel_id: await canalId("agencia_0km"),
      line_id: lineId,
      template_id: templateId,
      message_template_name: "prueba_primer_contacto",
      status: "en_curso",
      started_at: new Date().toISOString(),
      min_send_delay_seconds: 0,
      max_send_delay_seconds: 0,
      batch_size: 1000,
      batch_pause_seconds: 0,
    })
    .select("id")
    .single();
  if (camp.error) throw new Error(`campaña: ${camp.error.message}`);
  const campaignId = camp.data!.id as string;
  const destinatarios: Destinatario[] = [];
  const base = Date.now();
  for (let i = 0; i < cantidad; i++) {
    const c = await crearContacto({ area: "agencia_0km", rubroId: AGENCIA, nombre: `Persona ${i + 1}` });
    const cc = await s
      .from("campaign_contacts")
      .insert({ campaign_id: campaignId, contact_id: c.id, status: "pendiente", priority: 1, queued_at: new Date(base + i).toISOString() })
      .select("id")
      .single();
    if (cc.error) throw new Error(`destinatario: ${cc.error.message}`);
    destinatarios.push({ contactId: c.id, phone: c.phone, ccId: cc.data!.id as string });
  }
  return { campaignId, destinatarios };
}

export async function estadoDestinatarios(campaignId: string) {
  const { data, error } = await db()
    .from("campaign_contacts")
    .select("id, contact_id, status, attempts, send_uncertain, review_reason, error, message_id, send_started_at, claim_token")
    .eq("campaign_id", campaignId);
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((r: any) => [r.id as string, r]));
}
