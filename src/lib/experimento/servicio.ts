/**
 * Comparación de agentes A/B/C: acceso a datos (servidor, clave de servicio).
 * Las decisiones están en ./reglas.ts (puras y probadas).
 *
 * Nada de este módulo envía mensajes ni arranca campañas: solo decide qué
 * candidato responde una conversación que ya iba a responder la IA,
 * registra el turno y genera informes.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { RUBRO_IDS, type RubroSlug } from "@/lib/rubros";
import {
  calcularMetricas,
  candidatoEfectivo,
  candidatosListos,
  canalDe,
  costoTurno,
  desdeEquilibrio,
  elegirCandidato,
  enVentana,
  estratoDe,
  informesVencidos,
  recomendar,
  verificarCandidatos,
  type CandidatoExp,
  type FilaIncidente,
  type FilaOportunidad,
  type FilaTurno,
  type Letra,
} from "./reglas";

export class ExperimentoError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "ExperimentoError";
  }
}

const SLUG_POR_ID: Record<string, RubroSlug> = Object.fromEntries(
  (Object.entries(RUBRO_IDS) as [RubroSlug, string][]).map(([s, id]) => [id, s])
) as Record<string, RubroSlug>;

export interface Experimento {
  id: string;
  nombre: string;
  estado: "preparado" | "en_curso" | "finalizado" | "cancelado";
  semanas: number;
  alcance: { perfiles?: string[]; canales?: string[] };
  inicio_at: string | null;
  fin_at: string | null;
  ganador: string | null;
  ganador_aplicado_at: string | null;
}

export type CandidatoFila = CandidatoExp & { id: string; nombre: string; descripcion: string | null; tuning_job_id: string | null; detenido_motivo: string | null };

let _cache: { t: number; valor: { exp: Experimento; candidatos: CandidatoFila[] } | null } | null = null;

/** Experimento en curso (con 30 s de caché por instancia) o null. */
export async function experimentoEnCurso(fresco = false): Promise<{ exp: Experimento; candidatos: CandidatoFila[] } | null> {
  if (!fresco && _cache && Date.now() - _cache.t < 30_000) return _cache.valor;
  const s = createAdminClient();
  const { data: exp } = await s.from("agent_experiments" as any).select("*").eq("estado", "en_curso").maybeSingle();
  let valor = null;
  if (exp) {
    const { data: cands } = await s.from("agent_experiment_candidates" as any).select("*").eq("experiment_id", (exp as any).id).order("letra");
    valor = { exp: exp as unknown as Experimento, candidatos: (cands ?? []) as unknown as CandidatoFila[] };
  }
  _cache = { t: Date.now(), valor };
  return valor;
}

export function limpiarCacheExperimento() {
  _cache = null;
}

/** Último experimento (en curso, preparado o finalizado) con candidatos. */
export async function experimentoActual(): Promise<{ exp: Experimento; candidatos: CandidatoFila[] } | null> {
  const s = createAdminClient();
  const { data: exps } = await s.from("agent_experiments" as any).select("*").order("created_at", { ascending: false }).limit(1);
  const exp = (exps ?? [])[0] as unknown as Experimento | undefined;
  if (!exp) return null;
  const { data: cands } = await s.from("agent_experiment_candidates" as any).select("*").eq("experiment_id", exp.id).order("letra");
  return { exp, candidatos: (cands ?? []) as unknown as CandidatoFila[] };
}

export interface CandidatoTurno {
  experimentId: string;
  asignado: Letra;
  letra: Letra;
  reemplazo: boolean;
  candidato: CandidatoFila;
}

/**
 * Candidato para la oportunidad de esta conversación. Si no hay
 * experimento en curso, o el perfil/canal no participa, devuelve null y el
 * agente responde exactamente como hoy.
 */
