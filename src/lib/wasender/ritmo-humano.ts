/**
 * Ritmo humano de los envíos por Wasender (14/11). Se suma a `ritmo.ts`, que
 * sigue valiendo: calentamiento, espera irregular, desfase y freno.
 *
 * Pedido de la responsable: «que no haya un patrón repetitivo, que se mande al
 * azar todo», de lunes a sábado y sin días de descanso. Lo que se agrega:
 *  1. Tandas de largo variable y pausas entre tandas de largo variable.
 *  2. Plan del día por línea: hora de arranque y de cierre distintas cada día,
 *     una pausa larga cerca del mediodía y, a veces, otra corta a cualquier
 *     hora («deja el celular»), un ritmo más rápido o más lento según el día
 *     y una cantidad del día que no siempre llega al límite.
 *  3. Elección del texto al azar en cada envío, sin repetir la plantilla de
 *     los últimos envíos de la línea ni un texto muy parecido a los recientes.
 *  4. Medida de parecido entre textos, para avisar variantes casi iguales.
 *
 * Todo es puro: el azar se inyecta y el plan del día sale de una semilla
 * (línea + fecha), así cada ejecución del latido ve el mismo plan sin guardar
 * nada en la base. Nada de esto toca a Meta.
 */

/** Generador al azar con semilla (mulberry32 sobre un hash FNV-1a). Mismo texto → misma secuencia. */
export function azarConSemilla(semilla: string): () => number {
  let h = 2166136261;
  for (const c of semilla) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  let a = h || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Entero al azar entre a y b (ambos incluidos). */
function entre(azar: () => number, a: number, b: number): number {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return lo + Math.floor(azar() * (hi - lo + 1));
}

// ── 1. Tandas ────────────────────────────────────────────────────────────

/** Rango de largo de una tanda alrededor del valor elegido en la campaña. */
export function rangoDeTanda(base: number): { min: number; max: number } {
  const b = Math.max(1, Math.round(base || 1));
  const min = Math.max(2, Math.round(b * 0.5));
  const max = Math.max(min + 1, Math.round(b * 1.6));
  return { min, max };
}

/**
 * ¿Se corta la tanda después de este envío? `enviadosEnTanda` cuenta el que
 * acaba de salir. Antes del mínimo nunca; en el máximo siempre; en el medio,
 * con una probabilidad que reparte el largo parejo dentro del rango. Así una
 * tanda es de 4, la siguiente de 9, la otra de 6…
 */
export function cortarTanda(enviadosEnTanda: number, base: number, azar: () => number = Math.random): boolean {
  const { min, max } = rangoDeTanda(base);
  if (enviadosEnTanda < min) return false;
  if (enviadosEnTanda >= max) return true;
  return azar() < 1 / (max - enviadosEnTanda + 1);
}

/**
 * Pausa entre tandas, en segundos: entre el 60 % y el 200 % de la elegida y,
 * una de cada seis veces, un poco más. Nunca menos de un minuto.
 */
export function pausaEntreTandas(baseSegundos: number, azar: () => number = Math.random): number {
  const base = Math.max(60, baseSegundos || 0);
  let s = base * (0.6 + azar() * 1.4);
  if (azar() < 1 / 6) s *= 1.3 + azar() * 0.5;
  return Math.max(60, Math.round(s));
}

// ── 2. Plan del día ──────────────────────────────────────────────────────

export interface Corte {
  /** Minutos desde las 0:00 (hora Argentina). */
  desde: number;
  hasta: number;
  motivo: "mediodía" | "pausa";
}

export interface PlanDelDia {
  /** Minutos desde las 0:00 (hora Argentina) en que empieza a enviar hoy. */
  arranque: number;
  /** Minutos desde las 0:00 en que deja de enviar hoy. */
  cierre: number;
  /** Parte del límite del día que se usa hoy (0,55 a 1). */
  factorCupo: number;
  /** Multiplica las esperas entre envíos: un día más ágil, otro más tranquilo. */
  factorEspera: number;
  cortes: Corte[];
}

/** Fecha de hoy en Argentina (UTC-3 todo el año) como AAAA-MM-DD. */
export function fechaArgentina(ahora: Date): string {
  return new Date(ahora.getTime() - 3 * 3_600_000).toISOString().slice(0, 10);
}

/** Minutos desde las 0:00 en Argentina. */
export function minutosArgentina(ahora: Date): number {
  const d = new Date(ahora.getTime() - 3 * 3_600_000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/** 1 = lunes … 7 = domingo, en Argentina. */
function diaSemana(fecha: string): number {
  const d = new Date(`${fecha}T12:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
}

/**
 * Plan del día para una línea. Se calcula siempre igual para la misma línea
 * y la misma fecha, y cambia de un día a otro. `horario` es la franja
 * permitida de la campaña (horas enteras, por ejemplo 8 y 21): el plan nunca
 * sale de ella, solo la achica.
 */
export function planDelDia(semilla: string, fecha: string, horario: { inicio: number; fin: number }): PlanDelDia {
  const azar = azarConSemilla(`plan:${semilla}:${fecha}`);
  const abre = horario.inicio * 60;
  const cierra = horario.fin * 60;
  const franja = Math.max(0, cierra - abre);
  // Con una franja corta los corrimientos se achican para no comerse el día.
  const tope = Math.min(1, franja / (8 * 60));
  const arranque = abre + Math.round(entre(azar, 6, 100) * tope);
  const cierre = cierra - Math.round(entre(azar, 8, 85) * tope);

  const sabado = diaSemana(fecha) === 6;
  const factorCupo = Math.round((sabado ? 0.55 + azar() * 0.3 : 0.72 + azar() * 0.28) * 100) / 100;
  const factorEspera = Math.round((0.8 + azar() * 0.55) * 100) / 100;

  const cortes: Corte[] = [];
  // Mediodía: tres de cada cuatro días, entre 12:10 y 14:20, de 35 a 95 minutos.
  if (azar() < 0.75) {
    const desde = entre(azar, 12 * 60 + 10, 14 * 60 + 20);
    const hasta = desde + entre(azar, 35, 95);
    if (desde > arranque + 30 && hasta < cierre - 30) cortes.push({ desde, hasta, motivo: "mediodía" });
  }
  // Una o dos pausas cortas a cualquier hora (15 a 50 minutos), sin pisarse.
  const extras = azar() < 0.65 ? (azar() < 0.35 ? 2 : 1) : 0;
  for (let i = 0; i < extras; i++) {
    const dur = entre(azar, 15, 50);
    const desde = entre(azar, arranque + 40, Math.max(arranque + 40, cierre - 40 - dur));
    const corte: Corte = { desde, hasta: desde + dur, motivo: "pausa" };
    const pisa = cortes.some((c) => corte.desde < c.hasta + 20 && corte.hasta + 20 > c.desde);
    if (!pisa && corte.hasta < cierre - 20) cortes.push(corte);
  }
  cortes.sort((a, b) => a.desde - b.desde);
  return { arranque, cierre: Math.max(arranque, cierre), factorCupo, factorEspera, cortes };
}

export type EstadoDelPlan =
  | { puede: true }
  | { puede: false; motivo: "antes" | "corte" | "despues"; reanuda: number | null; detalle: string };

/** Hora legible a partir de minutos desde las 0:00. */
export function horaLegible(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

/** ¿El plan del día deja enviar a esta hora? Si no, dice por qué y cuándo sigue. */
export function estadoDelPlan(plan: PlanDelDia, minutos: number): EstadoDelPlan {
  if (minutos < plan.arranque) {
    return { puede: false, motivo: "antes", reanuda: plan.arranque, detalle: `Hoy la línea empieza a enviar a las ${horaLegible(plan.arranque)}.` };
  }
  if (minutos >= plan.cierre) {
    return { puede: false, motivo: "despues", reanuda: null, detalle: `Hoy la línea terminó a las ${horaLegible(plan.cierre)}. Mañana sigue sola.` };
  }
  const corte = plan.cortes.find((c) => minutos >= c.desde && minutos < c.hasta);
  if (corte) {
    return {
      puede: false,
      motivo: "corte",
      reanuda: corte.hasta,
      detalle: `Pausa ${corte.motivo === "mediodía" ? "del mediodía" : "del día"} hasta las ${horaLegible(corte.hasta)}.`,
    };
  }
  return { puede: true };
}

/** Instante (Date) de unos minutos del día de `ahora`, en Argentina. */
export function instanteDelDia(ahora: Date, minutos: number): Date {
  const inicio = Date.parse(`${fechaArgentina(ahora)}T00:00:00-03:00`);
  return new Date(inicio + minutos * 60_000);
}

/** Cantidad de hoy: una parte del límite (nunca más que el límite, nunca menos de uno). */
export function cupoDelDia(limite: number, factor: number): number {
  if (!Number.isFinite(limite)) return limite;
  return Math.max(1, Math.min(limite, Math.floor(limite * factor)));
}

// ── 3 y 4. Parecido y elección del texto ─────────────────────────────────

/** Texto comparable: minúsculas, sin acentos, sin signos ni variables. */
export function normalizarParaComparar(texto: string): string {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\{\{\s*\w+\s*\}\}/g, " ")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function paresDePalabras(texto: string): Map<string, number> {
  const palabras = normalizarParaComparar(texto).split(" ").filter(Boolean);
  const m = new Map<string, number>();
  if (palabras.length === 1) m.set(palabras[0], 1);
  for (let i = 0; i < palabras.length - 1; i++) {
    const k = `${palabras[i]} ${palabras[i + 1]}`;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

/** Parecido entre dos textos, de 0 (nada en común) a 1 (iguales), por pares de palabras. */
export function parecido(a: string, b: string): number {
  return parecidoDePares(paresDePalabras(a), paresDePalabras(b));
}

function parecidoDePares(pa: Map<string, number>, pb: Map<string, number>): number {
  const ta = [...pa.values()].reduce((x, y) => x + y, 0);
  const tb = [...pb.values()].reduce((x, y) => x + y, 0);
  if (!ta || !tb) return ta === tb ? 1 : 0;
  let comun = 0;
  for (const [k, n] of pa) comun += Math.min(n, pb.get(k) ?? 0);
  return (2 * comun) / (ta + tb);
}

/** Desde cuánto dos variantes se consideran casi iguales. */
export const UMBRAL_PARECIDO = 0.8;

/**
 * Pares de textos de una plantilla que son casi iguales (para avisar en la
 * pantalla de plantillas). Índices sobre [cuerpo, ...variantes].
 */
export function variantesMuyParecidas(textos: string[], umbral = UMBRAL_PARECIDO): { a: number; b: number; parecido: number }[] {
  const pares: { a: number; b: number; parecido: number }[] = [];
  for (let i = 0; i < textos.length; i++) {
    if (!textos[i]?.trim()) continue;
    for (let j = i + 1; j < textos.length; j++) {
      if (!textos[j]?.trim()) continue;
      const p = parecido(textos[i], textos[j]);
      if (p >= umbral) pares.push({ a: i, b: j, parecido: Math.round(p * 100) / 100 });
    }
  }
  return pares;
}

export interface EnvioReciente {
  plantillaId: string | null;
  texto: string;
}

export interface PlantillaElegible {
  id: string;
  nombre: string;
  cuerpo: string;
  variantes: string[];
}

/** Cuántas plantillas recientes de la línea no se repiten, y contra cuántos textos se mide el parecido. */
export const MEMORIA_TEXTOS = { plantillas: 3, textos: 40 };

/**
 * Elige plantilla y texto al azar para este envío. No repite ninguna de las
 * últimas plantillas de la línea (si hay otras) ni un texto muy parecido a
 * los enviados hace poco. Si todo se parece (pocas plantillas), relaja la
 * regla de a un paso y sigue: nunca deja de elegir.
 */
export function elegirTextoAlAzar<T extends PlantillaElegible>(
  rotacion: T[],
  recientes: EnvioReciente[],
  azar: () => number = Math.random
): { plantilla: T; texto: string } | null {
  if (!rotacion.length) return null;
  const ultimasPlantillas = recientes
    .slice(0, Math.min(MEMORIA_TEXTOS.plantillas, rotacion.length - 1))
    .map((r) => r.plantillaId)
    .filter(Boolean) as string[];
  const paresRecientes = recientes.slice(0, MEMORIA_TEXTOS.textos).map((r) => paresDePalabras(r.texto));
  // Parecido máximo de cada texto con lo enviado hace poco (se calcula una sola vez).
  const conMaximo = rotacion.map((p) => ({
    plantilla: p,
    textos: [p.cuerpo, ...p.variantes]
      .filter((t) => t?.trim())
      .map((t) => {
        const pt = paresDePalabras(t);
        return { texto: t, maximo: paresRecientes.reduce((m, pr) => Math.max(m, parecidoDePares(pt, pr)), 0) };
      }),
  }));

  const candidatos = (exigirPlantilla: boolean, umbral: number) =>
    conMaximo
      .filter((c) => !exigirPlantilla || !ultimasPlantillas.includes(c.plantilla.id))
      .map((c) => ({ plantilla: c.plantilla, textos: c.textos.filter((t) => t.maximo < umbral).map((t) => t.texto) }))
      .filter((c) => c.textos.length > 0);

  // De lo más exigente a lo menos: sin plantillas recientes y nada parecido; después se relaja.
  const pasos: [boolean, number][] = [
    [true, UMBRAL_PARECIDO],
    [false, UMBRAL_PARECIDO],
    [true, 0.95],
    [false, 1.01],
  ];
  for (const [exigir, umbral] of pasos) {
    const lista = candidatos(exigir, umbral);
    if (!lista.length) continue;
    const elegida = lista[Math.floor(azar() * lista.length)];
    const texto = elegida.textos[Math.floor(azar() * elegida.textos.length)];
    return { plantilla: elegida.plantilla, texto };
  }
  const p = rotacion[Math.floor(azar() * rotacion.length)];
  return { plantilla: p, texto: p.cuerpo };
}
