/**
 * Comparación de agentes: acciones del operador y tareas del servidor.
 *
 *  - Arrancar / detener (con PIN en la ruta). Arrancar no envía nada: solo
 *    decide qué candidato responde las conversaciones que la IA ya iba a
 *    responder (con la pausa general activa, no responde ninguno).
 *  - Voto por informe y aplicación del ganador (con requisitos y la
 *    configuración anterior guardada).
 *  - Ajuste del candidato C en Vertex: corpus, estimación, trabajo con
 *    límite de gasto y seguimiento desde el latido del servidor.
 *  - Evaluación de las plantillas propuestas con cada modelo (en cola,
 *    de a poco desde el latido).
 */
import { GoogleGenAI } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/admin";
import { RUBRO_IDS, type RubroSlug } from "@/lib/rubros";
import { configuracionVertex, generadorVertex } from "@/lib/agentes/modelo";
import { exportarCorpus, sembrarCorpus } from "@/lib/agentes/servicio";
import { crearTrabajoAjuste, estimarCostoAjuste, leerTrabajoAjuste, subirCorpus } from "@/lib/agentes/vertex";
import { PLANTILLAS_PROPUESTAS } from "@/lib/plantillas/propuestas";
import { casosDesdeConversacion, EJEMPLOS_RECOMENDADOS } from "./corpus-real";
import { ganadorPorVotos, requisitosGanador, verificarCandidatos, type Letra } from "./reglas";
import { ExperimentoError, experimentoActual, limpiarCacheExperimento, limpiarCacheGanador, registrarTurno, type CandidatoFila, type ConfiguracionGanadora } from "./servicio";

const SLUG_POR_ID: Record<string, RubroSlug> = Object.fromEntries(
  (Object.entries(RUBRO_IDS) as [RubroSlug, string][]).map(([s, id]) => [id, s])
) as Record<string, RubroSlug>;

const ahora = () => new Date().toISOString();

export async function arrancarExperimento(actor = "operador") {
  const actual = await experimentoActual();
  if (!actual) throw new ExperimentoError("No hay experimento preparado. Aplicá la migración 0310.", 409);
  const { exp, candidatos } = actual;
  if (exp.estado !== "preparado") throw new ExperimentoError(`El experimento está «${exp.estado}».`, 409);
  const listos = candidatos.filter((c) => c.estado === "listo");
  if (listos.length < 2) throw new ExperimentoError("Hacen falta al menos dos candidatos listos para comparar.", 409);
  const iguales = verificarCandidatos(listos).filter((a) => a.includes("idénticos"));
  if (iguales.length) throw new ExperimentoError(iguales.join(" "), 409);
  const s = createAdminClient();
  const { error } = await s
    .from("agent_experiments" as any)
    .update({ estado: "en_curso", inicio_at: ahora(), creado_por: actor, updated_at: ahora() })
    .eq("id", exp.id)
    .eq("estado", "preparado");
  if (error) throw new ExperimentoError(error.message, 500);
  // El equilibrio arranca hoy para los candidatos que ya estaban listos.
  await s.from("agent_experiment_candidates" as any).update({ listo_at: ahora() }).eq("experiment_id", exp.id).eq("estado", "listo");
  limpiarCacheExperimento();
  return { ok: true, candidatos: listos.map((c) => c.letra) };
}

export async function detenerExperimento(motivo: string) {
  const actual = await experimentoActual();
  if (!actual || actual.exp.estado !== "en_curso") throw new ExperimentoError("No hay un experimento en curso.", 409);
  const { error } = await createAdminClient()
    .from("agent_experiments" as any)
    .update({ estado: "cancelado", fin_at: ahora(), motivo_cierre: motivo.slice(0, 500) || "Detenido por la responsable", updated_at: ahora() })
    .eq("id", actual.exp.id);
  if (error) throw new ExperimentoError(error.message, 500);
  limpiarCacheExperimento();
  return { ok: true };
}

