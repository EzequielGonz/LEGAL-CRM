/**
 * Tope de gasto de Gemini: lectura del gasto y decisión (22/11). Acceso a
 * datos con la clave de servicio; las reglas están en ./reglas (puras).
 *
 * Nunca rompe a un bot: si no se puede leer el gasto o la configuración, la
 * decisión es «libre» (se deja el aviso en el registro del servidor). Un
 * monitor caído no puede cortar una conversación.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { AREA_TO_RUBRO_ID, RUBRO_IDS } from "@/lib/rubros";
import { startOfArgentinaDay } from "@/lib/horario";
import {
  calcularGasto,
  CLAVE_PRESUPUESTO_GEMINI,
  CONFIG_PRESUPUESTO_POR_DEFECTO,
  evaluarPresupuesto,
  inicioDeMesArgentina,
  mesAr,
  normalizarConfig,
  textoAvisoPresupuesto,
  type ConfigPresupuesto,
  type DecisionPresupuesto,
  type FilaGasto,
  type GastoCalculado,
} from "./reglas";

const VIGENCIA_CACHE_MS = 60_000;
let _cache: { at: number; config: ConfigPresupuesto; gasto: GastoCalculado } | null = null;

/** Solo pruebas: vacía la memoria. */
export function vaciarCachePresupuesto() {
  _cache = null;
}

export async function leerConfigPresupuesto(): Promise<ConfigPresupuesto> {
  const { data } = await createAdminClient().from("system_settings").select("value").eq("key", CLAVE_PRESUPUESTO_GEMINI).maybeSingle();
  return normalizarConfig((data as any)?.value ?? null);
}

/** Gasto del día (por perfil) y del mes, calculado en la base con una sola consulta agregada. */
export async function leerGastoGemini(ahora: Date = new Date(), config?: ConfigPresupuesto): Promise<{ config: ConfigPresupuesto; gasto: GastoCalculado }> {
  const cfg = config ?? (await leerConfigPresupuesto());
  const { data, error } = await (createAdminClient() as any).rpc("gasto_gemini_resumen", {
    p_desde_dia: startOfArgentinaDay(ahora).toISOString(),
    p_desde_mes: inicioDeMesArgentina(ahora).toISOString(),
  });
  if (error) throw new Error(`No se pudo leer el gasto de Gemini: ${error.message}`);
  return { config: cfg, gasto: calcularGasto((data ?? []) as FilaGasto[], cfg) };
}

async function leerConCache(ahora: Date) {
  if (_cache && ahora.getTime() - _cache.at < VIGENCIA_CACHE_MS) return _cache;
  const { config, gasto } = await leerGastoGemini(ahora);
  _cache = { at: ahora.getTime(), config, gasto };
  return _cache;
}

/**
 * Lectura del gasto con la memoria de un minuto, para pantallas que consultan
 * seguido (la Oficina refresca cada 8 s): 27/11, auditoría.
 */
export async function leerGastoGeminiConCache(ahora: Date = new Date()): Promise<{ config: ConfigPresupuesto; gasto: GastoCalculado }> {
  const { config, gasto } = await leerConCache(ahora);
  return { config, gasto };
}

const LIBRE: DecisionPresupuesto = { estado: "libre", bloquea: false, gastoMesUsd: 0, gastoDiaPerfilUsd: 0, porcentajeMes: 0, motivo: "" };

/**
 * ¿Puede este perfil llamar a la IA ahora? `area` o `rubroId` identifican el
 * perfil. Con la memoria de un minuto: el gasto de un turno se ve en el
 * siguiente minuto, y el margen de los topes absorbe esa demora.
 */
export async function chequearTopeGemini(quien: { area?: string | null; rubroId?: string | null }, ahora: Date = new Date()): Promise<DecisionPresupuesto> {
  try {
    const rubro = quien.rubroId ?? (quien.area ? AREA_TO_RUBRO_ID[quien.area] : null) ?? null;
    const { config, gasto } = await leerConCache(ahora);
    return evaluarPresupuesto({ mesUsd: gasto.mesUsd, diaPerfilUsd: rubro ? gasto.porRubro[rubro]?.diaUsd ?? 0 : 0 }, config);
  } catch (err) {
    console.error("[presupuesto] No se pudo medir el gasto; el bot sigue sin tope:", (err as any)?.message ?? err);
    return LIBRE;
  }
}

