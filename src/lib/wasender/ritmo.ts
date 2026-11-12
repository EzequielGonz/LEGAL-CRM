/**
 * Ritmo de envío de las campañas por Wasender (12/11).
 *
 * Wasender usa WhatsApp común, sin plantillas aprobadas: lo que cuida a la
 * línea es parecerse a una persona. Cuatro reglas, todas puras (se prueban
 * solas) y sin tocar el motor de Meta:
 *  1. Calentamiento: una línea nueva envía poco y sube de a escalones.
 *  2. Variantes obligatorias: nadie recibe el mismo texto que los demás.
 *  3. Espera irregular: segundos al azar y, cada tanto, una pausa larga.
 *  4. Freno automático: si muchos envíos fallan o no se entregan, se pausa.
 */

const DIA_MS = 24 * 60 * 60 * 1000;

/** Escalones del calentamiento: desde qué día (1 = el primero) y cuántos envíos por día. */
export const ESCALONES_CALENTAMIENTO: ReadonlyArray<{ desdeDia: number; tope: number }> = [
  { desdeDia: 1, tope: 20 },
  { desdeDia: 4, tope: 40 },
  { desdeDia: 8, tope: 80 },
  { desdeDia: 15, tope: 150 },
  { desdeDia: 22, tope: 250 },
];

/** Día de calentamiento de la línea (1 = el día que empezó). Sin fecha, se toma como el primero. */
export function diaDeCalentamiento(desde: string | Date | null | undefined, ahora: Date = new Date()): number {
  const inicio = desde ? new Date(desde).getTime() : NaN;
  if (Number.isNaN(inicio)) return 1;
  return Math.max(1, Math.floor((ahora.getTime() - inicio) / DIA_MS) + 1);
}

/** Tope de envíos por día que permite el calentamiento en ese día. */
export function topeDeCalentamiento(dia: number): number {
  let tope = ESCALONES_CALENTAMIENTO[0].tope;
  for (const e of ESCALONES_CALENTAMIENTO) if (dia >= e.desdeDia) tope = e.tope;
  return tope;
}

/**
 * Límite diario que vale hoy para la línea: el menor entre el que eligió la
 * responsable y el del calentamiento. El calentamiento nunca sube el límite elegido.
 */
export function limiteDiarioEfectivo(
  d: { limiteDiario: number | null; calentamientoDesde: string | Date | null | undefined },
  ahora: Date = new Date()
): { limite: number; dia: number; porCalentamiento: boolean } {
  const dia = diaDeCalentamiento(d.calentamientoDesde, ahora);
  const tope = topeDeCalentamiento(dia);
  const elegido = d.limiteDiario && d.limiteDiario > 0 ? d.limiteDiario : Number.POSITIVE_INFINITY;
  return { limite: Math.min(elegido, tope), dia, porCalentamiento: tope < elegido };
}

/** Variantes distintas que necesita una plantilla para salir en una campaña (contando el texto principal). */
export const MINIMO_TEXTOS_CAMPANA = 4;

/** ¿La plantilla tiene suficientes textos distintos? Compara sin mayúsculas ni espacios de más. */
export function textosDistintos(cuerpo: string, variantes: string[]): number {
  const limpio = (t: string) => t.toLowerCase().replace(/\s+/g, " ").trim();
  return new Set([cuerpo, ...variantes].map(limpio).filter(Boolean)).size;
}

const NO_ES_NOMBRE = /\d|@|\b(s\.?a\.?|s\.?r\.?l\.?|srl|sas|estudio|taller|kiosco|local|empresa|cliente|sin nombre|desconocido)\b/i;

/**
 * Primer nombre para saludar. Un mensaje con nombre y dos apellidos se nota
 * que salió de una base; con el primer nombre parece escrito a mano. Si lo
 * guardado no parece un nombre de persona, devuelve vacío (se saluda sin nombre).
 */
export function primerNombre(completo: string | null | undefined): string {
  const texto = (completo ?? "").trim();
  if (!texto || NO_ES_NOMBRE.test(texto)) return "";
  // «Pérez, Juan» → Juan.
  const base = texto.includes(",") ? texto.split(",")[1] ?? "" : texto;
  const primera = base.trim().split(/\s+/)[0] ?? "";
  const letras = primera.replace(/[^\p{L}'-]/gu, "");
  if (letras.length < 2 || letras.length > 20) return "";
  return letras.charAt(0).toLocaleUpperCase("es-AR") + letras.slice(1).toLocaleLowerCase("es-AR");
}

/**
 * Espera hasta el próximo envío, en segundos. Dentro del rango elegido, y una
 * de cada diez veces una pausa más larga (como alguien que deja el celular).
 * `azar` devuelve un número entre 0 y 1: se inyecta para poder probarla.
 */
export function esperaIrregular(min: number, max: number, azar: () => number = Math.random): number {
  const lo = Math.max(1, Math.min(min, max));
  const hi = Math.max(lo, Math.max(min, max));
  const base = Math.floor(azar() * (hi - lo + 1)) + lo;
  if (azar() < 0.1) return Math.round(base * (2 + azar() * 2));
  return base;
}

/** Segundos de desfase dentro del minuto, para que los envíos no salgan siempre en el segundo 00. */
export function desfaseEnElMinuto(azar: () => number = Math.random, maximo = 35): number {
  return Math.floor(azar() * (maximo + 1));
}

export interface MuestraDeEnvios {
  /** Envíos de la línea en la ventana (ya pasó el tiempo razonable para que se entreguen). */
  enviados: number;
  /** De esos, cuántos informó como fallidos. */
  fallidos: number;
  /** De esos, cuántos siguen sin entregarse. */
  sinEntregar: number;
}

export const MUESTRA_MINIMA_FRENO = 10;

/**
 * Freno automático. Con muestra suficiente, se frena si falló el 30 % o más,
 * o si la mitad o más no se entregó: son las dos señales de que WhatsApp está
 * limitando la línea. Devuelve el motivo para mostrarlo, o null si puede seguir.
 */
export function motivoDeFreno(m: MuestraDeEnvios): string | null {
  if (m.enviados < MUESTRA_MINIMA_FRENO) return null;
  const pFallo = m.fallidos / m.enviados;
  const pSinEntregar = (m.fallidos + m.sinEntregar) / m.enviados;
  if (pFallo >= 0.3) return `Freno automático: ${m.fallidos} de los últimos ${m.enviados} envíos fallaron. La línea puede estar limitada: esperá un día antes de reanudar.`;
  if (pSinEntregar >= 0.5) return `Freno automático: ${m.fallidos + m.sinEntregar} de los últimos ${m.enviados} envíos no se entregaron. Revisá la línea antes de reanudar.`;
  return null;
}
