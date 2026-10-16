/**
 * Etapa 3 · Operaciones sobre la base: biblioteca (crear/duplicar),
 * asignaciones, corridas del simulador, evaluación, corpus y trabajos de
 * ajuste. Las reglas viven en los módulos puros; acá solo se aplican.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { validarCambioAgente, type AgenteBiblioteca } from "@/lib/agentes/biblioteca";
import { CASOS, type CasoControl } from "@/lib/agentes/casos";
import { evaluarSimulacion } from "@/lib/agentes/evaluacion";
import { generadorSimulado, generadorVertex, informeModeloActivo, type Generador, type Proveedor } from "@/lib/agentes/modelo";
import { TODOS_LOS_MODULOS } from "@/lib/agentes/modulos";
import { simularConversacion, type ResultadoSimulacion } from "@/lib/agentes/simulador";
import { exportarJsonl, hashCorpus, particionPara, validarJsonl, type CasoCorpus, type Particion } from "@/lib/agentes/corpus";
import { RUBRO_IDS, type RubroSlug } from "@/lib/rubros";
import { getProfile } from "@/lib/profiles";
import type { Area } from "@/lib/supabase/database.types";

export class AgentesError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

// ---------------------------------------------------------------------
// Biblioteca: crear desde el principal / duplicar (sin datos de otro perfil)
// ---------------------------------------------------------------------
export async function crearAgente(input: { clave: string; nombre: string; rubroId: string; desde?: string; objetivo?: string; actor?: string }) {
  const s = createAdminClient();
  if (!/^[a-z0-9_]{2,40}$/.test(input.clave)) throw new AgentesError("La clave admite minúsculas, números y guion bajo (2 a 40).");
  const v = validarCambioAgente({ nombre: input.nombre, objetivo: input.objetivo ?? "" });
  if (!v.ok) throw new AgentesError(v.error);
  const origen = input.desde ?? "principal";
  const { data: base } = await s.from("agent_library").select("*").eq("clave", origen).maybeSingle();
  if (!base) throw new AgentesError("El agente de origen no existe.", 404);
  if (!(Object.values(RUBRO_IDS) as string[]).includes(input.rubroId)) throw new AgentesError("Perfil no válido.");
  // Copia SOLO configuración: modos, límites, conocimiento, instrucciones. Nunca clientes, conversaciones ni credenciales.
  const { data, error } = await s
    .from("agent_library")
    .insert({
      clave: input.clave,
      rol: "derivado",
      hereda_de: base.rol === "principal" ? base.clave : base.hereda_de,
      rubro_id: input.rubroId,
      nombre: v.cambio.nombre,
      objetivo: v.cambio.objetivo ?? base.objetivo,
      modos: base.modos,
      limites: base.rol === "principal" ? [] : base.limites,
      conocimiento: base.rol === "principal" ? [] : base.conocimiento,
      instrucciones: base.instrucciones ?? "",
      estado: "apagado",
      publicacion: "preparado",
      creado_desde: `${base.clave}@${base.version}`,
      updated_by: input.actor ?? "operador",
    })
    .select("*")
    .single();
  if (error) throw new AgentesError(error.code === "23505" ? "Ya existe un agente con esa clave." : `No se pudo crear: ${error.message}`, error.code === "23505" ? 409 : 500);
  const { id: _i, ...snapshot } = data as any;
  await s.from("agent_library_versions").insert({ clave: input.clave, version: 1, snapshot, motivo: `Creado desde ${base.clave}`, created_by: input.actor ?? "operador" });
  return data as AgenteBiblioteca;
}

// ---------------------------------------------------------------------
// Asignaciones: qué agente/versión/modelo responde en cada perfil y área
// ---------------------------------------------------------------------
export async function asignarAgente(input: { rubroId: string; area: Area; clave: string; version: number; proveedor?: Proveedor; identificador?: string | null; estado: "apagada" | "activa" | "pausada"; motivo?: string; actor?: string }) {
  const s = createAdminClient();
  const { data: ag } = await s.from("agent_library").select("clave, version, rubro_id, rol, publicacion").eq("clave", input.clave).maybeSingle();
  if (!ag) throw new AgentesError("Agente no encontrado.", 404);
  if (ag.rol === "principal") throw new AgentesError("El principal no se asigna: se asigna un derivado.");
  if (ag.rubro_id !== input.rubroId) throw new AgentesError("El agente pertenece a otro perfil: no se cruzan perfiles.", 409);
  if (input.version > ag.version) throw new AgentesError("Esa versión no existe.");
  if (input.estado === "activa" && ag.publicacion !== "publicado") throw new AgentesError("Solo se activa una versión publicada (aprobada por evaluación).", 409);
  const { data, error } = await s
    .from("agent_assignments")
    .upsert(
      {
        rubro_id: input.rubroId,
        area: input.area,
        agente_clave: input.clave,
        version: input.version,
        modelo_proveedor: input.proveedor ?? "gemini_api",
        modelo_identificador: input.identificador ?? null,
        estado: input.estado,
        motivo: input.motivo ?? null,
        created_by: input.actor ?? "operador",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "rubro_id,area" }
    )
    .select("*")
    .single();
  if (error) throw new AgentesError(`No se pudo asignar: ${error.message}`, 500);
  return data;
}

/** Asignación ACTIVA para un área (si no hay, responde `ai_agents` como hoy). */
export async function asignacionActiva(area: Area) {
  const { data } = await createAdminClient().from("agent_assignments").select("*").eq("area", area).eq("estado", "activa").maybeSingle();
  return data ?? null;
}