export async function candidatoParaOportunidad(opportunityId: string): Promise<CandidatoTurno | null> {
  const enCurso = await experimentoEnCurso();
  if (!enCurso || !enCurso.exp.inicio_at) return null;
  const { exp, candidatos } = enCurso;
  const s = createAdminClient();

  const { data: previa } = await s
    .from("agent_experiment_assignments" as any)
    .select("candidato")
    .eq("experiment_id", exp.id)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();
  let asignado = ((previa as any)?.candidato ?? null) as Letra | null;

  if (!asignado) {
    const { data: opp } = await s
      .from("opportunities")
      .select("id, rubro_id, area, campaign_id, imported_base_id, origin_source, first_source")
      .eq("id", opportunityId)
      .maybeSingle();
    if (!opp) return null;
    const rubro = SLUG_POR_ID[(opp as any).rubro_id];
    const canal = canalDe({ campaignId: (opp as any).campaign_id, importedBaseId: (opp as any).imported_base_id, origen: (opp as any).origin_source });
    const perfiles = exp.alcance?.perfiles ?? [];
    const canales = exp.alcance?.canales ?? [];
    if (!rubro || (perfiles.length && !perfiles.includes(rubro)) || (canales.length && !canales.includes(canal))) return null;
    const estrato = estratoDe({ rubro, fuente: (opp as any).first_source ?? (opp as any).origin_source, canal });
    const listos = candidatosListos(candidatos).map((c) => c.letra);
    const desde = desdeEquilibrio(candidatos, exp.inicio_at!);
    const { data: filas } = await s
      .from("agent_experiment_assignments" as any)
      .select("candidato")
      .eq("experiment_id", exp.id)
      .eq("estrato", estrato)
      .gte("asignado_at", desde)
      .limit(5000);
    const conteo: Partial<Record<Letra, number>> = {};
    for (const f of (filas ?? []) as any[]) conteo[f.candidato as Letra] = (conteo[f.candidato as Letra] ?? 0) + 1;
    const elegido = elegirCandidato(opportunityId, listos, conteo);
    if (!elegido) return null;
    const { error } = await s.from("agent_experiment_assignments" as any).insert({
      experiment_id: exp.id,
      opportunity_id: opportunityId,
      rubro_id: (opp as any).rubro_id,
      candidato: elegido,
      estrato,
      canal,
    });
    if (error) {
      // Carrera: otra instancia asignó primero; se usa esa asignación (fija).
      const { data: ya } = await s.from("agent_experiment_assignments" as any).select("candidato").eq("experiment_id", exp.id).eq("opportunity_id", opportunityId).maybeSingle();
      asignado = ((ya as any)?.candidato ?? null) as Letra | null;
    } else {
      asignado = elegido;
    }
  }
  if (!asignado) return null;
  const ef = candidatoEfectivo(asignado, candidatos);
  if (!ef.letra) return null;
  const candidato = candidatos.find((c) => c.letra === ef.letra)!;
  return { experimentId: exp.id, asignado, letra: ef.letra, reemplazo: ef.reemplazo, candidato };
}

export interface RegistroTurno {
  experimentId: string | null;
  candidato: Letra | null;
  precio?: Pick<CandidatoExp, "precio_entrada_millon" | "precio_salida_millon"> | null;
  opportunityId: string | null;
  conversationId: string | null;
  rubroId: string | null;
  proveedor: string;
  modeloPedido: string;
  modeloRespuesta: string | null;
  llamadas: number;
  tokensEntrada: number;
  tokensSalida: number;
  tokensRazonamiento: number;
  latenciaMs: number;
  herramientas: string[];
  resultado: "enviado" | "retenido" | "sin_texto" | "bloqueado" | "error";
  motivos?: string[];
  error?: string | null;
  uso?: "conversacion" | "analisis" | "evaluacion_plantillas";
  /** 25/10: versión del conocimiento del bot y fichas usadas en la respuesta. */
  knowledgeVersion?: number | null;
  knowledgeItems?: string[];
}

/** Registra un turno; nunca interrumpe la respuesta si falla el registro. */
export async function registrarTurno(r: RegistroTurno): Promise<void> {
  try {
    const s = createAdminClient();
    await s.from("agent_turn_logs" as any).insert({
      experiment_id: r.experimentId,
      candidato: r.candidato,
      opportunity_id: r.opportunityId,
      conversation_id: r.conversationId,
      rubro_id: r.rubroId,
      proveedor: r.proveedor,
      modelo_pedido: r.modeloPedido,
      modelo_respuesta: r.modeloRespuesta,
      llamadas: r.llamadas,
      tokens_entrada: r.tokensEntrada,
      tokens_salida: r.tokensSalida,
      tokens_razonamiento: r.tokensRazonamiento,
      costo_usd: r.precio ? costoTurno(r.precio, r.tokensEntrada, r.tokensSalida + r.tokensRazonamiento) : null,
      latencia_ms: r.latenciaMs,
      herramientas: r.herramientas,
      resultado: r.resultado,
      validador_motivos: r.motivos ?? [],
      error: r.error ? String(r.error).slice(0, 500) : null,
      uso: r.uso ?? "conversacion",
      ...(r.knowledgeVersion != null ? { knowledge_version: r.knowledgeVersion, knowledge_items: r.knowledgeItems ?? [] } : {}),
    });
  } catch (err) {
    console.error("[experimento] No se pudo registrar el turno:", err);
  }
}

