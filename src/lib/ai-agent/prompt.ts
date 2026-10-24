/**
 * Instrucciones del agente (24/10): las arman el agente en vivo (agent.ts) y
 * «Probar el bot real» (probar-real.ts) con las mismas funciones, así la
 * prueba nunca se desfasa de lo que responde en producción.
 */
import type { Area } from "@/lib/supabase/database.types";
import { rubroSlugDe } from "@/lib/captacion";
import { CRITERIO_POR_RUBRO } from "@/lib/captacion/reglas";
import { reglaDeRechazo } from "@/lib/captacion/insistencia";

/** Criterio de captación y límites del rubro, desde la configuración (no del prompt editable). */
export function criterioDelRubro(area: Area, rubroId: string | null): string {
  let slug;
  try {
    slug = rubroSlugDe({ rubro_id: rubroId, area });
  } catch {
    return "";
  }
  const c = CRITERIO_POR_RUBRO[slug];
  return [
    "Captación (regla del sistema):",
    `- Hay captación solo con: ${c.aceptacion}. Cuando la persona lo acepte, usá la herramienta captar con la evidencia (lo que dijo).`,
    "- Agendar no es captar. Compartir datos no es derivar. Derivar lo hace una persona.",
    `- Datos deseables (si faltan no impiden captar): ${c.deseables.join(", ")}.`,
    c.zonaAplica ? "- La ubicación se registra con registrar_ubicacion (AMBA, fuera de AMBA o sin confirmar). Nunca supongas AMBA." : "",
    `- Nunca prometas ni informes: ${c.limites.join(", ")}.`,
    ...reglaDeRechazo(slug),
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

  return [
    // Identidad cargada a mano en el perfil (bloque 1.4): no sale del código.
    `Te presentás como ${identity.presentationName}, de ${identity.brandName}. No uses otro nombre ni otra marca, no inventes una persona real, matrícula ni disponibilidad humana, y si te preguntan si sos una automatización respondé con la verdad.`,
    "",
    agent.system_prompt,
    "",
    "Criterios de calificación comercial (evaluá contra esto con la herramienta evaluar_calificacion):",
    ...(agent.qualification_criteria ?? []).map((c) => `- ${c}`),
    "",
    "Datos que tenés que recolectar (usá guardar_datos_calificacion a medida que los obtengas):",
    ...(agent.required_fields ?? []).map((f) => `- ${f}`),
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
  ]
    .filter(Boolean)
    .join("\n");
}