/** Cambia un candidato: modelo, tarifas o estado (reactivar uno detenido / dejar listo). */
export async function actualizarCandidato(input: { letra: Letra; modelo?: string | null; precioEntrada?: number | null; precioSalida?: number | null; estado?: "listo" | "pendiente" | "detenido"; motivo?: string }) {
  const actual = await experimentoActual();
  if (!actual) throw new ExperimentoError("No hay experimento.", 409);
  const c = actual.candidatos.find((x) => x.letra === input.letra);
  if (!c) throw new ExperimentoError("Candidato inexistente.", 404);
  const cambios: Record<string, unknown> = { updated_at: ahora() };
  if (input.modelo !== undefined) cambios.modelo = input.modelo?.trim() || null;
  if (input.precioEntrada !== undefined) cambios.precio_entrada_millon = input.precioEntrada;
  if (input.precioSalida !== undefined) cambios.precio_salida_millon = input.precioSalida;
  if (input.estado) {
    const modelo = (cambios.modelo as string | null | undefined) ?? c.modelo;
    if (input.estado === "listo" && !modelo) throw new ExperimentoError("Para dejarlo listo hace falta un modelo.", 409);
    if (input.estado === "listo" && c.proveedor === "vertex" && !configuracionVertex().configurado) {
      throw new ExperimentoError(`Faltan variables de Vertex: ${configuracionVertex().faltan.join(", ")}.`, 409);
    }
    cambios.estado = input.estado;
    if (input.estado === "listo") Object.assign(cambios, { listo_at: ahora(), detenido_at: null, detenido_motivo: null });
    if (input.estado === "detenido") Object.assign(cambios, { detenido_at: ahora(), detenido_motivo: input.motivo ?? "Detenido por la responsable" });
  }
  const { error } = await createAdminClient().from("agent_experiment_candidates" as any).update(cambios).eq("id", c.id);
  if (error) throw new ExperimentoError(error.message, 500);
  limpiarCacheExperimento();
  return { ok: true };
}

export async function votar(input: { reportId: string; candidato: Letra; nota?: string; actor?: string }) {
  const s = createAdminClient();
  const { data: rep } = await s.from("agent_experiment_reports" as any).select("id").eq("id", input.reportId).maybeSingle();
  if (!rep) throw new ExperimentoError("Informe inexistente.", 404);
  const { error } = await s.from("agent_experiment_votes" as any).insert({ report_id: input.reportId, candidato: input.candidato, nota: input.nota?.slice(0, 1000) ?? null, votado_por: input.actor ?? "operador" });
  if (error) throw new ExperimentoError(/duplicate|unique/i.test(error.message) ? "Este informe ya tiene su voto." : error.message, 409);
  return { ok: true };
}

export async function resultadoVotos(experimentId: string) {
  const s = createAdminClient();
  const { data: reps } = await s.from("agent_experiment_reports" as any).select("id").eq("experiment_id", experimentId);
  const ids = ((reps ?? []) as any[]).map((r) => r.id);
  if (!ids.length) return ganadorPorVotos([]);
  const { data: votos } = await s.from("agent_experiment_votes" as any).select("candidato").in("report_id", ids);
  return ganadorPorVotos(((votos ?? []) as any[]).map((v) => v.candidato as Letra));
}

/**
 * Aplica el ganador al cierre: por votos o, si hubo empate o faltan votos,
 * por la decisión explícita de la responsable (`decision`). Guarda la
 * configuración anterior para volver atrás.
 */
export async function aplicarGanador(input: { decision?: Letra | null; actor?: string }) {
  const actual = await experimentoActual();
  if (!actual) throw new ExperimentoError("No hay experimento.", 409);
  const { exp, candidatos } = actual;
  if (exp.estado !== "finalizado") throw new ExperimentoError("El ganador se aplica cuando terminan las semanas del experimento.", 409);
  const votos = await resultadoVotos(exp.id);
  const letra = votos.ganador ?? input.decision ?? null;
  if (!letra) throw new ExperimentoError(`Hace falta tu decisión: ${votos.motivo}`, 409);
  const c = candidatos.find((x) => x.letra === letra);
  const s = createAdminClient();
  const { count } = await s.from("agent_incidents" as any).select("id", { count: "exact", head: true }).eq("experiment_id", exp.id).eq("candidato", letra).eq("gravedad", "fatal").is("resuelto_at", null);
  const faltan = requisitosGanador(c, count ?? 0, { vertex: configuracionVertex().configurado });
  if (faltan.length) throw new ExperimentoError(`No se puede aplicar ${letra}: ${faltan.join(" ")}`, 409);
  const { data: previo } = await s.from("system_settings").select("value").eq("key", "agente_ganador").maybeSingle();
  const valor: ConfiguracionGanadora = {
    letra,
    proveedor: c!.proveedor,
    modelo: c!.modelo!,
    contexto: c!.contexto,
    precio_entrada_millon: c!.precio_entrada_millon ?? null,
    precio_salida_millon: c!.precio_salida_millon ?? null,
    aplicado_at: ahora(),
  };
  const { error } = await s.from("system_settings").upsert({ key: "agente_ganador", value: { ...valor, by: input.actor ?? "operador" } }, { onConflict: "key" });
  if (error) throw new ExperimentoError(error.message, 500);
  await s
    .from("agent_experiments" as any)
    .update({ ganador: letra, ganador_aplicado_at: ahora(), configuracion_anterior: { agente_ganador: (previo as any)?.value ?? null, gemini_model: process.env.GEMINI_MODEL ?? null }, updated_at: ahora() })
    .eq("id", exp.id);
  limpiarCacheGanador();
  return { ok: true, ganador: letra, porVotos: !!votos.ganador };
}

