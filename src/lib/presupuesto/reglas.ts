/**
 * Tope de gasto de Gemini para los bots (22/11). Reglas puras, sin red.
 *
 * Presupuesto autorizado el 20/10: USD 30 por mes para los bots. El gasto se
 * mide con lo que ya guarda el panel en cada turno (`agent_turn_logs`:
 * tokens de entrada, de salida y de razonamiento) multiplicado por un precio
 * por millón de tokens configurable. Si el precio real es otro, se corrige
 * desde la configuración sin tocar código; conviene que el precio cargado sea
 * algo mayor al real: el tope se activa antes, nunca después.
 *
 * Estados, de menos a más severo:
 *  - libre: por debajo de todo.
 *  - aviso: el mes llegó al 80 % del presupuesto (se avisa; el bot sigue igual).
 *  - tope_dia: el perfil llegó a su tope del día. Por defecto es SOLO AVISO
 *    (22/11, Dirección): se mide y se avisa en Salud y a los dispositivos,
 *    pero el bot sigue respondiendo, porque los precios por token son
 *    estimados y no están verificados. Con `frenoDiario: true` en
 *    `system_settings.presupuesto_gemini` vuelve a frenar a ese perfil hasta
 *    la medianoche de Argentina.
 *  - tope_mes: el mes llegó al 100 % (el bot deja de usar la IA en todos los
 *    perfiles hasta que el dueño suba el presupuesto o empiece otro mes).
 *
 * Por debajo del tope el comportamiento de los bots no cambia.
 */

export const CLAVE_PRESUPUESTO_GEMINI = "presupuesto_gemini";

export interface ConfigPresupuesto {
  /** USD por mes para todos los bots (autorizado 20/10). */
  mensualUsd: number;
  /** Fracción del mes a partir de la cual se avisa (0,8 = 80 %). */
  avisoFraccion: number;
  /** Tope diario por perfil, en USD. */
  topeDiarioPorPerfilUsd: number;
  /** Precios del modelo, en USD por millón de tokens. */
  precioEntradaMillon: number;
  precioSalidaMillon: number;
  /** Interruptor general: con false no se frena nada (solo se mide y se avisa). */
  frenar: boolean;
  /**
   * 22/11 (Dirección): ¿el tope DIARIO por perfil corta al bot? Por defecto no:
   * es solo aviso, porque los precios por token son estimados y sin verificar.
   * El tope del MES sí frena (si `frenar` está encendido).
   */
  frenoDiario: boolean;
}

/**
 * Valores por defecto. El promedio diario del presupuesto es USD 1,00 por día
 * (30 / 30); cada perfil puede gastar hasta USD 0,40 por día (un día con mucha
 * campaña no se corta) y el tope del mes sigue siendo la última barrera.
 * Los precios son una estimación conservadora de un modelo «Flash».
 */
export const CONFIG_PRESUPUESTO_POR_DEFECTO: ConfigPresupuesto = {
  mensualUsd: 30,
  avisoFraccion: 0.8,
  topeDiarioPorPerfilUsd: 0.4,
  precioEntradaMillon: 0.3,
  precioSalidaMillon: 2.5,
  frenar: true,
  frenoDiario: false,
};

function num(v: unknown, def: number, min: number, max: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  if (!Number.isFinite(n) || n < min || n > max) return def;
  return n;
}

/** Mezcla lo guardado con los valores por defecto; lo inválido vuelve al valor por defecto. Pura. */
export function normalizarConfig(crudo: unknown): ConfigPresupuesto {
  const d = CONFIG_PRESUPUESTO_POR_DEFECTO;
  const v = (crudo && typeof crudo === "object" ? crudo : {}) as Record<string, unknown>;
  return {
    mensualUsd: num(v.mensualUsd, d.mensualUsd, 1, 10_000),
    avisoFraccion: num(v.avisoFraccion, d.avisoFraccion, 0.1, 1),
    topeDiarioPorPerfilUsd: num(v.topeDiarioPorPerfilUsd, d.topeDiarioPorPerfilUsd, 0.01, 1_000),
    precioEntradaMillon: num(v.precioEntradaMillon, d.precioEntradaMillon, 0, 1_000),
    precioSalidaMillon: num(v.precioSalidaMillon, d.precioSalidaMillon, 0, 1_000),
    frenar: typeof v.frenar === "boolean" ? v.frenar : d.frenar,
    frenoDiario: typeof v.frenoDiario === "boolean" ? v.frenoDiario : d.frenoDiario,
  };
}

export interface TokensTurno {
  entrada: number;
  salida: number;
  /** Los tokens de razonamiento se cobran como salida. */
  razonamiento?: number;
}

/** Costo estimado en USD de un uso del modelo. Pura. */
export function costoEstimadoUsd(t: TokensTurno, c: Pick<ConfigPresupuesto, "precioEntradaMillon" | "precioSalidaMillon">): number {
  const entrada = Math.max(0, Number(t.entrada) || 0);
  const salida = Math.max(0, Number(t.salida) || 0) + Math.max(0, Number(t.razonamiento) || 0);
  const v = (entrada * c.precioEntradaMillon + salida * c.precioSalidaMillon) / 1_000_000;
  return Math.round(v * 1_000_000) / 1_000_000;
}

export type EstadoPresupuesto = "libre" | "aviso" | "tope_dia" | "tope_mes";

