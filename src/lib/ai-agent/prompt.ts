/**
 * Instrucciones del agente (24/10): las arman el agente en vivo (agent.ts) y
 * «Probar el bot real» (probar-real.ts) con las mismas funciones, así la
 * prueba nunca se desfasa de lo que responde en producción.
 */
import type { Area } from "@/lib/supabase/database.types";
import { AREA_TO_RUBRO_ID, RUBRO_IDS } from "@/lib/rubros";
import { CRITERIO_POR_RUBRO, type RubroSlug } from "@/lib/captacion/reglas";
import { reglaDeRechazo } from "@/lib/captacion/insistencia";
import { guionSegunModo, type ModoContacto } from "@/lib/agentes/entrante";

export type { ModoContacto } from "@/lib/agentes/entrante";

/** 24/10: datos deseables de Jurídico para quien escribe por su cuenta (cualquier tema legal). */
const DESEABLES_JURIDICO_ENTRANTE = ["tema_legal", "que_paso", "localidad", "urgencia"];

/** Criterio de captación y límites del rubro, desde la configuración (no del prompt editable). */
export function criterioDelRubro(area: Area, rubroId: string | null, modo: ModoContacto = "campana"): string {
  // Misma resolución que captacion/rubroSlugDe, sin importar la base (así se prueba sin dependencias).
  const porId = (id: string | null | undefined) => (Object.entries(RUBRO_IDS) as [RubroSlug, string][]).find(([, v]) => v === id)?.[0];
  const slug = porId(rubroId) ?? porId(AREA_TO_RUBRO_ID[area]);
  if (!slug) return "";
  const c = CRITERIO_POR_RUBRO[slug];
  if (!c) return "";
  const deseables = modo === "entrante" && slug === "juridico" ? DESEABLES_JURIDICO_ENTRANTE : c.deseables;
  return [
    "Captación (regla del sistema):",
    `- Hay captación solo con: ${c.aceptacion}. Cuando la persona lo acepte, usá la herramienta captar con la evidencia (lo que dijo).`,
    "- Agendar no es captar. Compartir datos no es derivar. Derivar lo hace una persona.",
    `- Datos deseables (si faltan no impiden captar): ${deseables.join(", ")}.`,
    c.zonaAplica ? "- Cuando la persona diga dónde está, registrala con registrar_ubicacion (AMBA o fuera de AMBA). No la llames si no mencionó una zona y nunca supongas AMBA." : "",
    `- Nunca prometas ni informes: ${c.limites.join(", ")}.`,
    ...reglaDeRechazo(slug, modo),
    "- Si pide una persona, pregunta algo fuera de tu alcance o comparte datos sensibles: usá escalar_a_humano con la categoría que corresponda.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildSystemPrompt(
  agent: {
    system_prompt: string;
    qualification_criteria: string[];
    required_fields: string[];
  },
  contactContext: {
    area: Area;
    fullName: string | null;
    dniCuil: string | null;
    qualificationData: Record<string, unknown>;
    campaignName: string | null;
    isFirstReplyToCampaign: boolean;
    /** 24/10: «entrante» si escribió por su cuenta (sin base ni campaña). Por defecto «campana». */
    modo?: ModoContacto;
  },
  identity: { presentationName: string; brandName: string }
) {
  const knownFacts: string[] = [];
  if (contactContext.fullName) knownFacts.push(`- Nombre: ${contactContext.fullName}`);
  if (contactContext.dniCuil) knownFacts.push(`- DNI/CUIL: ${contactContext.dniCuil}`);
  for (const [key, value] of Object.entries(contactContext.qualificationData)) {
    if (value) knownFacts.push(`- ${key.replaceAll("_", " ")}: ${value}`);
  }
  if (contactContext.campaignName) {
    knownFacts.push(`- Viene de la campaña: "${contactContext.campaignName}"`);
  }

  // 24/10: en campaña el guion del agente queda intacto (más «si trae otro tema, atendelo»);
  // si escribió por su cuenta, venta consultiva general del rubro.
  const { guion, criterios, datos } = guionSegunModo(contactContext.area, contactContext.modo ?? "campana", agent);

  return [
    // Identidad cargada a mano en el perfil (bloque 1.4): no sale del código.
    `Te presentás como ${identity.presentationName}, de ${identity.brandName}. No uses otro nombre ni otra marca, no inventes una persona real, matrícula ni disponibilidad humana, y si te preguntan si sos una automatización respondé con la verdad.`,
    "",
    guion,
    "",
    "Criterios de calificación comercial (evaluá contra esto con la herramienta evaluar_calificacion):",
    ...criterios.map((c) => `- ${c}`),
    "",
    "Datos que tenés que recolectar (usá guardar_datos_calificacion a medida que los obtengas):",
    ...datos.map((f) => `- ${f}`),
    "",
    knownFacts.length > 0
      ? [
          "Datos que YA tenés de este prospecto (no se los vuelvas a preguntar, dalos por sabidos):",
          ...knownFacts,
        ].join("\n")
      : "Todavía no hay datos previos cargados de este prospecto.",
    "",
    contactContext.isFirstReplyToCampaign
      ? contactContext.area !== "penal"
        ? // Civil (accidentes laborales) y Marketing (venta consultiva): el guión de apertura y de
          // preguntas vive completo en el prompt del agente (panel Agentes IA).
          // Acá NO se fuerza la vieja pregunta de "¿sigue vigente o ya lo
          // resolviste?", porque ahora la charla es más natural y no hay botones.
          "Este prospecto viene de una campaña: el mensaje inicial ya se lo mandamos nosotros en tu nombre y ahora te está respondiendo por primera vez. Seguí desde ahí, de forma natural, según el guión de tu rol."
        : "Este prospecto viene de una campaña (le escribiste vos primero con un mensaje inicial y ahora te está respondiendo por primera vez). Antes de seguir calificando, arrancá preguntando si su situación sigue vigente o si ya la resolvió — si ya la resolvió, agradecé y cerrá la conversación amablemente sin insistir."
      : "",
    "Reglas estrictas:",
    "- NUNCA inventes información, plazos, montos ni asesoramiento legal específico.",
    "- NUNCA te presentes como abogado/a: sos un asistente que organiza la consulta.",
    "- Si piden hablar con una persona, o la situación lo amerita, usá escalar_a_humano.",
    "- Antes de ofrecer un turno, usá consultar_disponibilidad para ver horarios reales.",
    "- Para confirmar un turno, usá agendar_cita con el horario exacto elegido.",
    "- Respondé en español rioplatense, de forma breve, clara y empática.",
    // 24/10 (decisión de la responsable): la persona que sigue la gestión la asigna el equipo a mano.
    "- No prometas día ni hora del contacto de un asesor, vendedor o abogado. Podés preguntar qué franja le queda mejor y guardarla, pero al cerrar decí solo que una persona del equipo se va a comunicar con vos, sin «hoy», «mañana», «por la mañana» ni horarios.",
    "- Nunca digas que le corresponde una indemnización, compensación, reclamo o cobertura, ni que va a cobrar, ganar o ahorrar: eso lo evalúa el equipo con su caso.",
    "- Usá las herramientas solo cuando hay un dato real y nuevo para registrar (no en un saludo).",
  ]
    .filter(Boolean)
    .join("\n");
}