// ---------------------------------------------------------------------
// Ajuste del candidato C (Vertex)
// ---------------------------------------------------------------------
const SET_AJUSTE = "Ajuste C · comparación de agentes";
export const LIMITE_AJUSTE_USD = 30;
const EPOCAS = 3;

/** Importa las conversaciones reales autorizadas al corpus del ajuste (idempotente). */
export async function importarConversacionesReales(): Promise<{ setId: string; conversaciones: number; ejemplos: number }> {
  const s = createAdminClient();
  await sembrarCorpus(SET_AJUSTE);
  const { data: set } = await s.from("training_sets").select("id").eq("nombre", SET_AJUSTE).single();
  const setId = (set as any).id as string;
  const { data: convs } = await s.from("conversations").select("id, area, contacts(rubro_id)").limit(5000);
  let conversaciones = 0;
  let ejemplos = 0;
  for (const c of (convs ?? []) as any[]) {
    const { data: msgs } = await s.from("messages").select("direction, body, sender_type").eq("conversation_id", c.id).order("created_at", { ascending: true }).limit(80);
    const lista = (msgs ?? []) as any[];
    if (!lista.some((m) => m.direction === "entrante") || !lista.some((m) => m.direction === "saliente")) continue;
    const rubro = SLUG_POR_ID[c.contacts?.rubro_id] ?? (c.area === "civil" || c.area === "penal" ? "juridico" : c.area);
    const casos = casosDesdeConversacion({ conversationId: c.id, rubro, mensajes: lista });
    if (!casos.length) continue;
    conversaciones++;
    const filas = casos.map((k) => ({
      set_id: setId,
      clave: k.clave,
      familia: k.familia,
      rubro_id: RUBRO_IDS[rubro as RubroSlug] ?? null,
      area: c.area,
      modo: "consulta_actual",
      particion: k.particion,
      mensajes: k.mensajes,
      respuesta_correcta: k.respuesta_correcta,
      procedencia: "real_anonimizada",
      revision: "aprobado",
      revisado_por: "autorizacion_responsable_16_10",
      revisado_at: ahora(),
    }));
    const { error } = await s.from("training_cases").upsert(filas, { onConflict: "clave", ignoreDuplicates: true });
    if (!error) ejemplos += filas.length;
  }
  return { setId, conversaciones, ejemplos };
}

export interface EstimacionAjuste {
  listo: boolean;
  setId?: string;
  ejemplos: number;
  epocas?: number;
  tokens: number;
  usd: number;
  aviso: string | null;
  errores?: string[];
}

export async function estimarAjusteC(): Promise<EstimacionAjuste> {
  const s = createAdminClient();
  const { data: set } = await s.from("training_sets").select("id").eq("nombre", SET_AJUSTE).maybeSingle();
  if (!set) return { listo: false, ejemplos: 0, tokens: 0, usd: 0, aviso: "Primero importá el corpus." };
  const exp = await exportarCorpus((set as any).id, "entrenamiento");
  const est = estimarCostoAjuste(exp.lineas, EPOCAS);
  return {
    listo: exp.validacion.ok && exp.lineas.length > 0,
    setId: (set as any).id as string,
    ejemplos: exp.lineas.length,
    epocas: EPOCAS,
    ...est,
    aviso: exp.lineas.length < EJEMPLOS_RECOMENDADOS ? `Hay ${exp.lineas.length} ejemplos aprobados; Vertex recomienda al menos ${EJEMPLOS_RECOMENDADOS}.` : null,
    errores: exp.validacion.errores.slice(0, 3),
  };
}

