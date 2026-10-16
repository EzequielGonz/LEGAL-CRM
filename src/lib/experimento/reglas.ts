/**
 * Comparación de agentes A/B/C (16/10). Reglas puras, sin base ni red.
 *
 *  - Asignación equilibrada y fija: cada oportunidad nueva va al candidato
 *    listo con menos asignaciones en su estrato (perfil | fuente | frío o
 *    actual), contando desde el último cambio de candidatos listos; el
 *    empate se resuelve con un hash estable de la oportunidad. Una vez
 *    asignada no cambia (lo garantiza la base con un índice único).
 *  - Costo por turno con la tarifa del candidato; sin tarifa = sin dato.
 *  - Métricas por candidato y perfil con denominadores visibles.
 *  - Recomendación separada del voto, con avisos de muestra chica.
 *  - Voto: gana el más votado; empate o votos faltantes = decisión pendiente.
 */
import { createHash } from "node:crypto";

export type Letra = "A" | "B" | "C";
export const LETRAS: Letra[] = ["A", "B", "C"];
export type Canal = "entrante" | "campana" | "base_fria";
export const DIAS_INFORME = [7, 14, 21, 28] as const;

export interface CandidatoExp {
  letra: Letra;
  proveedor: string;
  modelo: string | null;
  contexto: "actual" | "biblioteca";
  estado: "pendiente" | "listo" | "detenido";
  listo_at?: string | null;
  precio_entrada_millon?: number | null;
  precio_salida_millon?: number | null;
}

export function canalDe(input: { campaignId?: string | null; importedBaseId?: string | null; origen?: string | null }): Canal {
  if (input.importedBaseId) return "base_fria";
  if (input.campaignId || input.origen === "campana" || input.origen === "campaña") return "campana";
  return "entrante";
}

export function estratoDe(input: { rubro: string; fuente?: string | null; canal: Canal }): string {
  const modo = input.canal === "entrante" ? "actual" : "frio";
  return `${input.rubro}|${(input.fuente ?? "sin_dato").trim() || "sin_dato"}|${modo}`;
}

/** Candidatos que pueden recibir oportunidades nuevas. */
export function candidatosListos(cands: CandidatoExp[]): CandidatoExp[] {
  return cands.filter((c) => c.estado === "listo").sort((a, b) => a.letra.localeCompare(b.letra));
}

/** Desde cuándo se cuenta el equilibrio: el último candidato que quedó listo. */
export function desdeEquilibrio(cands: CandidatoExp[], inicio: string): string {
  const fechas = candidatosListos(cands).map((c) => c.listo_at ?? inicio).concat(inicio);
  return fechas.sort().slice(-1)[0];
}

function hashNum(s: string): number {
  return createHash("sha256").update(s).digest().readUInt32BE(0);
}

/**
 * Elige candidato para una oportunidad nueva: el de menos asignaciones en
 * el estrato (desde el último cambio de candidatos listos); empate → hash.
 */
export function elegirCandidato(opportunityId: string, listos: Letra[], conteoEstrato: Partial<Record<Letra, number>>): Letra | null {
  if (listos.length === 0) return null;
  const min = Math.min(...listos.map((l) => conteoEstrato[l] ?? 0));
  const empatados = listos.filter((l) => (conteoEstrato[l] ?? 0) === min);
  return empatados[hashNum(opportunityId) % empatados.length];
}

/**
 * Candidato que responde de verdad: el asignado si sigue listo; si quedó
 * detenido (fallo fatal) o pendiente, responde el bot actual (A) y se
 * registra como reemplazo. Sin experimento, null (comportamiento de hoy).
 */
export function candidatoEfectivo(asignado: Letra | null, cands: CandidatoExp[]): { letra: Letra | null; reemplazo: boolean } {
  if (!asignado) return { letra: null, reemplazo: false };
  const c = cands.find((x) => x.letra === asignado);
  if (c?.estado === "listo") return { letra: asignado, reemplazo: false };
  const a = cands.find((x) => x.letra === "A" && x.estado === "listo");
  return { letra: a ? "A" : null, reemplazo: true };
}

export function costoTurno(c: Pick<CandidatoExp, "precio_entrada_millon" | "precio_salida_millon">, tokensEntrada: number, tokensSalida: number): number | null {
  if (c.precio_entrada_millon == null || c.precio_salida_millon == null) return null;
  const v = (tokensEntrada * Number(c.precio_entrada_millon) + tokensSalida * Number(c.precio_salida_millon)) / 1_000_000;
  return Math.round(v * 1_000_000) / 1_000_000;
}

/**
 * Comprueba que los candidatos sean distintos entre sí y que cada uno use
 * el modelo que le toca. Devuelve avisos legibles (vacío = todo bien).
 */