export async function publicarVersion(input: { clave: string; version: number; publicacion: "publicado" | "pausado" | "ajustado" | "preparado"; actor?: string }) {
  const s = createAdminClient();
  const { data: ag } = await s.from("agent_library").select("clave, version, ultima_evaluacion").eq("clave", input.clave).maybeSingle();
  if (!ag) throw new AgentesError("Agente no encontrado.", 404);
  if (input.publicacion === "publicado") {
    const ev = ag.ultima_evaluacion as any;
    if (!ev || (ev.fallos_criticos ?? 1) > 0 || (ev.comercial_min ?? 0) < 14) {
      throw new AgentesError("Para publicar hace falta una evaluación sin fallos críticos y comercial ≥ 14 en todos los roles.", 409);
    }
  }
  const { error } = await s
    .from("agent_library")
    .update({ publicacion: input.publicacion, version_aprobada: input.publicacion === "publicado" ? input.version : ag.version, updated_at: new Date().toISOString(), updated_by: input.actor ?? "operador" })
    .eq("clave", input.clave);
  if (error) throw new AgentesError(error.message, 500);
}


// ---------------------------------------------------------------------
// Semillas: módulos del manual y casos de control (idempotentes)
// ---------------------------------------------------------------------
export async function sembrarModulos() {
  const s = createAdminClient();
  const filas = TODOS_LOS_MODULOS.map((m) => ({ clave: m.clave, version: 1, tipo: m.tipo, rubro_id: m.rubro ? RUBRO_IDS[m.rubro] : null, titulo: m.titulo, contenido: m.contenido, referencia: m.referencia, pertinencia: m.pertinencia }));
  const { error } = await s.from("agent_modules").upsert(filas, { onConflict: "clave,version", ignoreDuplicates: true });
  if (error) throw new AgentesError(`No se pudieron sembrar los módulos: ${error.message}`, 500);
  const { count } = await s.from("agent_modules").select("id", { count: "exact", head: true });
  return { modulos: count ?? 0 };
}

