/**
 * Consulta al bot antes de un contacto de seguimiento (13/11). Arma el mismo
 * contexto que usa el agente en vivo (guion, rol, criterio del rubro y la
 * conversación con el texto real de las plantillas) y le pregunta si
 * corresponde insistir. Las reglas y el formato están en ./criterio (puras).
 *
 * Devuelve null si no se pudo decidir (agente apagado, sin clave, respuesta
 * ilegible, error del proveedor): en ese caso quien llama sigue con la regla
 * de siempre, que ya limita plazos y cantidad de contactos. Solo lee.
 */
import { GoogleGenAI, type Content } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/admin";
import { agentReadiness, getProfile, profileIdForArea } from "@/lib/profiles";
import { identificadorModelo } from "@/lib/agentes/modelo";
import { validarTextoSalida } from "@/lib/agentes/contrato";
import { instruccionesDeRol } from "@/lib/agentes/roles";
import { modoDelContacto } from "@/lib/agentes/entrante";
import { historialConPlantillas } from "@/lib/agentes/historial-servidor";
import { GUIA_CAPTACION_Y_CIERRE } from "@/lib/agentes/guia-cierre";
import { buildSystemPrompt, criterioDelRubro } from "@/lib/ai-agent/prompt";
import type { Area } from "@/lib/supabase/database.types";
import { instruccionSeguimiento, leerCriterio, type CriterioSeguimiento } from "./criterio";

type Db = ReturnType<typeof createAdminClient>;

let _cliente: GoogleGenAI | null = null;
function gemini() {
  if (!_cliente) _cliente = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return _cliente;
}

function historial(filas: { direction: string; body: string | null }[]): Content[] {
  const h: Content[] = [];
  for (const f of filas) {
    if (!f.body) continue;
    const role: "user" | "model" = f.direction === "entrante" ? "user" : "model";
    const ultimo = h[h.length - 1];
    const parte = ultimo?.parts?.length === 1 ? ultimo.parts[0] : undefined;
    if (ultimo && ultimo.role === role && parte && typeof parte.text === "string") parte.text += `\n${f.body}`;
    else h.push({ role, parts: [{ text: f.body }] });
  }
  return h;
}

export async function consultarCriterio(
  d: { conversationId: string; area: Area; contactId: string; paso: 2 | 3; textoLibre: boolean; ahora: Date },
  supabase: Db = createAdminClient()
): Promise<CriterioSeguimiento | null> {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const [{ data: agente }, listo, { data: contacto }, { data: msgs }, { data: ultimaCampana }] = await Promise.all([
      supabase.from("ai_agents").select("*").eq("area", d.area).maybeSingle(),
      agentReadiness(d.area),
      supabase.from("contacts").select("*").eq("id", d.contactId).maybeSingle(),
      supabase
        .from("messages")
        .select("id, direction, sender_type, origin, body, metadata, created_at")
        .eq("conversation_id", d.conversationId)
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("campaign_contacts")
        .select("campaign_id, campaigns(name, agent_role_id)")
        .eq("contact_id", d.contactId)
        .order("sent_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (!agente || !(agente as any).active || !listo.ready) return null;
    const lista = (msgs ?? []) as any[];
    if (!lista.length) return null;
    const c = (contacto ?? {}) as any;
    const profile = await getProfile(profileIdForArea(d.area)!);
    const identidad = { presentationName: profile?.agent_presentation_name?.trim() ?? "", brandName: profile?.brand_name?.trim() ?? "" };
    const campNombre = (ultimaCampana as any)?.campaigns?.name ?? null;
    const modo = modoDelContacto({ importedBaseId: c.imported_base_id ?? null, campaignName: campNombre, campaignId: (ultimaCampana as any)?.campaign_id ?? null });
    let system = buildSystemPrompt(
      agente as any,
      { area: d.area, fullName: c.full_name ?? null, dniCuil: c.dni_cuil ?? null, qualificationData: c.qualification_data ?? {}, campaignName: null, isFirstReplyToCampaign: false, modo },
      identidad
    );
    const crit = criterioDelRubro(d.area, c.rubro_id ?? null, modo);
    if (crit) system = `${system}\n\n${crit}`;
    const rol = await instruccionesDeRol(c, { rolId: (ultimaCampana as any)?.campaigns?.agent_role_id ?? null, campana: campNombre });
    if (rol) system = `${system}\n\n${rol}`;
    system = `${system}\n\n${GUIA_CAPTACION_Y_CIERRE}`;

    const { filas } = await historialConPlantillas([...lista].reverse());
    const contents = historial(filas);
    const horas = (d.ahora.getTime() - new Date(lista[0].created_at).getTime()) / 3_600_000;
    contents.push({ role: "user", parts: [{ text: instruccionSeguimiento(d.paso, horas, d.textoLibre) }] });
    const resp = await gemini().models.generateContent({
      model: identificadorModelo(),
      contents,
      config: { systemInstruction: system, responseMimeType: "application/json" },
    });
    const crudo = (resp.candidates?.[0]?.content?.parts ?? []).map((p: any) => (typeof p.text === "string" ? p.text : "")).join("");
    const criterio = leerCriterio(crudo, d.textoLibre);
    if (!criterio) return null;
    // Un texto que no pasa el validador de salida no se usa: sale la plantilla.
    if (criterio.texto && !validarTextoSalida(criterio.texto).ok) criterio.texto = "";
    return criterio;
  } catch (err: any) {
    console.error(`[seguimiento] criterio ${d.conversationId}:`, err?.message ?? err);
    return null;
  }
}
