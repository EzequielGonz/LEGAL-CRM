/**
 * Modo arena de la Oficina (27/11, decisión del dueño: «en cada agente
 * compitan 100 más para ver quién tiene la mejor respuesta, como la skill
 * arena»). Cada agente resuelve con N candidatos; un juez los puntúa y se
 * elige el mejor. Este archivo es solo el contrato y las reglas puras: no llama
 * a ningún modelo. El tope de gasto (USD 30 por mes, compartido con los bots)
 * manda siempre: `topeDeCandidatos` nunca deja pasar el límite.
 */

/** Máximo de candidatos que pidió el dueño (el agente más 100). */
export const MAX_CANDIDATOS_ARENA = 101;

export interface PuntajeJuez {
  /** Quién puntuó (juez o criterio). */
  juez: string;
  /** 0 a 10. */
  puntaje: number;
}

export interface CandidatoArena {
  id: string;
  /** Respuesta propuesta. Opcional en los cálculos: no se usa para elegir. */
  texto?: string;
  puntajes: PuntajeJuez[];
  /** Costo en USD de generarlo; sirve para desempatar. */
  costoUsd?: number;
  /** Si falló, no compite. */
  error?: string | null;
}

export interface ResultadoArena {
  ganador: CandidatoArena;
  promedio: number;
  /** Ordenados de mejor a peor, solo los que compitieron. */
  ranking: { id: string; promedio: number }[];
}

function promedioValido(c: CandidatoArena): number | null {
  const v = c.puntajes.map((p) => Number(p.puntaje)).filter((n) => Number.isFinite(n) && n >= 0 && n <= 10);
  if (v.length === 0) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

/**
 * Elige al ganador por promedio de los puntajes del juez. Descarta a los que
 * fallaron o no tienen ningún puntaje válido. Empate: menor costo, después
 * orden de llegada (determinista). Devuelve null si no compite nadie.
 */
export function elegirGanador(candidatos: CandidatoArena[]): ResultadoArena | null {
  const compiten = candidatos
    .map((c, i) => ({ c, i, prom: c.error ? null : promedioValido(c) }))
    .filter((x): x is { c: CandidatoArena; i: number; prom: number } => x.prom !== null);
  if (compiten.length === 0) return null;
  compiten.sort((a, b) => {
    if (b.prom !== a.prom) return b.prom - a.prom;
    const ca = a.c.costoUsd ?? Infinity;
    const cb = b.c.costoUsd ?? Infinity;
    if (ca !== cb) return ca - cb;
    return a.i - b.i;
  });
  return {
    ganador: compiten[0].c,
    promedio: compiten[0].prom,
    ranking: compiten.map((x) => ({ id: x.c.id, promedio: x.prom })),
  };
}

export interface OpcionesTope {
  /** Máximo de candidatos pedido (por defecto, el de la arena). */
  maximo?: number;
  /** Costo estimado del juez, una sola vez por corrida. */
  costoJuezUsd?: number;
}

const MICRO = 1_000_000;

/**
 * Cuántos candidatos se pueden correr sin pasar el presupuesto que queda.
 * Conservadora: ante datos dudosos (NaN, negativos, costo 0) devuelve 0; los
 * costos se redondean para arriba y lo que queda para abajo, en millonésimas
 * de USD, para que el total estimado nunca supere el restante. Con 1 solo
 * candidato no hace falta juez. Devuelve 0 si ni uno entra.
 */
export function topeDeCandidatos(presupuestoRestanteUsd: number, costoEstimadoUsd: number, opciones: OpcionesTope = {}): number {
  const maximo = Math.min(MAX_CANDIDATOS_ARENA, Math.max(0, Math.floor(opciones.maximo ?? MAX_CANDIDATOS_ARENA)));
  const restante = Number(presupuestoRestanteUsd);
  const costo = Number(costoEstimadoUsd);
  const juez = opciones.costoJuezUsd ?? 0;
  if (!Number.isFinite(restante) || !Number.isFinite(costo) || !Number.isFinite(juez)) return 0;
  if (restante <= 0 || costo <= 0 || juez < 0 || maximo === 0) return 0;
  const restM = Math.floor(restante * MICRO);
  const costoM = Math.max(1, Math.ceil(costo * MICRO));
  const juezM = Math.ceil(juez * MICRO);
  const conJuez = restM >= juezM ? Math.floor((restM - juezM) / costoM) : 0;
  if (conJuez >= 2) return Math.min(maximo, conJuez);
  return restM >= costoM ? Math.min(maximo, 1) : 0;
}
