/**
 * Etapa 2 · Bloques 2.1, 2.4 y parche 2.0 (secciones 10.2 y 12.2) — Reglas de
 * captación por rubro, resultado posterior a la derivación y clasificación de
 * la atención humana. Sin dependencias: se prueba solo.
 *
 * Referencia: `.claude/referencias/reglas-comunes.md`, secciones 3, 6 y 7.
 */

export type RubroSlug = "juridico" | "coberturas_medicas" | "agencia_0km" | "marketing";

/** Criterio de captación por rubro, como configuración (no como prompt). */
export interface CriterioCaptacion {
  /** Qué tiene que aceptar la persona para que haya captación. */
  aceptacion: string;
  /** Datos deseables: faltar no impide captar, pero deja una advertencia. */
  deseables: string[];
  /** Si la zona (AMBA) se registra para este rubro. */
  zonaAplica: boolean;
  /** Lo que el agente nunca promete en este rubro. */
  limites: string[];
}

export const CRITERIO_POR_RUBRO: Record<RubroSlug, CriterioCaptacion> = {
  juridico: {
    aceptacion: "Aceptación del análisis del caso y del contacto del profesional (o del contacto del profesional, como excepción)",
    deseables: ["relato", "lesion", "lugar_del_accidente", "denuncia", "art", "asistencia", "alta_o_tratamiento", "localidad"],
    zonaAplica: true,
    limites: ["indemnización", "resultado", "viabilidad", "asesoramiento definitivo"],
  },
  coberturas_medicas: {
    aceptacion: "Interés y aceptación de continuar con el asesor",
    deseables: ["cobertura_actual", "localidad", "integrantes_y_edades", "trabajo", "objetivo_de_cambio"],
    zonaAplica: true,
    limites: ["planes", "precios", "cobertura garantizada", "elegibilidad", "exclusión por edad"],
  },
  agencia_0km: {
    aceptacion: "Interés y aceptación del contacto del vendedor",
    deseables: ["modelo", "zona", "anticipo", "usado", "necesidad"],
    zonaAplica: true,
    limites: ["stock", "cuotas", "financiación", "entrega"],
  },
  marketing: {
    aceptacion: "Proyecto o necesidad y siguiente paso aceptado (análisis, presupuesto o reunión)",
    deseables: ["negocio", "necesidad", "sitio_web_o_redes", "zona"],
    zonaAplica: false,
    limites: ["precios", "rangos", "plazos", "retorno prometido"],
  },
};

export const ZONAS = ["amba", "fuera", "sin_confirmar"] as const;
export type Zona = (typeof ZONAS)[number];
export const ZONA_LABEL: Record<Zona, string> = {
  amba: "AMBA",
  fuera: "Fuera de AMBA",
  sin_confirmar: "Ubicación sin confirmar",
};

/** La zona siempre es un valor explícito: sin ubicación, «sin confirmar», nunca AMBA. */
export function normalizarZona(value: unknown): Zona {
  return typeof value === "string" && (ZONAS as readonly string[]).includes(value) ? (value as Zona) : "sin_confirmar";
}

export interface EvaluacionCaptacion {
  captar: boolean;
  /** Por qué no se capta (si no se capta). */
  motivo?: "sin_aceptacion" | "solo_precio" | "sin_evidencia";
  /** Datos deseables que faltan: no impiden captar. */
  advertencias: string[];
  zona: Zona;
  /** Fuera de AMBA en un rubro donde la zona aplica: captado en grupo aparte. */
  fueraDeZona: boolean;
}

/**
 * Captado = interés + aceptación del siguiente paso con evidencia guardada.
 * Datos parciales o fuera de AMBA no hacen perder una captación válida; solo
 * preguntar el precio (Marketing) no capta y va a una persona.
 */
export function evaluarCaptacion(input: {
  rubro: RubroSlug;
  aceptacion: boolean;
  evidencia: string;
  datos: Record<string, unknown>;
  zona?: unknown;
  soloPrecio?: boolean;
}): EvaluacionCaptacion {
  const criterio = CRITERIO_POR_RUBRO[input.rubro];
  const zona = criterio.zonaAplica ? normalizarZona(input.zona) : "sin_confirmar";
  const advertencias = criterio.deseables.filter((k) => {
    const v = input.datos?.[k];
    return v === undefined || v === null || (typeof v === "string" && !v.trim());
  });
  const fueraDeZona = criterio.zonaAplica && zona === "fuera";
  if (criterio.zonaAplica && zona === "sin_confirmar") advertencias.push("ubicacion_sin_confirmar");
  if (input.soloPrecio) return { captar: false, motivo: "solo_precio", advertencias, zona, fueraDeZona };
  if (!input.aceptacion) return { captar: false, motivo: "sin_aceptacion", advertencias, zona, fueraDeZona };
  if (!input.evidencia || !input.evidencia.trim()) return { captar: false, motivo: "sin_evidencia", advertencias, zona, fueraDeZona };
  return { captar: true, advertencias, zona, fueraDeZona };
}

