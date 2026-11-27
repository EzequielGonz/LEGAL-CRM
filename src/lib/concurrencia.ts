/**
 * Corre una tarea por elemento con concurrencia limitada y tiempo máximo por
 * elemento (22/11). Pura y sin red: sirve para que una llamada colgada no
 * atrase todo lo demás del latido.
 *
 *  - `concurrencia`: cuántos elementos corren a la vez.
 *  - `tiempoMs`: pasado ese tiempo, el elemento se da por «sin tiempo» y se
 *    sigue con los demás. La tarea original no se puede cancelar: queda
 *    corriendo hasta terminar, por eso cada tarea debe ser segura de repetir
 *    (las campañas tienen bloqueo por campaña).
 *  - `presupuestoMs`: pasado ese tiempo no se empieza ningún elemento nuevo.
 *  - Los resultados salen en el mismo orden que los elementos.
 */
export interface OpcionesConTope<T, R> {
  concurrencia?: number;
  tiempoMs: number;
  presupuestoMs?: number;
  /** Resultado de un elemento que no empezó o que se pasó de tiempo. */
  sinTiempo: (item: T, motivo: "no_empezo" | "tiempo_agotado" | "error") => R;
  /** Aviso de lo ocurrido (para el registro del servidor). */
  alFallar?: (item: T, err: unknown) => void;
  ahora?: () => number;
}

export async function mapConTope<T, R>(items: readonly T[], fn: (item: T) => Promise<R>, opts: OpcionesConTope<T, R>): Promise<R[]> {
  const ahora = opts.ahora ?? Date.now;
  const inicio = ahora();
  const resultados = new Array<R>(items.length);
  let siguiente = 0;
  const trabajadores = Math.max(1, Math.min(opts.concurrencia ?? 4, items.length || 1));

  async function uno(i: number): Promise<void> {
    const item = items[i];
    if (opts.presupuestoMs !== undefined && ahora() - inicio >= opts.presupuestoMs) {
      resultados[i] = opts.sinTiempo(item, "no_empezo");
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tope = new Promise<"tiempo">((resolve) => {
      timer = setTimeout(() => resolve("tiempo"), opts.tiempoMs);
    });
    const tarea = fn(item);
    try {
      const r = await Promise.race([tarea, tope]);
      if (r === "tiempo") {
        // Si termina después del tiempo y falla, ese error no debe quedar sin atender.
        tarea.catch((err) => opts.alFallar?.(item, err));
        resultados[i] = opts.sinTiempo(item, "tiempo_agotado");
      } else {
        resultados[i] = r as R;
      }
    } catch (err) {
      opts.alFallar?.(item, err);
      resultados[i] = opts.sinTiempo(item, "error");
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  await Promise.all(
    Array.from({ length: trabajadores }, async () => {
      while (siguiente < items.length) {
        const i = siguiente++;
        await uno(i);
      }
    })
  );
  return resultados;
}
