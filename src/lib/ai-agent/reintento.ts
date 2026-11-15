/**
 * 15/11 (auditoría): una llamada al modelo que tarda demasiado o falla se corta
 * a los 20 segundos y se reintenta una sola vez. Si vuelve a fallar, el error
 * sube y el turno queda registrado como «error» (el rescate lo vuelve a probar
 * una vez y, si tampoco sale, el chat pasa a una persona). Pura y sin red.
 */
export const LLAMADA_MODELO = { tiempoMs: 20_000, reintentos: 1, esperaMs: 1_500 };
/** Revisión 15/11: marca del error de un turno cuando falló la IA (el rescate solo reintenta estos). */
export const MARCA_FALLA_MODELO = "falla_modelo";

/** Revisión 15/11: solo vale reintentar una falla pasajera (tiempo agotado, 429, 5xx o red). Pura. */
export function esFallaTransitoria(err: unknown): boolean {
  if (err instanceof TiempoAgotadoError) return true;
  const e: any = err;
  const status = Number(e?.status ?? e?.code ?? e?.response?.status);
  if (Number.isFinite(status) && status > 0) return status === 408 || status === 429 || status >= 500;
  return /timeout|ECONNRESET|ETIMEDOUT|fetch failed|network|socket|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded/i.test(String(e?.message ?? e));
}

export class TiempoAgotadoError extends Error {
  constructor(ms: number) {
    super(`El modelo no respondió en ${Math.round(ms / 1000)} segundos.`);
    this.name = "TiempoAgotadoError";
  }
}

/** Corre `fn` con tiempo máximo; si falla o se pasa, reintenta `reintentos` veces. */
export async function conTiempoYReintento<T>(
  fn: () => Promise<T>,
  opts: { tiempoMs?: number; reintentos?: number; esperaMs?: number; esperar?: (ms: number) => Promise<void>; debeReintentar?: (err: unknown) => boolean } = {}
): Promise<T> {
  const tiempoMs = opts.tiempoMs ?? LLAMADA_MODELO.tiempoMs;
  const reintentos = opts.reintentos ?? LLAMADA_MODELO.reintentos;
  const esperaMs = opts.esperaMs ?? LLAMADA_MODELO.esperaMs;
  const esperar = opts.esperar ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  let ultimo: unknown;
  for (let intento = 0; intento <= reintentos; intento++) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        fn(),
        new Promise<never>((_, rej) => {
          timer = setTimeout(() => rej(new TiempoAgotadoError(tiempoMs)), tiempoMs);
        }),
      ]);
    } catch (err) {
      ultimo = err;
      if (opts.debeReintentar && !opts.debeReintentar(err)) break;
      if (intento < reintentos) await esperar(esperaMs);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  throw ultimo;
}