export interface DecisionPresupuesto {
  estado: EstadoPresupuesto;
  /** true = el bot no debe llamar a la IA ahora. */
  bloquea: boolean;
  gastoMesUsd: number;
  gastoDiaPerfilUsd: number;
  porcentajeMes: number;
  motivo: string;
}

const usd = (n: number) => `USD ${n.toFixed(2).replace(".", ",")}`;

/** Decide qué corresponde con el gasto del mes y el del día del perfil. Pura. */
export function evaluarPresupuesto(gasto: { mesUsd: number; diaPerfilUsd: number }, config: ConfigPresupuesto): DecisionPresupuesto {
  const mes = Math.max(0, gasto.mesUsd);
  const dia = Math.max(0, gasto.diaPerfilUsd);
  const porcentajeMes = Math.round((mes / config.mensualUsd) * 1000) / 10;
  const base = { gastoMesUsd: mes, gastoDiaPerfilUsd: dia, porcentajeMes };
  if (mes >= config.mensualUsd) {
    return { ...base, estado: "tope_mes", bloquea: config.frenar, motivo: `El gasto del mes (${usd(mes)}) llegó al presupuesto de ${usd(config.mensualUsd)}.` };
  }
  if (dia >= config.topeDiarioPorPerfilUsd) {
    // 22/11: el tope del día solo corta si se encendió `frenoDiario` (por defecto es aviso).
    return { ...base, estado: "tope_dia", bloquea: config.frenar && config.frenoDiario, motivo: `El perfil llegó a su tope de hoy (${usd(dia)} de ${usd(config.topeDiarioPorPerfilUsd)}).` };
  }
  if (mes >= config.mensualUsd * config.avisoFraccion) {
    return { ...base, estado: "aviso", bloquea: false, motivo: `El mes lleva ${usd(mes)} de ${usd(config.mensualUsd)} (${porcentajeMes} %).` };
  }
  return { ...base, estado: "libre", bloquea: false, motivo: "" };
}

/** Fila que devuelve la función `gasto_gemini_resumen` (una por rubro). */
export interface FilaGasto {
  rubro_id: string | null;
  tokens_entrada_dia: number;
  tokens_salida_dia: number;
  tokens_entrada_mes: number;
  tokens_salida_mes: number;
  turnos_topeados_dia?: number;
}

export interface GastoCalculado {
  mesUsd: number;
  porRubro: Record<string, { diaUsd: number; mesUsd: number; topeadosDia: number }>;
}

/** Pasa las filas de la base a USD por rubro y total del mes. Pura. */
export function calcularGasto(filas: FilaGasto[], config: ConfigPresupuesto): GastoCalculado {
  const porRubro: GastoCalculado["porRubro"] = {};
  let mesUsd = 0;
  for (const f of filas) {
    const dia = costoEstimadoUsd({ entrada: Number(f.tokens_entrada_dia), salida: Number(f.tokens_salida_dia) }, config);
    const mes = costoEstimadoUsd({ entrada: Number(f.tokens_entrada_mes), salida: Number(f.tokens_salida_mes) }, config);
    mesUsd += mes;
    // Lo que no es de ningún rubro (por ejemplo, un análisis sin perfil) suma al mes y a ningún día de perfil.
    if (f.rubro_id) {
      const prev = porRubro[f.rubro_id] ?? { diaUsd: 0, mesUsd: 0, topeadosDia: 0 };
      porRubro[f.rubro_id] = { diaUsd: prev.diaUsd + dia, mesUsd: prev.mesUsd + mes, topeadosDia: prev.topeadosDia + Number(f.turnos_topeados_dia ?? 0) };
    }
  }
  return { mesUsd: Math.round(mesUsd * 1_000_000) / 1_000_000, porRubro };
}

/** Marca con que el turno registra que el tope lo frenó (para contarlo en Salud). */
export const MARCA_TOPE_GASTO = "tope_gasto";

/** Primer día del mes en Argentina (UTC-3) como instante UTC. Pura. */
export function inicioDeMesArgentina(ahora: Date): Date {
  const art = new Date(ahora.getTime() - 3 * 3_600_000);
  return new Date(Date.UTC(art.getUTCFullYear(), art.getUTCMonth(), 1) + 3 * 3_600_000);
}

/** Mes en hora de Argentina (AAAA-MM), para las claves de aviso. Pura. */
export function mesAr(ahora: Date): string {
  return new Date(ahora.getTime() - 3 * 3_600_000).toISOString().slice(0, 7);
}

/** Aviso de gasto (80 % del mes) y de tope: texto sin datos de personas. Pura. */
export function textoAvisoPresupuesto(d: DecisionPresupuesto, perfilNombre?: string): { title: string; body: string; url: string } {
  if (d.estado === "tope_mes") return { title: "Tope de gasto de IA alcanzado", body: `${d.motivo} Los bots derivan a una persona. Tocá para verlo en Salud.`, url: "/salud" };
  if (d.estado === "tope_dia") {
    const efecto = d.bloquea ? "Hasta la medianoche el bot deriva a una persona." : "Es solo un aviso: el bot sigue respondiendo.";
    return { title: `Tope diario de IA${perfilNombre ? ` · ${perfilNombre}` : ""}`, body: `${d.motivo} ${efecto} Tocá para verlo en Salud.`, url: "/salud" };
  }
  return { title: "Gasto de IA al 80 % del mes", body: `${d.motivo} Tocá para verlo en Salud.`, url: "/salud" };
}