export async function sembrarCasosControl() {
  const s = createAdminClient();
  const filas = CASOS.map((c) => ({ id: c.id, familia: c.familia, rubro_id: RUBRO_IDS[c.rubro], area: c.area, modo: c.modo, titulo: c.titulo, hechos: c.hechos ?? {}, mensajes: [...(c.aperturaEnviada ? [{ rol: "asesor", texto: c.aperturaEnviada }] : []), ...c.mensajes.map((m) => ({ rol: "prospecto", texto: m }))], esperado: c.esperado, regla: c.regla, procedencia: "original", reservado: c.reservado === true }));
  const { error } = await s.from("eval_cases").upsert(filas, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new AgentesError(`No se pudieron sembrar los casos de control: ${error.message}`, 500);
  const { count } = await s.from("eval_cases").select("id", { count: "exact", head: true });
  return { casos: count ?? 0 };
}

// ---------------------------------------------------------------------
// Simulador: corrida con datos sintéticos, guardada para revisar
// ---------------------------------------------------------------------
const SLUG_POR_ID: Record<string, RubroSlug> = Object.fromEntries(Object.entries(RUBRO_IDS).map(([k, v]) => [v, k as RubroSlug]));

export async function generadorPara(proveedor: Proveedor, identificador: string | null, guion?: Record<number, any>): Promise<{ generar: Generador; identificador: string }> {
  if (proveedor === "simulado") return { generar: generadorSimulado(guion), identificador: "simulado" };
  if (proveedor === "vertex") return { generar: generadorVertex(identificador ?? ""), identificador: identificador ?? "" };
  // gemini_api: el mismo cliente que usa el agente real, con el identificador pedido o el activo.
  const info = informeModeloActivo();
  const id = identificador?.trim() || info.identificador;
  const { GoogleGenAI } = await import("@google/genai");
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const generar: Generador = async ({ contents, systemInstruction, tools }) => {
    const r: any = await client.models.generateContent({ model: id, contents: contents as any, config: { systemInstruction, tools: [{ functionDeclarations: tools as any }] } });
    return { parts: r.candidates?.[0]?.content?.parts ?? [], tokensEntrada: r.usageMetadata?.promptTokenCount ?? 0, tokensSalida: r.usageMetadata?.candidatesTokenCount ?? 0 };
  };
  return { generar, identificador: id };
}

export async function correrSimulacion(input: {
  clave: string;
  casoId?: string;
  mensajes?: string[];
  area?: Area;
  modo?: "frio" | "consulta_actual" | "seguimiento";
  variante?: "A" | "B" | "C" | "D";
  proveedor?: Proveedor;
  identificador?: string | null;
  guion?: Record<number, any>;
  fallar?: string[];
  actor?: string;
}): Promise<{ runId: string; resultado: ResultadoSimulacion; evaluacion: ReturnType<typeof evaluarSimulacion> | null; caso: CasoControl | null }> {
  const s = createAdminClient();
  const { data: ag } = await s.from("agent_library").select("*").eq("clave", input.clave).maybeSingle();
  if (!ag) throw new AgentesError("Agente no encontrado.", 404);
  const caso = input.casoId ? CASOS.find((c) => c.id === input.casoId) ?? null : null;
  if (input.casoId && !caso) throw new AgentesError("Caso no encontrado.", 404);
  const rubro: RubroSlug = caso?.rubro ?? SLUG_POR_ID[ag.rubro_id] ?? "juridico";
  const area: Area = caso?.area ?? input.area ?? (rubro === "juridico" ? "civil" : (rubro as Area));
  const modo = caso?.modo ?? input.modo ?? "consulta_actual";
  const mensajes = caso?.mensajes ?? input.mensajes ?? [];
  if (!mensajes.length) throw new AgentesError("Indicá un caso o mensajes de la persona.");
  const proveedor: Proveedor = input.proveedor ?? "simulado";
  const { generar, identificador } = await generadorPara(proveedor, input.identificador ?? null, input.guion);
  const profile = await getProfile(RUBRO_IDS[rubro]);
  const identidad = { presentationName: profile?.agent_presentation_name ?? "Asistente", brandName: profile?.brand_name ?? "la marca" };
  const { data: principal } = await s.from("agent_library").select("instrucciones, limites").eq("clave", "principal").maybeSingle();
  const variante = input.variante ?? "B";
  // A = actual observado: sin módulos organizados (solo instrucciones libres); B/C/D = contexto organizado.
  const instrucciones = [principal?.instrucciones ?? "", ag.instrucciones ?? ""].filter(Boolean).join("\n\n");
  const { data: hechosRows } = await s.from("brand_briefs").select("afirmaciones_autorizadas, servicios").eq("rubro_id", RUBRO_IDS[rubro]).maybeSingle();
  const hechosPerfil = [...((hechosRows?.afirmaciones_autorizadas as string[]) ?? []), ...((hechosRows?.servicios as string[]) ?? []).map((x) => `Servicio: ${x}`)];
  const { data: run } = await s
    .from("simulation_runs")
    .insert({ agente_clave: ag.clave, version: ag.version, rubro_id: RUBRO_IDS[rubro], area, modo, variante, modelo_proveedor: proveedor, modelo_identificador: identificador, caso_id: caso?.id ?? null, hechos: caso?.hechos ?? {}, created_by: input.actor ?? "operador" })
    .select("id")
    .single();
  const runId = run!.id as string;
  try {
    const resultado = await simularConversacion(
      {
        rubro,
        area,
        modo,
        identidad,
        instruccionesAgente: instrucciones,
        hechosPerfil,
        hechos: caso?.hechos,
        mensajesProspecto: mensajes,
        aperturaEnviada: caso?.aperturaEnviada ?? null,
        modulos: variante === "A" ? TODOS_LOS_MODULOS.filter((m) => m.tipo === "instrucciones_comunes") : TODOS_LOS_MODULOS,
        fallar: input.fallar,
      },
      generar
    );
    await s.from("simulation_turns").insert(
      resultado.turnos.map((t) => ({ run_id: runId, orden: t.orden, rol: t.rol, texto: t.texto, acciones: t.acciones, datos: t.datos, validacion: t.validacion }))
    );
    const evaluacion = caso ? evaluarSimulacion(resultado, caso.esperado) : null;
    await s
      .from("simulation_runs")
      .update({ estado: "terminada", resumen: { estado: resultado.estado, modulos: resultado.modulosUsados, evaluacion }, tokens_entrada: resultado.tokens.entrada, tokens_salida: resultado.tokens.salida, updated_at: new Date().toISOString() })
      .eq("id", runId);
    if (evaluacion && caso) {
      await sembrarCasosControl();
      await s.from("eval_results").insert({ case_id: caso.id, agente_clave: ag.clave, version: ag.version, variante, modelo_identificador: identificador, run_id: runId, controles: evaluacion.controles, comercial: evaluacion.comercial, naturalidad: evaluacion.naturalidad, fallos_criticos: evaluacion.fallos_criticos });
    }
    return { runId, resultado, evaluacion, caso };
  } catch (err: any) {
    await s.from("simulation_runs").update({ estado: "error", resumen: { error: String(err?.message ?? err) }, updated_at: new Date().toISOString() }).eq("id", runId);
    throw err;
  }
}

/** Corre un conjunto de casos (todos o por familia) y resume por rol. Con proveedor simulado no cuesta nada. */
export async function correrEvaluacion(input: { clave: string; variante?: "A" | "B" | "C" | "D"; proveedor?: Proveedor; identificador?: string | null; soloReservados?: boolean; guionPorCaso?: Record<string, Record<number, any>>; actor?: string }) {
  const casos = CASOS.filter((c) => !input.soloReservados || c.reservado);
  const porRol: Record<string, { comercial: number; naturalidad: number; casos: number; fallos: number }> = {};
  const detalle: { caso: string; comercial: number; naturalidad: number; fallos: string[]; controles: Record<string, boolean> }[] = [];
  for (const c of casos) {
    const r = await correrSimulacion({ ...input, casoId: c.id, guion: input.guionPorCaso?.[c.id] });
    const ev = r.evaluacion!;
    const rol = c.rubro;
    const acc = (porRol[rol] ??= { comercial: 0, naturalidad: 0, casos: 0, fallos: 0 });
    acc.comercial += ev.comercial;
    acc.naturalidad += ev.naturalidad;
    acc.casos += 1;
    acc.fallos += ev.fallos_criticos.length;
    detalle.push({ caso: c.id, comercial: ev.comercial, naturalidad: ev.naturalidad, fallos: ev.fallos_criticos, controles: ev.controles });
  }
  for (const v of Object.values(porRol)) {
    v.comercial = Math.round(v.comercial / Math.max(1, v.casos));
    v.naturalidad = Math.round(v.naturalidad / Math.max(1, v.casos));
  }
  const fallosCriticos = detalle.reduce((a, d) => a + d.fallos.length, 0);
  const comercialMin = Math.min(...Object.values(porRol).map((v) => v.comercial), 16);
  await createAdminClient()
    .from("agent_library")
    .update({ ultima_evaluacion: { fecha: new Date().toISOString(), variante: input.variante ?? "B", proveedor: input.proveedor ?? "simulado", porRol, fallos_criticos: fallosCriticos, comercial_min: comercialMin, casos: detalle.length } })
    .eq("clave", input.clave);
  return { porRol, fallosCriticos, comercialMin, detalle };
}

// ---------------------------------------------------------------------
// Corpus: semillas, revisión y exportación
// ---------------------------------------------------------------------
export async function sembrarCorpus(setNombre = "Piloto Etapa 3") {
  const s = createAdminClient();
  let { data: set } = await s.from("training_sets").select("id").eq("nombre", setNombre).maybeSingle();
  if (!set) ({ data: set } = await s.from("training_sets").insert({ nombre: setNombre, objetivo: "Piloto revisable antes del corpus completo", alcance: "piloto" }).select("id").single());
  const filas = CASOS.map((c) => ({
    set_id: set!.id,
    clave: c.id,
    familia: c.familia,
    rubro_id: RUBRO_IDS[c.rubro],
    area: c.area,
    modo: c.modo,
    particion: c.reservado ? "reservado" : particionPara(c.familia, c.rubro),
    hechos: c.hechos ?? {},
    mensajes: [...(c.aperturaEnviada ? [{ rol: "asesor", texto: c.aperturaEnviada }] : []), ...c.mensajes.map((m) => ({ rol: "prospecto", texto: m }))],
    respuesta_correcta: c.respuestaCorrecta,
    estado_esperado: c.esperado,
    regla: c.regla,
    procedencia: "original",
  }));
  const { error } = await s.from("training_cases").upsert(filas, { onConflict: "clave", ignoreDuplicates: true });
  if (error) throw new AgentesError(`No se pudo sembrar el corpus: ${error.message}`, 500);
  const { count } = await s.from("training_cases").select("id", { count: "exact", head: true }).eq("set_id", set!.id);
  return { setId: set!.id as string, casos: count ?? 0 };
}

export async function exportarCorpus(setId: string, particion: Particion) {
  const s = createAdminClient();
  const { data } = await s.from("training_cases").select("*").eq("set_id", setId);
  const { data: principal } = await s.from("agent_library").select("instrucciones").eq("clave", "principal").maybeSingle();
  const casos: CasoCorpus[] = (data ?? []).map((r: any) => ({
    clave: r.clave,
    familia: r.familia,
    rubro: SLUG_POR_ID[r.rubro_id] ?? "juridico",
    area: r.area,
    modo: r.modo,
    particion: r.particion,
    hechos: r.hechos,
    mensajes: r.mensajes,
    respuesta_correcta: r.respuesta_correcta,
    revision: r.revision,
    instrucciones: principal?.instrucciones || "Instrucciones comunes del principal (versión vigente).",
  }));
  const { lineas, omitidos } = exportarJsonl(casos, particion);
  const validacion = validarJsonl(lineas);
  return { lineas, omitidos, validacion, hash: hashCorpus(lineas), total: casos.length };
}

// ---------------------------------------------------------------------
// Ajuste: trabajo trazable; nunca crea nada en el proveedor sin autorización
// ---------------------------------------------------------------------
export async function prepararTrabajoAjuste(input: { setId: string; objetivo: string; modeloBase: string; estimacionUsd?: number; region?: string; actor?: string }) {
  const s = createAdminClient();
  const { data: principal } = await s.from("agent_library").select("version").eq("clave", "principal").single();
  const exp = await exportarCorpus(input.setId, "entrenamiento");
  if (!exp.validacion.ok) throw new AgentesError(`El corpus no valida: ${exp.validacion.errores.slice(0, 3).join("; ")}`, 409);
  if (exp.lineas.length === 0) throw new AgentesError("No hay casos aprobados de entrenamiento.", 409);
  const { data, error } = await s
    .from("tuning_jobs")
    .insert({ objetivo: input.objetivo, set_id: input.setId, hash_corpus: exp.hash, agente_clave: "principal", version_instrucciones: principal!.version, modelo_base: input.modeloBase, region: input.region ?? null, estimacion_usd: input.estimacionUsd ?? null, estado: "preparado", parametros: { ejemplos: exp.lineas.length } })
    .select("*")
    .single();
  if (error) throw new AgentesError(error.message, 500);
  return data;
}

export async function autorizarTrabajoAjuste(input: { jobId: string; limiteUsd: number; actor: string }) {
  const s = createAdminClient();
  if (!(input.limiteUsd > 0)) throw new AgentesError("Indicá un límite de gasto mayor a cero.");
  const { data, error } = await s
    .from("tuning_jobs")
    .update({ estado: "autorizado", limite_usd: input.limiteUsd, autorizado_por: input.actor, autorizado_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", input.jobId)
    .eq("estado", "preparado")
    .select("id")
    .maybeSingle();
  if (error) throw new AgentesError(error.message, 500);
  if (!data) throw new AgentesError("El trabajo no está en estado «preparado».", 409);
  return data;
}