export function verificarCandidatos(cands: CandidatoExp[], modelosInformados: Partial<Record<Letra, string[]>> = {}): string[] {
  const avisos: string[] = [];
  const firma = (c: CandidatoExp) => `${c.proveedor}|${c.modelo ?? ""}|${c.contexto}`;
  for (let i = 0; i < cands.length; i++) {
    for (let j = i + 1; j < cands.length; j++) {
      if (firma(cands[i]) === firma(cands[j])) avisos.push(`${cands[i].letra} y ${cands[j].letra} son idénticos (mismo proveedor, modelo y contexto).`);
    }
  }
  for (const c of cands) {
    if (c.estado !== "pendiente" && !c.modelo) avisos.push(`${c.letra} no tiene modelo cargado.`);
    const vistos = (modelosInformados[c.letra] ?? []).filter(Boolean);
    if (!c.modelo || vistos.length === 0) continue;
    const esperado = c.modelo.toLowerCase();
    const ajenos = [...new Set(vistos.filter((m) => {
      const v = m.toLowerCase();
      // Vertex informa el modelo base o el endpoint; se acepta si coincide alguno de los dos.
      return !(v === esperado || v.startsWith(esperado) || esperado.startsWith(v) || (c.proveedor === "vertex" && v.includes("gemini")));
    }))];
    if (ajenos.length) avisos.push(`${c.letra} respondió con un modelo distinto al asignado (${ajenos.join(", ")}; esperado ${c.modelo}).`);
  }
  return avisos;
}

// ---------------------------------------------------------------------
// Métricas
// ---------------------------------------------------------------------
export interface FilaOportunidad {
  id: string;
  contact_id?: string;
  conversation_id?: string | null;
  candidato: Letra;
  rubro: string;
  asignado_at: string;
  contact_state: string;
  capture_state: string;
  derivation_state: string;
  attention_state: string;
  historical_result: string | null;
  detenida: boolean;
  baja: boolean;
  cita: boolean;
  /** Fase alcanzada en Marketing u otros perfiles (texto libre corto). */
  fase?: string | null;
  presupuesto_pedido?: boolean;
  cerrado?: boolean;
}

export interface FilaTurno {
  candidato: Letra;
  rubro: string;
  resultado: string;
  latencia_ms: number | null;
  tokens_entrada: number;
  tokens_salida: number;
  costo_usd: number | null;
  uso: string;
  created_at: string;
}

export interface FilaIncidente {
  candidato: Letra | null;
  rubro?: string | null;
  gravedad: "fatal" | "grave" | "leve";
}

export interface Tasa {
  valor: number | null;
  numerador: number;
  denominador: number;
}

function tasa(n: number, d: number): Tasa {
  return { valor: d > 0 ? Math.round((n / d) * 1000) / 10 : null, numerador: n, denominador: d };
}

function percentil(vals: number[], p: number): number | null {
  if (vals.length === 0) return null;
  const s = [...vals].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
}

/**
 * Indicadores que se pueden abrir como lista: la cifra y la lista usan el
 * MISMO filtro (indicador → prospectos → ficha → conversación).
 */
export const FILTROS_METRICA: Record<string, { label: string; filtro: (o: FilaOportunidad) => boolean }> = {
  asignados: { label: "Asignados", filtro: () => true },
  contactados: { label: "Contactados", filtro: (o) => o.contact_state !== "sin_contactar" },
  respondieron: { label: "Respondieron", filtro: (o) => o.contact_state === "respondio" },
  citas: { label: "Con cita", filtro: (o) => o.cita },
  en_fase_avanzada: { label: "En fase avanzada", filtro: (o) => !!o.fase },
  captados: { label: "Captados", filtro: (o) => o.capture_state === "captado" },
  derivados: { label: "Derivados", filtro: (o) => o.derivation_state === "derivado" },
  cerrados: { label: "Cerrados por el profesional", filtro: (o) => !!o.cerrado || /cerrad|contrat|vend/i.test(o.historical_result ?? "") },
  presupuestos_pedidos: { label: "Pidieron presupuesto", filtro: (o) => !!o.presupuesto_pedido },
  rechazos: { label: "Rechazos", filtro: (o) => o.detenida && !o.baja },
  bajas: { label: "Bajas", filtro: (o) => o.baja },
  intervenciones_humanas: { label: "Intervención humana", filtro: (o) => o.attention_state !== "ia" },
};

export interface MetricasCandidato {
  asignados: number;
  contactados: number;
  respondieron: number;
  citas: number;
  en_fase_avanzada: number;
  captados: number;
  derivados: number;
  cerrados: number;
  presupuestos_pedidos: number;
  rechazos: number;
  bajas: number;
  intervenciones_humanas: number;
  errores: number;
  fallos_cumplimiento: number;
  incidentes: { fatal: number; grave: number; leve: number };
  tasa_respuesta: Tasa;
  tasa_captacion: Tasa;
  tasa_captacion_sobre_respuestas: Tasa;
  tasa_derivacion: Tasa;
  turnos: number;
  latencia_p50_ms: number | null;
  latencia_p90_ms: number | null;
  tokens_entrada: number;
  tokens_salida: number;
  costo_operacion_usd: number | null;
  turnos_sin_tarifa: number;
  costo_por_captado_usd: number | null;
}

