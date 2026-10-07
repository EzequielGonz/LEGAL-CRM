import type { FunctionDeclaration } from "@google/genai";
import type { Area } from "@/lib/supabase/database.types";

/**
 * Herramientas que el agente IA puede invocar durante la conversación.
 * Se ejecutan en `agent.ts` y siempre operan sobre la conversación actual.
 *
 * Formato "function calling" de Gemini (antes se usaba el formato de
 * "tool use" de Anthropic/Claude — la forma es distinta pero el
 * comportamiento es equivalente): cada herramienta es una
 * `FunctionDeclaration` con su JSON Schema de parámetros en
 * `parametersJsonSchema`.
 */
export const AGENT_TOOLS: FunctionDeclaration[] = [
  {
    name: "guardar_datos_calificacion",
    description:
      "Guarda o actualiza datos recolectados del prospecto (nombre, tipo de consulta, hechos relevantes, etc.). Llamalo cada vez que obtengas un dato nuevo, no esperes a tener todos.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        datos: {
          type: "object",
          description:
            "Pares clave-valor con los datos recolectados, ej: {\"tipo_de_consulta\": \"Accidente laboral\", \"tiempo_transcurrido\": \"8 meses\"}",
        },
      },
      required: ["datos"],
    },
  },
  {
    name: "evaluar_calificacion",
    description:
      "Marca si el prospecto cumple o no los criterios comerciales definidos para el área, con una breve justificación. Llamalo una vez que tengas información suficiente para decidir.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        cumple_criterios: { type: "boolean" },
        justificacion: { type: "string" },
      },
      required: ["cumple_criterios", "justificacion"],
    },
  },
  {
    name: "consultar_disponibilidad",
    description:
      "Devuelve los próximos horarios disponibles para agendar una consulta en esta área. Usalo antes de ofrecer un turno.",
    parametersJsonSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "agendar_cita",
    description:
      "Crea la cita en el horario exacto que el prospecto eligió (debe ser uno de los horarios devueltos por consultar_disponibilidad). Esto marca al prospecto como agendado y dispara la notificación al administrador.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        starts_at: { type: "string", description: "Fecha y hora de inicio en formato ISO 8601" },
        ends_at: { type: "string", description: "Fecha y hora de fin en formato ISO 8601" },
      },
      required: ["starts_at", "ends_at"],
    },
  },
  {
    name: "escalar_a_humano",
    description:
      "Deriva la conversación a un humano cuando el prospecto pide hablar con una persona, hay una situación sensible/urgente, o vos no podés resolver algo. Apaga tus respuestas automáticas en esta conversación.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        motivo: { type: "string" },
      },
      required: ["motivo"],
    },
  },
  {
    name: "finalizar_consulta",
    description:
      "Cierra la conversación de una consulta de accidente laboral (solo área Civil). Usala UNA sola vez, al final. " +
      "resultado='completado': ya tenés los datos del caso y la persona te dijo cuándo le queda cómodo que la contacten de nuevo; el caso pasa al equipo del estudio. " +
      "resultado='caso_resuelto': la persona ya resolvió su situación. " +
      "resultado='no_interesado': pidió que no la contactemos más o no quiere seguir. " +
      "Apaga tus respuestas automáticas en esta conversación, así que después solo despedite con un mensaje corto y cálido.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        resultado: {
          type: "string",
          enum: ["completado", "caso_resuelto", "no_interesado"],
        },
        disponibilidad_para_reunion: {
          type: "string",
          description:
            "Día y/o horario que la persona dijo que le queda cómodo para volver a contactarla, tal cual lo dijo. Obligatorio si resultado='completado'.",
        },
      },
      required: ["resultado"],
    },
  },
];

/**
 * Herramientas EXCLUSIVAS del agente de Kocos Marketing. No existen para
 * ningún otro rubro.
 */
export const MARKETING_TOOLS: FunctionDeclaration[] = [
  {
    name: "registrar_resultado_marketing",
    description:
      "Registra cómo quedó la conversación con el prospecto. Es obligatorio llamarla cuando se define: " +
      "resultado='aprobado': aceptó la propuesta y quiere avanzar (el sistema avisa al equipo técnico y cierra el caso: después avisale al prospecto que lo derivás al equipo técnico para empezar el proyecto). " +
      "resultado='en_duda': duda, quiere pensarlo o dice que en otro momento (el sistema le hace seguimiento por WhatsApp). " +
      "resultado='no_interesado': dijo claramente que no o pidió que no lo contactemos más. " +
      "Apaga tus respuestas automáticas salvo en 'en_duda'.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        resultado: { type: "string", enum: ["aprobado", "en_duda", "no_interesado"] },
        motivo: {
          type: "string",
          description:
            "Una frase con lo que dijo el prospecto y/o lo que se aprobó (servicios y presupuesto acordado, si aplica).",
        },
      },
      required: ["resultado", "motivo"],
    },
  },
  {
    name: "analizar_negocio",
    description:
      "Analiza en el momento el negocio de un prospecto que nos escribió por su cuenta (consulta directa): revisa su sitio web y/o su ficha de Google Maps y devuelve los hallazgos concretos. " +
      "Usala cuando no tengas análisis y el prospecto te pase su sitio web o el nombre y la zona de su negocio.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        sitio_web: { type: "string", description: "URL del sitio web del negocio, si la tiene." },
        nombre_y_zona: {
          type: "string",
          description: "Nombre del negocio y su zona/ciudad, para buscar su ficha en Google Maps. Ej: 'Panadería Don Pepe, Rosario'.",
        },
      },
    },
  },
];

/** Herramientas disponibles según el área del agente. */
export function toolsForArea(area: Area): FunctionDeclaration[] {
  if (area === "marketing") {
    // Marketing no usa finalizar_consulta (es del cuestionario de Civil).
    return [...AGENT_TOOLS.filter((t) => t.name !== "finalizar_consulta"), ...MARKETING_TOOLS];
  }
  return AGENT_TOOLS;
}