// ---------------------------------------------------------------------
// Resultado posterior a la derivación (parche 2.0, sección 10.2)
// ---------------------------------------------------------------------

export const RESULTADOS_POSTERIORES = [
  "contacto_previsto",
  "pendiente_actualizacion",
  "contactado_por_profesional",
  "avanzo",
  "operacion_concretada",
  "no_avanzo",
  "necesita_nueva_gestion",
] as const;
export type ResultadoPosterior = (typeof RESULTADOS_POSTERIORES)[number];

export const RESULTADO_POSTERIOR_LABEL: Record<ResultadoPosterior, string> = {
  contacto_previsto: "Contacto previsto",
  pendiente_actualizacion: "Pendiente de actualización",
  contactado_por_profesional: "Contactado por el profesional",
  avanzo: "Avanzó",
  operacion_concretada: "Operación concretada",
  no_avanzo: "No avanzó",
  necesita_nueva_gestion: "Necesita nueva gestión",
};

export const MOTIVOS_NO_AVANCE = [
  "no_se_pudo_contactar",
  "decision_pendiente",
  "alternativa_elegida",
  "oferta_no_adecuada",
  "presupuesto",
  "disponibilidad",
  "fuera_de_zona",
  "otro",
] as const;
export type MotivoNoAvance = (typeof MOTIVOS_NO_AVANCE)[number];

export const MOTIVO_NO_AVANCE_LABEL: Record<MotivoNoAvance, string> = {
  no_se_pudo_contactar: "No se pudo contactar",
  decision_pendiente: "Decisión pendiente",
  alternativa_elegida: "Eligió otra alternativa",
  oferta_no_adecuada: "Oferta no adecuada",
  presupuesto: "Presupuesto",
  disponibilidad: "Disponibilidad",
  fuera_de_zona: "Fuera de zona",
  otro: "Otro",
};

export const FUENTES_RESULTADO = ["profesional", "operador", "prospecto"] as const;
export type FuenteResultado = (typeof FUENTES_RESULTADO)[number];

export function esResultadoPosterior(v: unknown): v is ResultadoPosterior {
  return typeof v === "string" && (RESULTADOS_POSTERIORES as readonly string[]).includes(v);
}
export function esMotivoNoAvance(v: unknown): v is MotivoNoAvance {
  return typeof v === "string" && (MOTIVOS_NO_AVANCE as readonly string[]).includes(v);
}
export function esFuenteResultado(v: unknown): v is FuenteResultado {
  return typeof v === "string" && (FUENTES_RESULTADO as readonly string[]).includes(v);
}

/**
 * Validación del registro de un resultado posterior. Es otra dimensión:
 * nunca toca la captación ni la derivación, y nunca inicia una secuencia
 * automática. Los motivos de no avance no prohíben consultas futuras.
 */
export function validarResultadoPosterior(input: {
  derivado: boolean;
  resultado: unknown;
  fuente: unknown;
  motivo?: unknown;
  nota?: unknown;
}): { ok: true; resultado: ResultadoPosterior; fuente: FuenteResultado; motivo: MotivoNoAvance | null; nota: string | null } | { ok: false; error: string } {
  if (!input.derivado) return { ok: false, error: "El resultado posterior se registra después de derivar." };
  if (!esResultadoPosterior(input.resultado)) return { ok: false, error: "Resultado posterior no válido." };
  if (!esFuenteResultado(input.fuente)) return { ok: false, error: "Indicá la fuente del resultado (profesional, operador o prospecto)." };
  const nota = typeof input.nota === "string" ? input.nota.trim().slice(0, 1000) || null : null;
  let motivo: MotivoNoAvance | null = null;
  if (input.resultado === "no_avanzo" || input.resultado === "necesita_nueva_gestion") {
    if (!esMotivoNoAvance(input.motivo)) return { ok: false, error: "Indicá el motivo del no avance." };
    motivo = input.motivo;
  }
  return { ok: true, resultado: input.resultado, fuente: input.fuente, motivo, nota };
}