/**
 * Incidente. Un fallo fatal detiene al candidato: sus oportunidades pasan a
 * responder con el bot actual (A) y queda registrado. Si el fatal es de A,
 * A se detiene y esas conversaciones quedan para atención humana.
 */
export async function registrarIncidente(input: {
  experimentId: string | null;
  candidato: Letra | null;
  gravedad: "fatal" | "grave" | "leve";
  tipo: string;
  detalle: string;
  opportunityId?: string | null;
  conversationId?: string | null;
}): Promise<void> {
  const s = createAdminClient();
  let detenido = false;
  if (input.gravedad === "fatal" && input.experimentId && input.candidato) {
    const { data } = await s
      .from("agent_experiment_candidates" as any)
      .update({ estado: "detenido", detenido_at: new Date().toISOString(), detenido_motivo: `${input.tipo}: ${input.detalle}`.slice(0, 500), updated_at: new Date().toISOString() })
      .eq("experiment_id", input.experimentId)
      .eq("letra", input.candidato)
      .neq("estado", "detenido")
      .select("id");
    detenido = (data ?? []).length > 0;
    limpiarCacheExperimento();
  }
  await s.from("agent_incidents" as any).insert({
    experiment_id: input.experimentId,
    candidato: input.candidato,
    gravedad: input.gravedad,
    tipo: input.tipo,
    detalle: input.detalle.slice(0, 2000),
    opportunity_id: input.opportunityId ?? null,
    conversation_id: input.conversationId ?? null,
    candidato_detenido: detenido,
  });
}

// ---------------------------------------------------------------------
// Datos para métricas e informes
// ---------------------------------------------------------------------
async function paginar<T>(armar: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null }>, tope = 50_000): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < tope; i += 1000) {
    const { data } = await armar(i, i + 999);
    const filas = data ?? [];
    out.push(...filas);
    if (filas.length < 1000) break;
  }
  return out;
}

export interface DatosExperimento {
  ops: FilaOportunidad[];
  turnos: FilaTurno[];
  incidentes: (FilaIncidente & { created_at: string })[];
  modelosInformados: Partial<Record<Letra, string[]>>;
}

