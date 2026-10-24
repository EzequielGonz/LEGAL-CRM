import type { FunctionDeclaration } from "@google/genai";
import type { Area } from "@/lib/supabase/database.types";
import { MOTIVOS_AGENTE, TRATAMIENTO_ATENCION } from "@/lib/captacion/reglas";

const MOTIVOS_DETENER = MOTIVOS_AGENTE.filter((m) => TRATAMIENTO_ATENCION[m].detener && !TRATAMIENTO_ATENCION[m].principal);
const MOTIVOS_ESCALAR = MOTIVOS_AGENTE.filter((m) => !MOTIVOS_DETENER.includes(m));

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
      "Pasa la conversación a una persona del equipo cuando la persona pide hablar con alguien, consulta algo fuera de tu alcance (precios, decisiones del profesional) o comparte datos sensibles. Elegí la categoría. Apaga tus respuestas automáticas en esta conversación. Nunca la uses con un mensaje automático de otro negocio (ausencia, menú de opciones).",
    parametersJsonSchema: {
      type: "object",
      properties: {
        categoria: { type: "string", enum: MOTIVOS_ESCALAR },
        motivo: { type: "string", description: "Qué dijo o pidió la persona, en una frase." },
      },
      required: ["motivo"],
    },
  },
  {
    name: "detener_contacto",
    description:
      "Detiene el contacto cuando la persona no quiere más mensajes, se enoja por el contacto, es un número equivocado, ya resolvió su necesidad, ya tiene abogado, ya contrató por otro canal, no le interesa, pregunta de dónde sacamos su contacto o pide borrar sus datos. Después respondé SOLO la disculpa que te indica el resultado de la herramienta y quedá a disposición. No se le vuelve a escribir por iniciativa propia, pero si la persona vuelve a escribir, la seguís atendiendo.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        motivo: { type: "string", enum: MOTIVOS_DETENER },
        detalle: { type: "string", description: "Lo que dijo la persona, en una frase." },
      },
      required: ["motivo"],
    },
  },
  {
    name: "captar",
    description:
      "Registra la captación SOLO cuando la persona aceptó el siguiente paso que corresponde al rubro (ver las reglas de captación). Agendar no es captar. Si la persona solo preguntó el precio, usá solo_precio=true: no capta y pasa a una persona.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        aceptacion: { type: "boolean", description: "true si aceptó el siguiente paso." },
        evidencia: { type: "string", description: "Qué aceptó, con sus palabras." },
        solo_precio: { type: "boolean" },
      },
      required: ["aceptacion", "evidencia"],
    },
  },
  {
    name: "registrar_ubicacion",
    description:
      "Registra la ubicación de la persona: amba o fuera (fuera de AMBA). Usala solo cuando la persona dijo dónde está (o es dudosa: sin_confirmar). No la llames en un saludo ni supongas AMBA.",
    parametersJsonSchema: {
      type: "object",
      properties: { zona: { type: "string", enum: ["amba", "fuera", "sin_confirmar"] } },
      required: ["zona"],
    },
  },
  {
    name: "finalizar_consulta",
    description:
      "Cierra la conversación de una consulta legal de cualquier tema (accidente laboral, despido, tránsito, familia, sucesión, penal u otro; solo línea Civil). Usala UNA sola vez, al final. " +
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
      "Solo en 'aprobado' apaga tus respuestas automáticas (sigue una persona); en 'no_interesado' disculpate, quedá a disposición y seguí atendiendo si vuelve a escribir.",
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
    name: "pedir_presupuesto",
    description:
      "Registra que el prospecto QUIERE que le preparemos un presupuesto (preguntáselo siempre al cerrar). Cuenta como captado y avisa al equipo. " +
      "Después decile que el presupuesto va a estar listo en menos de 24 horas. Nunca armes ni estimes el presupuesto vos.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        detalle: { type: "string", description: "Qué necesita, con sus palabras (objetivo, alcance, lo que pidió)." },
        servicios: { type: "array", items: { type: "string" }, description: "Servicios conversados (ej.: Sitio web, Google Maps, Redes)." },
        presupuesto_mencionado: { type: "string", description: "Si mencionó cuánto quiere o puede invertir." },
        urgencia: { type: "string", description: "Para cuándo lo necesita, si lo dijo." },
      },
      required: ["detalle"],
    },
  },
  {
    name: "presupuesto_aprobado",
    description: "Registra que el prospecto APROBÓ el presupuesto que ya recibió (cierre). Después agradecé y contale que el equipo lo contacta para arrancar.",
    parametersJsonSchema: {
      type: "object",
      properties: { evidencia: { type: "string", description: "Lo que dijo al aprobar." } },
      required: ["evidencia"],
    },
  },
  {
    name: "registrar_venta",
    description:
      "Guarda lo que vas sabiendo de la venta para el equipo (no se le dice al prospecto): etapa y datos. Usala cuando presentes la propuesta, cuando aparezcan precios, objeciones o plazos.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        etapa: { type: "string", enum: ["propuesta"], description: "'propuesta' cuando ya le presentaste la propuesta." },
        necesidad: { type: "string" },
        servicios_conversados: { type: "array", items: { type: "string" } },
        precios_mencionados: { type: "array", items: { type: "string" } },
        objeciones: { type: "array", items: { type: "string" } },
        plazo_deseado: { type: "string" },
      },
    },
  },
  {
    name: "analizar_negocio",
    description:
      "Analiza en el momento el negocio del prospecto con IA (sitio web, ficha de Google Maps y búsqueda en la web) y devuelve los hallazgos concretos para armar la propuesta. " +
      "Usala cuando el prospecto aceptó escuchar la propuesta o pidió saber más y todavía no tenés el análisis. Si es un negocio de una base extraída, llamala sin parámetros (ya tenemos su ficha). Si nos escribió por su cuenta, pasá su sitio web o el nombre y la zona.",
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

/** Herramientas EXCLUSIVAS de Jurídico (Civil y Penal): ruta y Fase 2. */
export const JURIDICO_TOOLS: FunctionDeclaration[] = [
  {
    name: "elegir_ruta_juridica",
    description:
      "Registra la ruta del caso: 'fases' para un caso frío (Fase 1 agenda la revisión, Fase 2 obtiene el relato) o 'directa' para una consulta actual (ruta rápida).",
    parametersJsonSchema: {
      type: "object",
      properties: { ruta: { type: "string", enum: ["fases", "directa"] } },
      required: ["ruta"],
    },
  },
  {
    name: "programar_fase2",
    description:
      "Agenda la Fase 2 (revisión del caso con vos, sin usar turnos del equipo). Empieza unos 2 minutos después si la persona puede ahora, o en el horario que eligió (ISO 8601). Agendar NO capta.",
    parametersJsonSchema: {
      type: "object",
      properties: { horario: { type: "string", description: "Inicio elegido, ISO 8601. Vacío = en unos minutos." } },
    },
  },
];

/** Herramientas disponibles según el área del agente. */
export function toolsForArea(area: Area): FunctionDeclaration[] {
  if (area === "marketing") {
    // Marketing no usa finalizar_consulta (es del cuestionario de Civil).
    return [...AGENT_TOOLS.filter((t) => t.name !== "finalizar_consulta"), ...MARKETING_TOOLS];
  }
  if (area === "civil" || area === "penal") return [...AGENT_TOOLS, ...JURIDICO_TOOLS];
  // Coberturas y Autos: sin el cierre propio de Civil.
  return AGENT_TOOLS.filter((t) => t.name !== "finalizar_consulta");
}