/** Lanza el ajuste con el límite autorizado (USD 30). Requiere PIN en la ruta. */
export async function lanzarAjusteC(actor = "operador") {
  const cfg = configuracionVertex();
  if (!cfg.configurado) throw new ExperimentoError(`Faltan variables de Vertex: ${cfg.faltan.join(", ")}.`, 409);
  if (!(process.env.GCP_BUCKET ?? "").trim()) throw new ExperimentoError("Falta GCP_BUCKET (bucket de Cloud Storage para el corpus).", 409);
  const actual = await experimentoActual();
  const c = actual?.candidatos.find((x) => x.letra === "C");
  if (!actual || !c) throw new ExperimentoError("No está el candidato C.", 409);
  const s = createAdminClient();
  if (c.tuning_job_id) {
    const { data: j } = await s.from("tuning_jobs").select("estado").eq("id", c.tuning_job_id).maybeSingle();
    if (j && ["enviando", "en_curso", "completado", "aprobado"].includes((j as any).estado)) throw new ExperimentoError(`Ya hay un ajuste «${(j as any).estado}».`, 409);
  }
  const est = await estimarAjusteC();
  if (!est.listo || !est.setId) throw new ExperimentoError(`El corpus no está listo. ${est.aviso ?? ""} ${(est.errores ?? []).join("; ")}`, 409);
  if (est.usd > LIMITE_AJUSTE_USD) throw new ExperimentoError(`La estimación (USD ${est.usd}) supera el límite autorizado de USD ${LIMITE_AJUSTE_USD}.`, 409);
  const modeloBase = (process.env.GCP_TUNING_BASE_MODEL ?? "gemini-3.5-flash").trim();
  const entrenamiento = await exportarCorpus(est.setId, "entrenamiento");
  const validacion = await exportarCorpus(est.setId, "validacion");
  const { data: principal } = await s.from("agent_library").select("version").eq("clave", "principal").maybeSingle();
  const { data: job, error } = await s
    .from("tuning_jobs")
    .insert({
      objetivo: "Candidato C de la comparación de agentes",
      set_id: est.setId,
      hash_corpus: entrenamiento.hash,
      agente_clave: "principal",
      version_instrucciones: (principal as any)?.version ?? 1,
      modelo_base: modeloBase,
      proyecto_gcp: process.env.GCP_PROJECT_ID,
      region: process.env.GCP_REGION,
      parametros: { ejemplos: entrenamiento.lineas.length, validacion: validacion.lineas.length, epocas: EPOCAS },
      estimacion_usd: est.usd,
      limite_usd: LIMITE_AJUSTE_USD,
      autorizado_por: actor,
      autorizado_at: ahora(),
      estado: "enviando",
    })
    .select("id")
    .single();
  if (error) throw new ExperimentoError(error.message, 500);
  const jobId = (job as any).id as string;
  await s.from("agent_experiment_candidates" as any).update({ tuning_job_id: jobId, updated_at: ahora() }).eq("id", c.id);
  try {
    const sello = new Date().toISOString().replace(/[:.]/g, "-");
    const uriE = await subirCorpus(`crm/ajuste-c/${sello}/entrenamiento.jsonl`, entrenamiento.lineas);
    const uriV = validacion.lineas.length ? await subirCorpus(`crm/ajuste-c/${sello}/validacion.jsonl`, validacion.lineas) : null;
    const trabajo = await crearTrabajoAjuste({ modeloBase, entrenamiento: uriE, validacion: uriV, epocas: EPOCAS, nombre: `crm-candidato-c-${sello}`.slice(0, 120) });
    await s.from("tuning_jobs").update({ estado: "en_curso", proveedor_job_id: trabajo.name, resultado: { entrenamiento: uriE, validacion: uriV }, updated_at: ahora() }).eq("id", jobId);
    return { ok: true, jobId, trabajo: trabajo.name, estimacionUsd: est.usd };
  } catch (err: any) {
    await s.from("tuning_jobs").update({ estado: "fallido", diagnostico: String(err?.message ?? err).slice(0, 1000), updated_at: ahora() }).eq("id", jobId);
    throw new ExperimentoError(`Vertex no aceptó el ajuste: ${err?.message ?? err}`, 502);
  }
}