const NOMBRE_PERFIL: Record<keyof typeof RUBRO_IDS, string> = {
  juridico: "Jurídico",
  coberturas_medicas: "Coberturas",
  agencia_0km: "Autos 0 km",
  marketing: "Marketing",
};

export interface ResumenPresupuesto {
  config: ConfigPresupuesto;
  mesUsd: number;
  porcentajeMes: number;
  estadoMes: DecisionPresupuesto["estado"];
  perfiles: { slug: keyof typeof RUBRO_IDS; nombre: string; diaUsd: number; topeDiaUsd: number; topeado: boolean; turnosFrenadosHoy: number }[];
}

/** Resumen para Salud y para el aviso. Lanza si no se puede leer (quien llama decide). */
export async function resumenPresupuesto(ahora: Date = new Date()): Promise<ResumenPresupuesto> {
  const { config, gasto } = await leerGastoGemini(ahora);
  const mes = evaluarPresupuesto({ mesUsd: gasto.mesUsd, diaPerfilUsd: 0 }, config);
  const perfiles = (Object.keys(RUBRO_IDS) as (keyof typeof RUBRO_IDS)[]).map((slug) => {
    const g = gasto.porRubro[RUBRO_IDS[slug]] ?? { diaUsd: 0, mesUsd: 0, topeadosDia: 0 };
    return { slug, nombre: NOMBRE_PERFIL[slug], diaUsd: g.diaUsd, topeDiaUsd: config.topeDiarioPorPerfilUsd, topeado: g.diaUsd >= config.topeDiarioPorPerfilUsd, turnosFrenadosHoy: g.topeadosDia };
  });
  return { config, mesUsd: gasto.mesUsd, porcentajeMes: mes.porcentajeMes, estadoMes: mes.estado, perfiles };
}

/**
 * Lo corre el latido cada diez minutos: avisa a los dispositivos del equipo
 * cuando el mes llega al 80 %, al tope del mes o cuando un perfil llega a su
 * tope del día. Un aviso por tipo y por día/mes (el aviso no se repite).
 * No le escribe a ningún contacto.
 */
export async function vigilarPresupuesto(ahora: Date = new Date()): Promise<{ avisados: number; estadoMes: string }> {
  const r = await resumenPresupuesto(ahora);
  const { sendToDevices } = await import("@/lib/push");
  const dia = new Date(ahora.getTime() - 3 * 3_600_000).toISOString().slice(0, 10);
  let avisados = 0;
  const enviar = async (clave: string, d: DecisionPresupuesto, perfil?: string) => {
    const t = textoAvisoPresupuesto(d, perfil);
    const { results } = await sendToDevices({ ...t, tag: "presupuesto-gemini", kind: "aviso", eventKey: clave });
    if (results.some((x) => x.status === "enviado")) avisados++;
  };
  const mesDecision = evaluarPresupuesto({ mesUsd: r.mesUsd, diaPerfilUsd: 0 }, r.config);
  if (mesDecision.estado === "tope_mes") await enviar(`presupuesto:gemini:tope_mes:${mesAr(ahora)}`, mesDecision);
  else if (mesDecision.estado === "aviso") await enviar(`presupuesto:gemini:80:${mesAr(ahora)}`, mesDecision);
  for (const p of r.perfiles) {
    if (!p.topeado) continue;
    const d = evaluarPresupuesto({ mesUsd: r.mesUsd, diaPerfilUsd: p.diaUsd }, r.config);
    if (d.estado === "tope_dia") await enviar(`presupuesto:gemini:tope_dia:${p.slug}:${dia}`, d, p.nombre);
  }
  return { avisados, estadoMes: mesDecision.estado };
}

export { CONFIG_PRESUPUESTO_POR_DEFECTO };
