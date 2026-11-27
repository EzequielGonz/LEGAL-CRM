/**
 * Oficina · «Arrancar» con plan B (27/11, orden del dueño: «que arranque cuando
 * yo te lo pida también por más que no haya disparador»). Si la ruta de
 * arranque responde 503 o 502 (Claude sin conectar o el disparo falló), Gemini
 * resuelve de a una las tareas de la mesa de entrada que puede hacer. Lo usan
 * la Oficina, «Oficina ahora» del Cerebro y la barra de mando.
 *
 * Módulo de cliente: las reglas (qué tareas toma Gemini, qué se le avisa al
 * dueño) son funciones puras con prueba en tests/unitarias; `arrancarConGemini`
 * solo encadena los pedidos.
 */
import { puedeGemini, type Clase } from "@/lib/oficina/clases";
import { TEXTO_SIN_CLAUDE } from "@/lib/oficina/reglas";

export type AvisoArranque = { tipo: "ok" | "err"; texto: string };
type TareaArranque = { id: string; estado: string; clase?: Clase | null };

/** ¿La respuesta de /api/oficina/arrancar pide el plan B con Gemini? */
export function pideGemini(status: number): boolean {
  return status === 503 || status === 502;
}

/** Tareas de la mesa de entrada que Gemini puede resolver y cuántas quedan solo para Claude. */
export function repartoParaGemini<T extends TareaArranque>(tareas: T[]): { aptas: T[]; soloClaude: number } {
  const entrada = tareas.filter((t) => t.estado === "pendiente" || t.estado === "en_espera");
  const aptas = entrada.filter((t) => puedeGemini(t.clase).ok);
  return { aptas, soloClaude: entrada.length - aptas.length };
}

/** Aviso cuando no hay nada que Gemini pueda tomar. */
export function avisoSinAptas(soloClaude: number): AvisoArranque {
  return {
    tipo: "err",
    texto: soloClaude
      ? `Claude no está conectado y ${soloClaude === 1 ? "la tarea que espera es" : "las tareas que esperan son"} de código, publicación o envío: esas no las hace Gemini. Quedan en la mesa de entrada.`
      : TEXTO_SIN_CLAUDE,
  };
}

/** Aviso mientras Gemini trabaja la tarea `i` (desde 0) de `total`. */
export function avisoEnCurso(i: number, total: number): AvisoArranque {
  return { tipo: "ok", texto: `Claude no está conectado: Gemini está resolviendo la tarea ${i + 1} de ${total} (varias respuestas y un juez). Puede tardar unos minutos.` };
}

/** Aviso final de la vuelta con Gemini. */
export function avisoFinal(hechas: number, aptas: number, soloClaude: number, ultimoError: string): AvisoArranque {
  const resto = soloClaude ? ` ${soloClaude} ${soloClaude === 1 ? "queda" : "quedan"} para Claude (código, publicación o envío).` : "";
  if (hechas) return { tipo: "ok", texto: `Gemini resolvió ${hechas} de ${aptas}. ${hechas === 1 ? "Queda" : "Quedan"} «Hecho por Gemini · sin repasar».${ultimoError ? ` ${ultimoError}` : ""}${resto}` };
  return { tipo: "err", texto: `${ultimoError || "Gemini no pudo resolver las tareas."}${resto}` };
}

/** Lee las tareas vigentes de la Oficina (para quien no las tiene a mano). */
export async function leerTareasOficina(): Promise<TareaArranque[]> {
  const r = await fetch("/api/oficina", { cache: "no-store" }).catch(() => null);
  if (!r?.ok) return [];
  const d = await r.json().catch(() => null);
  return Array.isArray(d?.tareas) ? d.tareas : [];
}

/**
 * Sin disparo de Claude: Gemini resuelve, de a una, las tareas de la mesa de
 * entrada que puede hacer. Devuelve el aviso final (también lo pasa a `alAvisar`).
 */
export async function arrancarConGemini({
  tareas,
  alAvisar,
  recargar,
}: {
  tareas: TareaArranque[];
  alAvisar: (aviso: AvisoArranque) => void;
  recargar: () => Promise<void> | void;
}): Promise<AvisoArranque> {
  const { aptas, soloClaude } = repartoParaGemini(tareas);
  if (!aptas.length) {
    const aviso = avisoSinAptas(soloClaude);
    alAvisar(aviso);
    return aviso;
  }
  let hechas = 0;
  let ultimoError = "";
  for (const [i, t] of aptas.entries()) {
    alAvisar(avisoEnCurso(i, aptas.length));
    try {
      const pedidoGemini = fetch(`/api/oficina/${t.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accion: "gemini" }) });
      // A los 3 s la tarea ya figura «en marcha»: se refresca para que se vea el escritorio trabajando.
      const verla = setTimeout(() => void recargar(), 3000);
      const g = await pedidoGemini;
      clearTimeout(verla);
      const gd = await g.json().catch(() => ({}));
      if (g.ok) hechas++;
      else ultimoError = gd?.error || "Gemini no pudo con una tarea.";
    } catch {
      ultimoError = "Se cortó la conexión con Gemini.";
    }
    await recargar();
  }
  const aviso = avisoFinal(hechas, aptas.length, soloClaude, ultimoError);
  alAvisar(aviso);
  return aviso;
}