function metricasDe(ops: FilaOportunidad[], turnos: FilaTurno[], inc: FilaIncidente[]): MetricasCandidato {
  const n = (k: string) => ops.filter(FILTROS_METRICA[k].filtro).length;
  const contactados = n("contactados");
  const respondieron = n("respondieron");
  const captados = n("captados");
  const derivados = n("derivados");
  const lat = turnos.map((t) => t.latencia_ms).filter((x): x is number => typeof x === "number");
  const conCosto = turnos.filter((t) => t.costo_usd != null);
  const costo = conCosto.length ? Math.round(conCosto.reduce((a, t) => a + Number(t.costo_usd), 0) * 1e6) / 1e6 : turnos.length ? null : 0;
  return {
    asignados: ops.length,
    contactados,
    respondieron,
    citas: n("citas"),
    en_fase_avanzada: n("en_fase_avanzada"),
    captados,
    derivados,
    cerrados: n("cerrados"),
    presupuestos_pedidos: n("presupuestos_pedidos"),
    rechazos: n("rechazos"),
    bajas: n("bajas"),
    intervenciones_humanas: n("intervenciones_humanas"),
    errores: turnos.filter((t) => t.resultado === "error").length,
    fallos_cumplimiento: turnos.filter((t) => t.resultado === "retenido").length,
    incidentes: {
      fatal: inc.filter((i) => i.gravedad === "fatal").length,
      grave: inc.filter((i) => i.gravedad === "grave").length,
      leve: inc.filter((i) => i.gravedad === "leve").length,
    },
    tasa_respuesta: tasa(respondieron, contactados),
    tasa_captacion: tasa(captados, ops.length),
    tasa_captacion_sobre_respuestas: tasa(captados, respondieron),
    tasa_derivacion: tasa(derivados, captados),
    turnos: turnos.length,
    latencia_p50_ms: percentil(lat, 50),
    latencia_p90_ms: percentil(lat, 90),
    tokens_entrada: turnos.reduce((a, t) => a + t.tokens_entrada, 0),
    tokens_salida: turnos.reduce((a, t) => a + t.tokens_salida, 0),
    costo_operacion_usd: costo,
    turnos_sin_tarifa: turnos.length - conCosto.length,
    costo_por_captado_usd: costo != null && captados > 0 ? Math.round((costo / captados) * 10000) / 10000 : null,
  };
}

export interface MetricasExperimento {
  global: Partial<Record<Letra, MetricasCandidato>>;
  porRubro: Record<string, Partial<Record<Letra, MetricasCandidato>>>;
}

export function calcularMetricas(letras: Letra[], ops: FilaOportunidad[], turnos: FilaTurno[], inc: FilaIncidente[]): MetricasExperimento {
  const global: MetricasExperimento["global"] = {};
  const porRubro: MetricasExperimento["porRubro"] = {};
  // La evaluación de plantillas tiene su propio informe: no entra en la operación.
  turnos = turnos.filter((t) => t.uso !== "evaluacion_plantillas");
  const rubros = [...new Set(ops.map((o) => o.rubro).concat(turnos.map((t) => t.rubro)))].sort();
  for (const l of letras) {
    global[l] = metricasDe(ops.filter((o) => o.candidato === l), turnos.filter((t) => t.candidato === l), inc.filter((i) => i.candidato === l));
    for (const r of rubros) {
      porRubro[r] ??= {};
      porRubro[r][l] = metricasDe(
        ops.filter((o) => o.candidato === l && o.rubro === r),
        turnos.filter((t) => t.candidato === l && t.rubro === r),
        inc.filter((i) => i.candidato === l && i.rubro === r)
      );
    }
  }
  return { global, porRubro };
}

/** Recorta filas a una ventana [desde, hasta). */
export function enVentana<T extends { asignado_at?: string; created_at?: string }>(filas: T[], desde: string, hasta: string): T[] {
  return filas.filter((f) => {
    const t = f.asignado_at ?? f.created_at ?? "";
    return t >= desde && t < hasta;
  });
}

// ---------------------------------------------------------------------
// Recomendación (separada del voto) y avisos
// ---------------------------------------------------------------------
export const MUESTRA_MINIMA = { asignados: 30, respondieron: 10 } as const;

export interface Recomendacion {
  candidato: Letra | null;
  motivo: string;
  avisos: string[];
}