export async function cargarDatos(experimentId: string): Promise<DatosExperimento> {
  const s = createAdminClient();
  const asign = await paginar<any>((a, b) =>
    s.from("agent_experiment_assignments" as any).select("opportunity_id, candidato, rubro_id, asignado_at").eq("experiment_id", experimentId).order("asignado_at").range(a, b) as any
  );
  const ids = asign.map((x) => x.opportunity_id);
  const opps: Record<string, any> = {};
  const contactos: string[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await s
      .from("opportunities")
      .select("id, contact_id, conversation_id, contact_state, capture_state, derivation_state, attention_state, historical_result")
      .in("id", ids.slice(i, i + 200));
    for (const o of data ?? []) {
      opps[(o as any).id] = o;
      contactos.push((o as any).contact_id);
    }
  }
  const detenciones: Record<string, { baja: boolean }> = {};
  const citas = new Set<string>();
  const mk: Record<string, any> = {};
  for (let i = 0; i < contactos.length; i += 200) {
    const lote = contactos.slice(i, i + 200);
    const { data: det } = await s.from("contact_detentions").select("contact_id, motive").in("contact_id", lote).eq("status", "vigente");
    for (const d of det ?? []) detenciones[(d as any).contact_id] = { baja: (d as any).motive === "no_contacto" };
    const { data: ap } = await s.from("appointments").select("contact_id").in("contact_id", lote);
    for (const x of ap ?? []) citas.add((x as any).contact_id);
    const { data: ml } = await s.from("marketing_leads").select("contact_id, sale_stage, outreach_status").in("contact_id", lote);
    for (const x of ml ?? []) mk[(x as any).contact_id] = x;
  }
  const ops: FilaOportunidad[] = asign
    .filter((a) => opps[a.opportunity_id])
    .map((a) => {
      const o = opps[a.opportunity_id];
      const m = mk[o.contact_id];
      const etapa: string | null = m?.sale_stage ?? null;
      return {
        id: a.opportunity_id,
        contact_id: o.contact_id,
        conversation_id: o.conversation_id,
        candidato: a.candidato,
        rubro: SLUG_POR_ID[a.rubro_id] ?? "sin_perfil",
        asignado_at: a.asignado_at,
        contact_state: o.contact_state,
        capture_state: o.capture_state,
        derivation_state: o.derivation_state,
        attention_state: o.attention_state,
        historical_result: o.historical_result,
        detenida: !!detenciones[o.contact_id],
        baja: !!detenciones[o.contact_id]?.baja,
        cita: citas.has(o.contact_id),
        fase: etapa && etapa !== "apertura" ? etapa : null,
        presupuesto_pedido: !!etapa && ["presupuesto_pedido", "presupuesto_enviado", "cerrado"].includes(etapa),
        cerrado: etapa === "cerrado",
      };
    });
  const turnosRaw = await paginar<any>((a, b) =>
    s
      .from("agent_turn_logs" as any)
      .select("candidato, rubro_id, resultado, latencia_ms, tokens_entrada, tokens_salida, costo_usd, uso, created_at, modelo_respuesta")
      .eq("experiment_id", experimentId)
      .order("created_at")
      .range(a, b) as any
  );
  const modelosInformados: Partial<Record<Letra, string[]>> = {};
  for (const t of turnosRaw) {
    if (!t.candidato || !t.modelo_respuesta) continue;
    const l = t.candidato as Letra;
    modelosInformados[l] ??= [];
    if (!modelosInformados[l]!.includes(t.modelo_respuesta)) modelosInformados[l]!.push(t.modelo_respuesta);
  }
  const turnos: FilaTurno[] = turnosRaw
    .filter((t) => t.candidato)
    .map((t) => ({ ...t, rubro: SLUG_POR_ID[t.rubro_id] ?? "sin_perfil", costo_usd: t.costo_usd == null ? null : Number(t.costo_usd) }));
  const { data: inc } = await s.from("agent_incidents" as any).select("candidato, gravedad, created_at, opportunity_id").eq("experiment_id", experimentId).limit(5000);
  const rubroDeOpp: Record<string, string> = Object.fromEntries(ops.map((o) => [o.id, o.rubro]));
  const incidentes = ((inc ?? []) as any[]).map((i) => ({ candidato: i.candidato, gravedad: i.gravedad, created_at: i.created_at, rubro: i.opportunity_id ? rubroDeOpp[i.opportunity_id] ?? null : null }));
  return { ops, turnos, incidentes, modelosInformados };
}

/** Costo de entrenamiento (separado de la operación): trabajos de ajuste del candidato C. */
export async function costoEntrenamiento(candidatos: CandidatoFila[]): Promise<{ usd: number | null; estimado: boolean }> {
  const ids = candidatos.map((c) => c.tuning_job_id).filter(Boolean) as string[];
  if (!ids.length) return { usd: null, estimado: false };
  const s = createAdminClient();
  const { data } = await s.from("tuning_jobs").select("estimacion_usd, resultado").in("id", ids);
  let usd = 0;
  let estimado = false;
  for (const j of (data ?? []) as any[]) {
    const real = j.resultado?.costo_real_usd;
    if (typeof real === "number") usd += real;
    else if (j.estimacion_usd != null) {
      usd += Number(j.estimacion_usd);
      estimado = true;
    }
  }
  return { usd: Math.round(usd * 100) / 100, estimado };
}