// ---------------------------------------------------------------------
// Clasificación de la atención humana (parche 2.0, sección 12.2)
// ---------------------------------------------------------------------

export const MOTIVOS_ATENCION = [
  // Disculpa y detención (archivo de detenidos, indicador secundario)
  "no_quiere_mensajes",
  "enojo_por_contacto",
  "numero_equivocado",
  "caso_resuelto",
  "abogado_existente",
  "compra_otro_canal",
  "desinteres",
  // Atención humana principal (pausar chat y solicitud concreta)
  "pide_persona",
  "precio_fuera_alcance",
  "decision_profesional",
  "consulta_fuera_alcance",
  "datos_sensibles",
  "mensaje_posterior_captado",
  "contacto_detenido_escribio",
  // Procedencia
  "pregunta_procedencia",
  // Solicitud de datos (circuito propio)
  "procedencia_no_comprobable",
  "reclamo_datos",
  "solicitud_eliminacion",
  // Excepción de datos
  "numero_de_menor",
  "numero_de_tercero",
  // Incidencia operativa
  "error_plantilla",
  "error_archivo",
  "error_asociacion",
  "envio_incierto",
  // Registro histórico
  "motivo_historico",
  "diferencia_migracion",
] as const;
export type MotivoAtencion = (typeof MOTIVOS_ATENCION)[number];

export const CATEGORIAS_ATENCION = [
  "comercial",
  "detencion",
  "procedencia",
  "solicitud_datos",
  "excepcion_datos",
  "incidencia_operativa",
  "registro_historico",
] as const;
export type CategoriaAtencion = (typeof CATEGORIAS_ATENCION)[number];

export const CATEGORIA_ATENCION_LABEL: Record<CategoriaAtencion, string> = {
  comercial: "Atención comercial",
  detencion: "Contacto detenido (archivo secundario)",
  procedencia: "Consulta de procedencia",
  solicitud_datos: "Solicitud de datos",
  excepcion_datos: "Excepción de datos",
  incidencia_operativa: "Incidencia operativa",
  registro_historico: "Registro histórico",
};

export interface TratamientoAtencion {
  categoria: CategoriaAtencion;
  /** Aparece en el centro de atención humana principal. */
  principal: boolean;
  /** La IA deja de responder en ese chat. */
  pausarChat: boolean;
  /** Se registra una detención persistente con este motivo. */
  detener: null | "no_contacto" | "enojo" | "numero_equivocado" | "necesidad_resuelta" | "abogado_existente" | "compra_otro_canal" | "desinteres";
  /** Se informa un número de una menor (bloqueo duro). */
  menor: boolean;
  /** Respuesta esperada del agente. */
  respuesta: "disculpa_breve" | "aviso_de_persona" | "explicar_procedencia" | "reconocer_sin_inventar" | "disculpa_datos" | "ninguna";
  label: string;
}

const T = (
  categoria: CategoriaAtencion,
  label: string,
  o: Partial<Omit<TratamientoAtencion, "categoria" | "label">> = {}
): TratamientoAtencion => ({
  categoria,
  label,
  principal: o.principal ?? false,
  pausarChat: o.pausarChat ?? false,
  detener: o.detener ?? null,
  menor: o.menor ?? false,
  respuesta: o.respuesta ?? "ninguna",
});