/** Latido: consulta el ajuste en curso y, al terminar, deja a C listo con su endpoint. */
export async function revisarAjusteC(): Promise<string> {
  const actual = await experimentoActual();
  const c = actual?.candidatos.find((x) => x.letra === "C");
  if (!c?.tuning_job_id) return "sin_ajuste";
  const s = createAdminClient();
  const { data: job } = await s.from("tuning_jobs").select("id, estado, proveedor_job_id").eq("id", c.tuning_job_id).maybeSingle();
  if (!job || (job as any).estado !== "en_curso" || !(job as any).proveedor_job_id) return (job as any)?.estado ?? "sin_ajuste";
  if (!configuracionVertex().configurado) return "sin_variables";
  const t = await leerTrabajoAjuste((job as any).proveedor_job_id);
  if (t.state === "JOB_STATE_SUCCEEDED" && t.tunedModel?.endpoint) {
    await s.from("tuning_jobs").update({ estado: "completado", modelo_resultado: t.tunedModel.model ?? null, endpoint_resultado: t.tunedModel.endpoint, updated_at: ahora() }).eq("id", (job as any).id);
    await s.from("agent_experiment_candidates" as any).update({ modelo: t.tunedModel.endpoint, estado: "listo", listo_at: ahora(), updated_at: ahora() }).eq("id", c.id).eq("estado", "pendiente");
    limpiarCacheExperimento();
    return "completado";
  }
  if (t.state === "JOB_STATE_FAILED" || t.state === "JOB_STATE_CANCELLED") {
    await s.from("tuning_jobs").update({ estado: t.state === "JOB_STATE_FAILED" ? "fallido" : "cancelado", diagnostico: t.error?.message ?? t.state, updated_at: ahora() }).eq("id", (job as any).id);
    return "fallido";
  }
  return t.state ?? "en_curso";
}

// ---------------------------------------------------------------------
// Evaluación de plantillas con cada modelo (cola en el latido)
// ---------------------------------------------------------------------
const RUBRICA = `Sos evaluador de plantillas de WhatsApp Business para un CRM argentino (español rioplatense, voseo).
Evaluá la plantilla con estos criterios, de 1 a 5: claridad (se entiende en 5 segundos), cumplimiento (no promete resultados, no inventa datos, no afirma investigación previa, permite decir que no, respeta las reglas de Meta), tono (cordial, breve, natural), respuesta_esperada (probabilidad de que la persona responda). Riesgo de bloqueo o reporte: bajo, medio o alto.
Respondé SOLO un JSON: {"claridad":n,"cumplimiento":n,"tono":n,"respuesta_esperada":n,"riesgo":"bajo|medio|alto","comentario":"una oración","sugerencia":"texto mejorado o vacío"}`;

function promptPlantilla(p: (typeof PLANTILLAS_PROPUESTAS)[number]): string {
  return `${RUBRICA}\n\nPerfil: ${p.rubro}\nPropósito: ${p.proposito}\nCategoría Meta: ${p.categoria}\nTexto: ${p.cuerpo}\nBotones: ${p.botones.join(" | ") || "ninguno"}`;
}

function parsearEvaluacion(txt: string): { puntajes: Record<string, unknown>; comentario: string | null; sugerencia: string | null } | null {
  const m = txt.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]);
    const n = (v: unknown) => (typeof v === "number" && v >= 1 && v <= 5 ? Math.round(v) : null);
    return {
      puntajes: { claridad: n(j.claridad), cumplimiento: n(j.cumplimiento), tono: n(j.tono), respuesta_esperada: n(j.respuesta_esperada), riesgo: ["bajo", "medio", "alto"].includes(j.riesgo) ? j.riesgo : null },
      comentario: typeof j.comentario === "string" ? j.comentario.slice(0, 500) : null,
      sugerencia: typeof j.sugerencia === "string" && j.sugerencia.trim() ? j.sugerencia.slice(0, 1000) : null,
    };
  } catch {
    return null;
  }
}