/** Genera los informes vencidos (7/14/21/28) y cierra la distribución al terminar. */
export async function generarInformesVencidos(ahora = new Date()): Promise<{ generados: number[]; finalizado: boolean }> {
  const enCurso = await experimentoEnCurso(true);
  if (!enCurso?.exp.inicio_at) return { generados: [], finalizado: false };
  const { exp, candidatos } = enCurso;
  const inicioAt = exp.inicio_at!;
  const s = createAdminClient();
  const { data: prev } = await s.from("agent_experiment_reports" as any).select("dia").eq("experiment_id", exp.id);
  const hechos = ((prev ?? []) as any[]).map((r) => Number(r.dia));
  const dias = informesVencidos(inicioAt, ahora, hechos, exp.semanas);
  if (!dias.length) return { generados: [], finalizado: false };
  const datos = await cargarDatos(exp.id);
  const entrenamiento = await costoEntrenamiento(candidatos);
  const letras = candidatos.map((c) => c.letra);
  const generados: number[] = [];
  for (const dia of dias) {
    const inicio = new Date(inicioAt).getTime();
    const hasta = new Date(inicio + dia * 86_400_000).toISOString();
    const desdeSemana = new Date(inicio + (dia - 7) * 86_400_000).toISOString();
    const acumulado = calcularMetricas(letras, enVentana(datos.ops, inicioAt, hasta), enVentana(datos.turnos, inicioAt, hasta), enVentana(datos.incidentes, inicioAt, hasta));
    const semana = calcularMetricas(letras, enVentana(datos.ops, desdeSemana, hasta), enVentana(datos.turnos, desdeSemana, hasta), enVentana(datos.incidentes, desdeSemana, hasta));
    const verif = verificarCandidatos(candidatos, datos.modelosInformados);
    const pendientes = candidatos.filter((c) => c.estado !== "listo").map((c) => `${c.letra} ${c.estado === "detenido" ? "detenido" : "todavía no participa"}${c.detenido_motivo ? ` (${c.detenido_motivo})` : ""}.`);
    const rec = recomendar(acumulado.global, [...verif, ...pendientes]);
    const { error } = await s.from("agent_experiment_reports" as any).insert({
      experiment_id: exp.id,
      dia,
      desde: inicioAt,
      hasta,
      metricas: { semana, acumulado, costo_entrenamiento: entrenamiento },
      recomendacion: { candidato: rec.candidato, motivo: rec.motivo },
      avisos: rec.avisos,
    });
    if (!error) generados.push(dia);
  }
  let finalizado = false;
  if (dias.includes((exp.semanas * 7) as 7 | 14 | 21 | 28)) {
    // Fin del período: se apaga la distribución experimental (responde como antes
    // hasta que se aplique el ganador).
    await s.from("agent_experiments" as any).update({ estado: "finalizado", fin_at: ahora.toISOString(), motivo_cierre: "Fin de las semanas previstas", updated_at: ahora.toISOString() }).eq("id", exp.id).eq("estado", "en_curso");
    limpiarCacheExperimento();
    finalizado = true;
  }
  return { generados, finalizado };
}

/**
 * Configuración que responde después del experimento (system_settings
 * «agente_ganador»). Sin dato, responde como siempre (GEMINI_MODEL).
 */
export interface ConfiguracionGanadora {
  letra: Letra;
  proveedor: string;
  modelo: string;
  contexto: "actual" | "biblioteca";
  precio_entrada_millon: number | null;
  precio_salida_millon: number | null;
  aplicado_at: string;
}

let _ganador: { t: number; v: ConfiguracionGanadora | null } | null = null;
export async function configuracionGanadora(): Promise<ConfiguracionGanadora | null> {
  if (_ganador && Date.now() - _ganador.t < 60_000) return _ganador.v;
  let v: ConfiguracionGanadora | null = null;
  try {
    const { data } = await createAdminClient().from("system_settings").select("value").eq("key", "agente_ganador").maybeSingle();
    const val = (data as any)?.value;
    v = val && typeof val === "object" && val.modelo ? (val as ConfiguracionGanadora) : null;
  } catch {
    v = null;
  }
  _ganador = { t: Date.now(), v };
  return v;
}

export function limpiarCacheGanador() {
  _ganador = null;
}

/** Lista de un indicador (misma regla que la cifra) con nombre y enlaces. */
export async function listaIndicador(input: { experimentId: string; candidato: Letra; metrica: string; rubro?: string | null; desde?: string | null; hasta?: string | null }) {
  const { FILTROS_METRICA } = await import("./reglas");
  const f = FILTROS_METRICA[input.metrica];
  if (!f) throw new ExperimentoError("Indicador desconocido.", 400);
  const datos = await cargarDatos(input.experimentId);
  let ops = datos.ops.filter((o) => o.candidato === input.candidato && (!input.rubro || o.rubro === input.rubro));
  if (input.desde && input.hasta) ops = enVentana(ops, input.desde, input.hasta);
  ops = ops.filter(f.filtro);
  const s = createAdminClient();
  const ids = ops.map((o) => o.contact_id!).filter(Boolean);
  const nombres: Record<string, { full_name: string | null; phone: string | null }> = {};
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await s.from("contacts").select("id, full_name, phone").in("id", ids.slice(i, i + 200));
    for (const c of data ?? []) nombres[(c as any).id] = c as any;
  }
  return {
    label: f.label,
    filas: ops.map((o) => ({ ...o, nombre: nombres[o.contact_id!]?.full_name ?? null, telefono: nombres[o.contact_id!]?.phone ?? null })),
  };
}