export const TRATAMIENTO_ATENCION: Record<MotivoAtencion, TratamientoAtencion> = {
  no_quiere_mensajes: T("detencion", "Pidió no recibir mensajes", { detener: "no_contacto", pausarChat: true, respuesta: "disculpa_breve" }),
  enojo_por_contacto: T("detencion", "Enojo por el contacto", { detener: "enojo", pausarChat: true, respuesta: "disculpa_breve" }),
  numero_equivocado: T("detencion", "Número equivocado", { detener: "numero_equivocado", pausarChat: true, respuesta: "disculpa_breve" }),
  caso_resuelto: T("detencion", "Caso o necesidad ya resuelta", { detener: "necesidad_resuelta", pausarChat: true, respuesta: "disculpa_breve" }),
  abogado_existente: T("detencion", "Ya tiene abogado", { detener: "abogado_existente", pausarChat: true, respuesta: "disculpa_breve" }),
  compra_otro_canal: T("detencion", "Compró o contrató por otro canal", { detener: "compra_otro_canal", pausarChat: true, respuesta: "disculpa_breve" }),
  desinteres: T("detencion", "No le interesa", { detener: "desinteres", pausarChat: true, respuesta: "disculpa_breve" }),

  pide_persona: T("comercial", "Pide hablar con una persona", { principal: true, pausarChat: true, respuesta: "aviso_de_persona" }),
  precio_fuera_alcance: T("comercial", "Consulta de precio que corresponde a una persona", { principal: true, pausarChat: true, respuesta: "aviso_de_persona" }),
  decision_profesional: T("comercial", "Decisión que corresponde al profesional", { principal: true, pausarChat: true, respuesta: "aviso_de_persona" }),
  consulta_fuera_alcance: T("comercial", "Consulta fuera del alcance autorizado", { principal: true, pausarChat: true, respuesta: "aviso_de_persona" }),
  datos_sensibles: T("comercial", "Datos sensibles con tratamiento específico", { principal: true, pausarChat: true, respuesta: "aviso_de_persona" }),
  mensaje_posterior_captado: T("comercial", "Mensaje posterior de una persona captada", { principal: true, pausarChat: true }),
  contacto_detenido_escribio: T("comercial", "Escribió un contacto detenido", { principal: true, pausarChat: true }),

  // 24/10 (decisión de la responsable): origen de los datos, reclamo o pedido
  // de baja → disculpa automática sin explicar el origen y detención. No pasa
  // a atención humana: el origen lo atiende el equipo de marketing.
  pregunta_procedencia: T("procedencia", "Pregunta de dónde sacamos su contacto", { detener: "no_contacto", pausarChat: true, respuesta: "disculpa_datos" }),

  procedencia_no_comprobable: T("solicitud_datos", "Procedencia no comprobable", { detener: "no_contacto", pausarChat: true, respuesta: "disculpa_datos" }),
  reclamo_datos: T("solicitud_datos", "Reclamo sobre sus datos", { detener: "no_contacto", pausarChat: true, respuesta: "disculpa_datos" }),
  solicitud_eliminacion: T("solicitud_datos", "Pide eliminar sus datos", { detener: "no_contacto", pausarChat: true, respuesta: "disculpa_datos" }),

  numero_de_menor: T("excepcion_datos", "Número informado como de una menor", { principal: true, pausarChat: true, detener: "no_contacto", menor: true, respuesta: "disculpa_breve" }),
  numero_de_tercero: T("excepcion_datos", "Número de un tercero", { principal: true, pausarChat: true, detener: "numero_equivocado", respuesta: "disculpa_breve" }),

  error_plantilla: T("incidencia_operativa", "Error de plantilla"),
  error_archivo: T("incidencia_operativa", "Error de archivo"),
  error_asociacion: T("incidencia_operativa", "Error de asociación"),
  envio_incierto: T("incidencia_operativa", "Envío incierto"),

  motivo_historico: T("registro_historico", "Motivo histórico no confirmado"),
  diferencia_migracion: T("registro_historico", "Diferencia de migración"),
};

export function esMotivoAtencion(v: unknown): v is MotivoAtencion {
  return typeof v === "string" && (MOTIVOS_ATENCION as readonly string[]).includes(v);
}

/** Tratamiento de un motivo; un motivo desconocido se conserva como registro histórico. */
export function clasificarAtencion(motivo: unknown): TratamientoAtencion & { motivo: MotivoAtencion } {
  if (esMotivoAtencion(motivo)) return { ...TRATAMIENTO_ATENCION[motivo], motivo };
  return { ...TRATAMIENTO_ATENCION.motivo_historico, motivo: "motivo_historico" };
}

/** Motivos que el agente puede usar (los de incidencia y registro los pone el sistema o una persona). */
export const MOTIVOS_AGENTE: MotivoAtencion[] = [
  "no_quiere_mensajes",
  "enojo_por_contacto",
  "numero_equivocado",
  "caso_resuelto",
  "abogado_existente",
  "compra_otro_canal",
  "desinteres",
  "pide_persona",
  "precio_fuera_alcance",
  "decision_profesional",
  "consulta_fuera_alcance",
  "datos_sensibles",
  "pregunta_procedencia",
  "procedencia_no_comprobable",
  "reclamo_datos",
  "solicitud_eliminacion",
  "numero_de_menor",
  "numero_de_tercero",
];
