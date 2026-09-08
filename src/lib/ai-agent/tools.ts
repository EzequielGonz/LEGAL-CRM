import type { FunctionDeclaration } from "@google/genai";

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
];
