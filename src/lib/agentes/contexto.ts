/**
 * Etapa 3 · Contexto de un turno y resumen fiel de la oportunidad (cap. 16).
 *
 * El contexto se arma con: reglas obligatorias, rol y modo, identidad
 * configurada, hechos del perfil, resumen de la oportunidad con procedencia,
 * mensajes recientes y resultados de herramientas. No se infiere
 * personalidad ni capacidad económica; lo aproximado se marca así.
 */

import { detectarSenales, seleccionarModulos, textoDeModulos, type Modo, type ModuloSemilla } from "@/lib/agentes/modulos";
import { CRITERIO_POR_RUBRO, type RubroSlug } from "@/lib/captacion/reglas";

export interface ResumenOportunidad {
  necesidad: string | null;
  datos_confirmados: Record<string, { valor: unknown; aproximado?: boolean; fuente?: "persona" | "base" | "analisis" }>;
  faltantes: string[];
  objeciones: string[];
  preferencia_contacto: string | null;
  disponibilidad: string | null;
  aceptacion: { valor: boolean; evidencia?: string | null } | null;
  accion_pendiente: string | null;
  correcciones: string[];
  zona: "amba" | "fuera" | "sin_confirmar";
}

export function resumenVacio(): ResumenOportunidad {
  return { necesidad: null, datos_confirmados: {}, faltantes: [], objeciones: [], preferencia_contacto: null, disponibilidad: null, aceptacion: null, accion_pendiente: null, correcciones: [], zona: "sin_confirmar" };
}

/** Arma el resumen desde lo que ya existe (qualification_data, zona, advertencias) sin inventar. */
export function armarResumen(input: {
  rubro: RubroSlug;
  qualificationData?: Record<string, unknown> | null;
  zona?: unknown;
  advertencias?: string[] | null;
  captado?: boolean;
  evidencia?: string | null;
  notas?: string | null;
}): ResumenOportunidad {
  const r = resumenVacio();
  const qd = input.qualificationData ?? {};
  for (const [k, v] of Object.entries(qd)) {
    if (v === null || v === undefined || v === "") continue;
    r.datos_confirmados[k] = { valor: v, fuente: "persona" };
  }
  if (typeof qd.necesidad === "string") r.necesidad = qd.necesidad;
  if (typeof qd.tipo_de_consulta === "string" && !r.necesidad) r.necesidad = qd.tipo_de_consulta;
  if (typeof qd.preferencia_contacto === "string") r.preferencia_contacto = qd.preferencia_contacto;
  if (typeof qd.disponibilidad_para_reunion === "string") r.disponibilidad = qd.disponibilidad_para_reunion;
  const deseables = CRITERIO_POR_RUBRO[input.rubro].deseables;
  r.faltantes = (input.advertencias && input.advertencias.length ? input.advertencias : deseables.filter((d) => !(d in r.datos_confirmados))).filter((x) => x !== "ubicacion_sin_confirmar");
  r.zona = input.zona === "amba" || input.zona === "fuera" ? input.zona : "sin_confirmar";
  if (input.captado) r.aceptacion = { valor: true, evidencia: input.evidencia ?? null };
  return r;
}

export function textoResumen(r: ResumenOportunidad): string {
  const datos = Object.entries(r.datos_confirmados).map(([k, v]) => `- ${k.replaceAll("_", " ")}: ${String(v.valor)}${v.aproximado ? " (aprox.)" : ""}`);
  return [
    r.necesidad ? `Necesidad: ${r.necesidad}` : "Necesidad: todavía no expresada",
    datos.length ? `Datos que ya informó (no los vuelvas a preguntar):\n${datos.join("\n")}` : "Sin datos previos.",
    r.faltantes.length ? `Falta (no bloquea, pedí solo lo útil): ${r.faltantes.join(", ")}` : "",
    `Ubicación: ${r.zona === "amba" ? "AMBA" : r.zona === "fuera" ? "fuera de AMBA (se conserva y se advierte)" : "sin confirmar (nunca supongas AMBA)"}`,
    r.objeciones.length ? `Objeciones expresadas: ${r.objeciones.join("; ")}` : "",
    r.preferencia_contacto ? `Preferencia de contacto: ${r.preferencia_contacto}` : "",
    r.disponibilidad ? `Disponibilidad: ${r.disponibilidad}` : "",
    r.aceptacion?.valor ? `Ya aceptó el siguiente paso (${r.aceptacion.evidencia ?? "evidencia guardada"}): no sigas vendiendo.` : "",
    r.accion_pendiente ? `Acción pendiente: ${r.accion_pendiente}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export interface ContextoTurno {
  systemInstruction: string;
  modulos: string[];
  senales: string[];
}

/** Instrucción del sistema para un turno. `instruccionesAgente` son las del principal + derivado (versionadas). */
export function armarContexto(input: {
  rubro: RubroSlug;
  modo: Modo;
  identidad: { presentationName: string; brandName: string };
  instruccionesAgente?: string | null;
  limites?: string[];
  hechosPerfil?: string[];
  resumen: ResumenOportunidad;
  ultimoMensaje: string;
  primerTurno?: boolean;
  esAudioODocumento?: boolean;
  modulos?: ModuloSemilla[];
}): ContextoTurno {
  const senales = detectarSenales(input.ultimoMensaje, { primerTurno: input.primerTurno, esAudioODocumento: input.esAudioODocumento });
  const modulos = seleccionarModulos({ rubro: input.rubro, modo: input.modo, senales, modulos: input.modulos });
  const criterio = CRITERIO_POR_RUBRO[input.rubro];
  const systemInstruction = [
    `Te presentás como ${input.identidad.presentationName || "el asistente"}, de ${input.identidad.brandName || "la marca configurada"}. No usás otro nombre ni otra marca.`,
    `Modo de esta conversación: ${input.modo === "frio" ? "contacto frío (la empresa escribió primero)" : input.modo === "consulta_actual" ? "consulta actual (la persona escribió)" : "seguimiento de una conversación interrumpida"}.`,
    textoDeModulos(modulos),
    input.instruccionesAgente?.trim() ? `## Instrucciones del agente (versión vigente)\n${input.instruccionesAgente.trim()}` : "",
    `## Captación en este rubro\n- Hay captación solo con: ${criterio.aceptacion}. Usá la herramienta captar con la evidencia.\n- Nunca informes: ${[...criterio.limites, ...(input.limites ?? [])].join(", ")}.`,
    input.hechosPerfil?.length ? `## Hechos autorizados del negocio\n${input.hechosPerfil.map((h) => `- ${h}`).join("\n")}` : "## Hechos autorizados del negocio\nNinguno cargado: no afirmes servicios, precios ni condiciones concretas.",
    `## Resumen de esta oportunidad\n${textoResumen(input.resumen)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  return { systemInstruction, modulos: modulos.map((m) => m.clave), senales };
}