export function recomendar(m: MetricasExperimento["global"], extra: string[] = []): Recomendacion {
  const avisos = [...extra];
  const letras = (Object.keys(m) as Letra[]).filter((l) => m[l]);
  const aptos = letras.filter((l) => {
    const x = m[l]!;
    if (x.incidentes.fatal > 0) {
      avisos.push(`${l} tuvo ${x.incidentes.fatal} fallo(s) fatal(es): queda fuera de la recomendación.`);
      return false;
    }
    if (x.asignados < MUESTRA_MINIMA.asignados || x.respondieron < MUESTRA_MINIMA.respondieron) {
      avisos.push(`${l}: muestra chica (${x.asignados} asignados, ${x.respondieron} respondieron; mínimo ${MUESTRA_MINIMA.asignados} y ${MUESTRA_MINIMA.respondieron}).`);
    }
    if (x.turnos_sin_tarifa > 0) avisos.push(`${l}: ${x.turnos_sin_tarifa} turno(s) sin tarifa cargada; el costo está incompleto.`);
    return true;
  });
  const conMuestra = aptos.filter((l) => m[l]!.asignados >= MUESTRA_MINIMA.asignados && m[l]!.respondieron >= MUESTRA_MINIMA.respondieron);
  if (conMuestra.length < 2) {
    return { candidato: null, motivo: "Todavía no hay datos suficientes para recomendar con confianza.", avisos };
  }
  // Orden: más captación sobre respuestas; luego menos fallos de cumplimiento
  // por turno; luego menor costo por captado (sin dato va al final).
  const orden = [...conMuestra].sort((a, b) => {
    const x = m[a]!, y = m[b]!;
    const ta = x.tasa_captacion_sobre_respuestas.valor ?? -1, tb = y.tasa_captacion_sobre_respuestas.valor ?? -1;
    if (tb !== ta) return tb - ta;
    const fa = x.turnos ? x.fallos_cumplimiento / x.turnos : 0, fb = y.turnos ? y.fallos_cumplimiento / y.turnos : 0;
    if (fa !== fb) return fa - fb;
    return (x.costo_por_captado_usd ?? Infinity) - (y.costo_por_captado_usd ?? Infinity);
  });
  const g = m[orden[0]]!;
  const s = m[orden[1]]!;
  const dif = (g.tasa_captacion_sobre_respuestas.valor ?? 0) - (s.tasa_captacion_sobre_respuestas.valor ?? 0);
  if (dif < 2) avisos.push(`La diferencia entre ${orden[0]} y ${orden[1]} es chica (${dif.toFixed(1)} puntos): puede ser azar.`);
  return {
    candidato: orden[0],
    motivo: `${orden[0]} capta ${g.tasa_captacion_sobre_respuestas.valor ?? 0}% de los que responden (${g.captados}/${g.respondieron}) con ${g.fallos_cumplimiento} fallo(s) de cumplimiento en ${g.turnos} turnos.`,
    avisos,
  };
}

/** Informes que ya corresponden y todavía no se generaron. */
export function informesVencidos(inicio: string, ahora: Date, generados: number[], semanas = 4): number[] {
  const dias = (ahora.getTime() - new Date(inicio).getTime()) / 86_400_000;
  return DIAS_INFORME.filter((d) => d <= semanas * 7 && dias >= d && !generados.includes(d));
}

/** Resultado del voto: gana el más votado; empate o faltan votos → null. */
export function ganadorPorVotos(votos: Letra[], esperados = 4): { ganador: Letra | null; motivo: string; conteo: Partial<Record<Letra, number>> } {
  const conteo: Partial<Record<Letra, number>> = {};
  for (const v of votos) conteo[v] = (conteo[v] ?? 0) + 1;
  const max = Math.max(0, ...Object.values(conteo).map(Number));
  const top = (Object.keys(conteo) as Letra[]).filter((l) => conteo[l] === max);
  if (votos.length < esperados) return { ganador: null, motivo: `Faltan ${esperados - votos.length} voto(s).`, conteo };
  if (top.length !== 1) return { ganador: null, motivo: `Empate entre ${top.join(" y ")}.`, conteo };
  return { ganador: top[0], motivo: `${top[0]} tiene ${max} de ${votos.length} votos.`, conteo };
}

/** Requisitos para aplicar el ganador al cerrar. */
export function requisitosGanador(c: CandidatoExp | undefined, incidentesFatales: number, configuracion: { vertex: boolean }): string[] {
  const faltan: string[] = [];
  if (!c) return ["El candidato no existe."];
  if (c.estado === "detenido") faltan.push("El candidato está detenido por un fallo.");
  if (incidentesFatales > 0) faltan.push("Tiene fallos fatales sin resolver.");
  if (!c.modelo) faltan.push("No tiene modelo cargado.");
  if (c.proveedor === "vertex" && !configuracion.vertex) faltan.push("Faltan las variables de Vertex en Vercel.");
  return faltan;
}