async function generarConCandidato(c: CandidatoFila, prompt: string): Promise<{ texto: string; entrada: number; salida: number; modeloRespuesta: string | null }> {
  if (c.proveedor === "vertex") {
    const r = await generadorVertex(c.modelo ?? "")({ contents: [{ role: "user", parts: [{ text: prompt }] }], systemInstruction: "Respondé solo JSON.", tools: [] });
    return { texto: r.parts.map((p) => p.text ?? "").join(""), entrada: r.tokensEntrada ?? 0, salida: r.tokensSalida ?? 0, modeloRespuesta: c.modelo };
  }
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const r: any = await ai.models.generateContent({ model: c.modelo ?? "", contents: [{ role: "user", parts: [{ text: prompt }] }] });
  const u = r.usageMetadata ?? {};
  return {
    texto: (r.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? "").join(""),
    entrada: u.promptTokenCount ?? 0,
    salida: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0),
    modeloRespuesta: r.modelVersion ?? null,
  };
}

export async function pedirEvaluacionPlantillas(actor = "operador") {
  const { error } = await createAdminClient().from("system_settings").upsert({ key: "evaluacion_plantillas", value: { pedido_at: ahora(), by: actor } }, { onConflict: "key" });
  if (error) throw new ExperimentoError(error.message, 500);
  return { ok: true, plantillas: PLANTILLAS_PROPUESTAS.length };
}

/** Latido: evalúa hasta `limite` pares plantilla × candidato pendientes. */
export async function evaluarPlantillasPendientes(limite = 4): Promise<{ evaluadas: number; pendientes: number }> {
  const s = createAdminClient();
  const { data: pedido } = await s.from("system_settings").select("value").eq("key", "evaluacion_plantillas").maybeSingle();
  if (!(pedido as any)?.value?.pedido_at) return { evaluadas: 0, pendientes: 0 };
  const actual = await experimentoActual();
  if (!actual) return { evaluadas: 0, pendientes: 0 };
  const cands = actual.candidatos.filter((c) => c.estado === "listo" && c.modelo);
  const { data: hechas } = await s.from("template_evaluations" as any).select("plantilla, candidato, modelo").eq("experiment_id", actual.exp.id).limit(5000);
  const ya = new Set(((hechas ?? []) as any[]).map((h) => `${h.plantilla}|${h.candidato}|${h.modelo}`));
  const pendientes = PLANTILLAS_PROPUESTAS.flatMap((p) => cands.map((c) => ({ p, c }))).filter(({ p, c }) => !ya.has(`${p.nombre}|${c.letra}|${c.modelo}`));
  let evaluadas = 0;
  for (const { p, c } of pendientes.slice(0, limite)) {
    const t0 = Date.now();
    try {
      const r = await generarConCandidato(c, promptPlantilla(p));
      const ev = parsearEvaluacion(r.texto);
      await s.from("template_evaluations" as any).insert({
        experiment_id: actual.exp.id,
        candidato: c.letra,
        modelo: c.modelo,
        plantilla: p.nombre,
        rubro_slug: p.rubro,
        proposito: p.proposito,
        puntajes: ev?.puntajes ?? { error: "respuesta sin JSON" },
        comentario: ev?.comentario ?? r.texto.slice(0, 300),
        sugerencia: ev?.sugerencia ?? null,
      });
      await registrarTurno({ experimentId: actual.exp.id, candidato: c.letra, precio: c, opportunityId: null, conversationId: null, rubroId: RUBRO_IDS[p.rubro as RubroSlug] ?? null, proveedor: c.proveedor, modeloPedido: c.modelo ?? "", modeloRespuesta: r.modeloRespuesta, llamadas: 1, tokensEntrada: r.entrada, tokensSalida: r.salida, tokensRazonamiento: 0, latenciaMs: Date.now() - t0, herramientas: [], resultado: "enviado", uso: "evaluacion_plantillas" });
      evaluadas++;
    } catch (err: any) {
      await registrarTurno({ experimentId: actual.exp.id, candidato: c.letra, precio: c, opportunityId: null, conversationId: null, rubroId: null, proveedor: c.proveedor, modeloPedido: c.modelo ?? "", modeloRespuesta: null, llamadas: 1, tokensEntrada: 0, tokensSalida: 0, tokensRazonamiento: 0, latenciaMs: Date.now() - t0, herramientas: [], resultado: "error", error: String(err?.message ?? err), uso: "evaluacion_plantillas" });
      break;
    }
  }
  return { evaluadas, pendientes: Math.max(0, pendientes.length - evaluadas) };
}

export { parsearEvaluacion as _parsearEvaluacion };
