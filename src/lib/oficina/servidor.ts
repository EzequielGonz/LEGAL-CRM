import { contextoParaGemini } from "@/lib/oficina/contexto-servidor";
import { GoogleGenAI } from "@google/genai";
import { identificadorModelo } from "@/lib/agentes/modelo";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Alcance } from "@/lib/alcance";
import { chequearTopeGemini, leerConfigPresupuesto, leerGastoGemini, leerGastoGeminiConCache } from "@/lib/presupuesto/servidor";
import { costoEstimadoUsd, evaluarPresupuesto } from "@/lib/presupuesto/reglas";
import { claseFinal, puedeGemini } from "@/lib/oficina/clases";
import {
  SEGUNDOS_LIMITE_CANDIDATO,
  SEGUNDOS_LIMITE_JUEZ,
  correrArena,
  normalizarCandidatos,
  planArena,
  promptCandidato,
  puedeReclamarParaGemini,
  resultadoConArena,
  enfoqueDeCandidato,
  type GeneradorOficina,
  type RespuestaGenerador,
} from "@/lib/oficina/ejecucion";
import { TEXTO_SIN_CLAUDE, filaATareaOficina, leerTriaje, promptTriaje, rutaPorPalabras, tituloDePedido, type Paso, type TareaOficina, type Triaje } from "@/lib/oficina/reglas";

/**
 * Oficina de agentes, lado servidor (22/11, ampliado el 27/11):
 *  - el triaje con Gemini (ordena: qué áreas y en qué orden), ahora dentro
 *    del tope de USD 30 y con el gasto registrado como uso 'oficina';
 *  - las lecturas de la base para la pantalla;
 *  - el disparo de Claude (honesto: dice si está conectado);
 *  - «Que lo haga Gemini»: la corrida de la arena, solo por botón.
 */

let _cliente: GoogleGenAI | null = null;
function gemini(): GoogleGenAI {
  if (!_cliente) _cliente = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return _cliente;
}

function usoDe(r: any): { entrada: number; salida: number } {
  const u: any = r?.usageMetadata ?? {};
  return { entrada: Number(u.promptTokenCount) || 0, salida: (Number(u.candidatesTokenCount) || 0) + (Number(u.thoughtsTokenCount) || 0) };
}

function textoDe(r: any): string {
  return (r?.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? "").join("");
}

/**
 * Deja el gasto de la Oficina en el mismo registro que usan los bots
 * (agent_turn_logs), así cuenta para el tope único de USD 30 del mes. Uso
 * 'oficina' y la tarea en bandeja_id (migración 0652). Nunca lanza.
 */
export async function registrarGastoOficina(r: {
  rubroId: string | null;
  bandejaId: string | null;
  llamadas: number;
  tokensEntrada: number;
  tokensSalida: number;
  costoUsd: number | null;
  latenciaMs: number;
  resultado: "enviado" | "sin_texto" | "error" | "bloqueado";
  herramientas: string[];
  error?: string | null;
}): Promise<void> {
  if (r.llamadas <= 0) return;
  try {
    const { error } = await createAdminClient()
      .from("agent_turn_logs" as any)
      .insert({
        experiment_id: null,
        candidato: null,
        opportunity_id: null,
        conversation_id: null,
        rubro_id: r.rubroId,
        bandeja_id: r.bandejaId,
        proveedor: "gemini_api",
        modelo_pedido: identificadorModelo(),
        modelo_respuesta: null,
        llamadas: r.llamadas,
        tokens_entrada: r.tokensEntrada,
        tokens_salida: r.tokensSalida,
        tokens_razonamiento: 0,
        costo_usd: r.costoUsd,
        latencia_ms: r.latenciaMs,
        herramientas: ["oficina", ...r.herramientas],
        resultado: r.resultado,
        validador_motivos: [],
        error: r.error ? String(r.error).slice(0, 500) : null,
        uso: "oficina",
      });
    if (error) console.error("[oficina/gasto] No se pudo registrar el gasto:", error.message);
  } catch (e) {
    console.error("[oficina/gasto] No se pudo registrar el gasto:", e instanceof Error ? e.message : e);
  }
}

export async function triar(pedido: string, alcance: Alcance | null = null, rubroId: string | null = null): Promise<Triaje & { fuente: "gemini" | "palabras" }> {
  const porPalabras = () => ({ titulo: tituloDePedido(pedido), ruta: rutaPorPalabras(pedido), plan: "", rapida: false, clase: null, fuente: "palabras" as const });
  if (!process.env.GEMINI_API_KEY) return porPalabras();
  const tope = await chequearTopeGemini({ rubroId });
  if (tope.bloquea) return porPalabras();
  const inicio = Date.now();
  try {
    const r = await Promise.race([
      gemini().models.generateContent({
        model: identificadorModelo(),
        contents: [{ role: "user", parts: [{ text: promptTriaje(pedido, alcance) }] }],
        config: { responseMimeType: "application/json" },
      }),
      new Promise<never>((_, no) => setTimeout(() => no(new Error("tiempo")), 12000)),
    ]);
    const u = usoDe(r);
    const config = await leerConfigPresupuesto().catch(() => null);
    await registrarGastoOficina({
      rubroId,
      bandejaId: null,
      llamadas: 1,
      tokensEntrada: u.entrada,
      tokensSalida: u.salida,
      costoUsd: config ? costoEstimadoUsd(u, config) : null,
      latenciaMs: Date.now() - inicio,
      resultado: "enviado",
      herramientas: ["triaje"],
    });
    return { ...leerTriaje(textoDe(r), pedido), fuente: "gemini" };
  } catch (e) {
    console.error("[oficina/triaje]", e instanceof Error ? e.message : e);
    return porPalabras();
  }
}

/** Columnas de antes de la 0651/0652 (por si la base todavía no tiene las nuevas). */
const COLUMNAS_BASE = "id, rubro_id, estado, area, ruta, recorrido, titulo, pedido, triaje, decision, decision_nota, resultado, resultado_enlaces, motivo_espera, tomada_at, updated_at, created_at";
export const COLUMNAS_OFICINA = `${COLUMNAS_BASE}, alcance, grupo_id, ejecutor, clase, repaso, repaso_nota, resultado_gemini, arena, arena_candidatos, costo_usd, intentos, ultimo_error`;

/** Error de Postgres «la columna no existe»: la migración todavía no se aplicó. */
const sinColumna = (e: any) => e?.code === "42703" || /column .* does not exist/i.test(String(e?.message ?? ""));

export interface Arranque {
  pedido_at: string;
  estado: string;
  nota: string | null;
  tareas: number | null;
  terminado_at: string | null;
}

export interface EstadoGemini {
  mesUsd: number;
  mensualUsd: number;
  porcentaje: number;
  /** libre, aviso (80 %), tope_dia o tope_mes. */
  estado: string;
}

export interface LecturaOficina {
  tareas: TareaOficina[];
  arranque: Arranque | null;
  /** Si el disparo de Claude está configurado (nunca el valor). */
  disparo: { conectado: boolean };
  /** Gasto de Gemini del mes (tope único compartido con los bots), o null si no se pudo leer. */
  gemini: EstadoGemini | null;
}

/** ¿Están cargadas las variables del disparo? Solo dice sí o no. */
export function disparoConectado(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.OFICINA_DISPARO_URL?.trim() && env.OFICINA_DISPARO_TOKEN?.trim());
}

export async function estadoGemini(): Promise<EstadoGemini | null> {
  try {
    // 27/11: con la memoria de un minuto; la Oficina consulta cada 8 s.
    const { config, gasto } = await leerGastoGeminiConCache();
    const porcentaje = Math.round((gasto.mesUsd / config.mensualUsd) * 1000) / 10;
    const estado = gasto.mesUsd >= config.mensualUsd ? "tope_mes" : gasto.mesUsd >= config.mensualUsd * config.avisoFraccion ? "aviso" : "libre";
    return { mesUsd: Math.round(gasto.mesUsd * 100) / 100, mensualUsd: config.mensualUsd, porcentaje, estado };
  } catch (e) {
    console.error("[oficina/gemini]", e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * Lo que muestra la Oficina: todas las tareas abiertas (de todos los rubros,
 * de los grupos y del panel: es la pantalla general), las entregas y lo
 * cerrado hace poco de la Oficina, el último arranque, si Claude está
 * conectado y el gasto de Gemini. Las «lista» de la bandeja vieja no se
 * muestran como «esperando tu OK».
 */
export async function leerOficina(): Promise<LecturaOficina | null> {
  try {
    const db = createAdminClient();
    // Cerradas: las de la Oficina y cualquier otra que haya ejecutado alguien desde acá
    // (una tarea de la Bandeja que pasó por Gemini tiene que verse en «Para repasar»).
    // 27/11 (auditoría): las «lista» sin decisión (esperan el OK o el repaso) van en
    // una consulta aparte: antes compartían el límite de 40 con las cerradas y,
    // con muchas cerradas recientes, una entrega pendiente podía no verse.
    const cerradasDe = (cols: string, conEjecutor: boolean) =>
      conEjecutor
        ? db.from("bandeja_claude" as any).select(cols).or("origen.eq.oficina,ejecutor.not.is.null")
        : db.from("bandeja_claude" as any).select(cols).eq("origen", "oficina");
    const consultar = (cols: string, conEjecutor: boolean) =>
      Promise.all([
        db.from("bandeja_claude" as any).select(cols).in("estado", ["pendiente", "en_curso", "en_espera"]).order("created_at", { ascending: true }).limit(80),
        cerradasDe(cols, conEjecutor).in("estado", ["lista", "descartada"]).order("updated_at", { ascending: false }).limit(40),
        cerradasDe(cols, conEjecutor).eq("estado", "lista").is("decision", null).order("updated_at", { ascending: false }).limit(100),
      ]);
    let [abiertas, cerradas, sinDecision] = await consultar(COLUMNAS_OFICINA, true);
    if (sinColumna(abiertas.error) || sinColumna(cerradas.error) || sinColumna(sinDecision.error)) [abiertas, cerradas, sinDecision] = await consultar(COLUMNAS_BASE, false);
    if (abiertas.error || cerradas.error || sinDecision.error) throw abiertas.error ?? cerradas.error ?? sinDecision.error;
    const [arr, gem] = await Promise.all([
      db.from("oficina_arranques" as any).select("pedido_at, estado, nota, tareas, terminado_at").order("pedido_at", { ascending: false }).limit(1).maybeSingle(),
      estadoGemini(),
    ]);
    const vistas = new Set<string>();
    const filas = [...(abiertas.data ?? []), ...(sinDecision.data ?? []), ...(cerradas.data ?? [])].filter((f: any) => {
      if (!f?.id || vistas.has(f.id)) return false;
      vistas.add(f.id);
      return true;
    });
    const tareas = filas.map(filaATareaOficina).filter((t): t is TareaOficina => Boolean(t));
    return { tareas, arranque: (arr.data as Arranque | null) ?? null, disparo: { conectado: disparoConectado() }, gemini: gem };
  } catch (e) {
    console.error("[oficina/leer]", e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * Dispara la sesión de Claude que procesa la Oficina. Usa una tarea
 * programada de Claude Code con disparo por API: la dirección y el token
 * se cargan como variables de Vercel (OFICINA_DISPARO_URL,
 * OFICINA_DISPARO_TOKEN y, si la API lo pide, OFICINA_DISPARO_BETA). Sin
 * esas variables no dispara nada y lo dice.
 */
export async function disparar(texto: string): Promise<{ estado: "disparado" | "sin_disparador" | "fallo"; nota: string }> {
  const url = process.env.OFICINA_DISPARO_URL;
  const token = process.env.OFICINA_DISPARO_TOKEN;
  if (!disparoConectado()) return { estado: "sin_disparador", nota: TEXTO_SIN_CLAUDE };
  let destino: URL;
  try {
    destino = new URL(url!);
  } catch {
    return { estado: "fallo", nota: "La dirección del disparo no es válida." };
  }
  if (destino.protocol !== "https:") return { estado: "fallo", nota: "La dirección del disparo tiene que ser https." };
  try {
    const headers: Record<string, string> = { "content-type": "application/json", authorization: `Bearer ${token}`, "anthropic-version": "2023-06-01" };
    if (process.env.OFICINA_DISPARO_BETA) headers["anthropic-beta"] = process.env.OFICINA_DISPARO_BETA;
    const r = await fetch(destino, { method: "POST", headers, body: JSON.stringify({ text: texto }), signal: AbortSignal.timeout(15000) });
    if (!r.ok) return { estado: "fallo", nota: `El disparo respondió ${r.status}.` };
    return { estado: "disparado", nota: "Claude recibió el aviso y va a tomar las tareas." };
  } catch (e) {
    return { estado: "fallo", nota: e instanceof Error && e.name === "TimeoutError" ? "El disparo no respondió a tiempo." : "No se pudo disparar." };
  }
}

// --- «Que lo haga Gemini» (solo por botón) ----------------------------------------

/** Generador real: una llamada a Gemini sin herramientas (solo texto). */
export function generadorGemini(modelo = identificadorModelo()): GeneradorOficina {
  return async (prompt, tipo): Promise<RespuestaGenerador> => {
    const r = await Promise.race([
      gemini().models.generateContent({
        model: modelo,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: tipo === "juez" ? { responseMimeType: "application/json" } : {},
      }),
      new Promise<never>((_, no) => setTimeout(() => no(new Error("Gemini no respondió a tiempo.")), (tipo === "juez" ? SEGUNDOS_LIMITE_JUEZ : SEGUNDOS_LIMITE_CANDIDATO) * 1000)),
    ]);
    const u = usoDe(r);
    return { texto: textoDe(r), tokensEntrada: u.entrada, tokensSalida: u.salida };
  };
}

export type ResultadoEjecucion = { ok: true; tarea: TareaOficina; aviso: string | null } | { ok: false; status: number; error: string };

const paso = (nota: string, agente: string, modelo: string, area: Paso["area"] = "direccion", ahora = new Date()): Paso => ({ area, agente, nota: nota.slice(0, 400), at: ahora.toISOString(), ejecutor: "gemini", modelo });

/**
 * Corre una tarea con Gemini en modo arena. Pasos:
 *  1. Lee la tarea y comprueba que se pueda (no la tiene Claude, no es de
 *     código, publicación ni envío).
 *  2. Tope de USD 30 compartido: si el mes está topeado, no llama.
 *  3. Calcula cuántas respuestas entran (`planArena` → `topeDeCandidatos`).
 *  4. La reclama con una actualización condicionada (si cambió, no la pisa).
 *  5. Corre la arena, registra el gasto (uso 'oficina') y deja el resultado
 *     «Hecho por Gemini · sin repasar», o la deja en espera con el motivo.
 */
export async function ejecutarConGemini(id: string, opciones: { candidatos?: unknown } = {}, generar?: GeneradorOficina): Promise<ResultadoEjecucion> {
  if (!generar && !process.env.GEMINI_API_KEY) return { ok: false, status: 503, error: "Gemini no está configurado en el panel." };
  const db = createAdminClient();
  const leida = await db.from("bandeja_claude" as any).select(COLUMNAS_OFICINA).eq("id", id).maybeSingle();
  if (leida.error) return { ok: false, status: sinColumna(leida.error) ? 503 : 500, error: sinColumna(leida.error) ? "Falta aplicar la migración de la Oficina (0652)." : "No se pudo leer la tarea." };
  const t = filaATareaOficina(leida.data);
  if (!t) return { ok: false, status: 404, error: "No encontré esa tarea." };

  const reclamo = puedeReclamarParaGemini(t);
  if (!reclamo.ok) return { ok: false, status: 409, error: reclamo.motivo };
  const clase = t.clase ?? claseFinal(null, t.pedido, t.ruta);
  const permiso = puedeGemini(clase);
  if (!permiso.ok) return { ok: false, status: 409, error: permiso.motivo };

  // Tope único de USD 30 compartido con los bots. A diferencia de un bot, la Oficina NO corre si no
  // se puede medir el gasto (más conservador: es un gasto a pedido, no una respuesta a una persona).
  let lectura: Awaited<ReturnType<typeof leerGastoGemini>>;
  try {
    lectura = await leerGastoGemini();
  } catch {
    return { ok: false, status: 503, error: "No pude medir el gasto de Gemini del mes: por las dudas no corre. Probá en un rato o dejala para Claude." };
  }
  const { config, gasto } = lectura;
  const tope = evaluarPresupuesto({ mesUsd: gasto.mesUsd, diaPerfilUsd: t.rubro_id ? gasto.porRubro[t.rubro_id]?.diaUsd ?? 0 : 0 }, config);
  if (tope.bloquea || gasto.mesUsd >= config.mensualUsd) return { ok: false, status: 409, error: `Tope del mes de Gemini alcanzado: ${tope.motivo} La tarea queda para Claude.` };
  const modelo = identificadorModelo();
  const entrada = { titulo: t.titulo, pedido: t.pedido, plan: t.triaje, ruta: t.ruta, alcance: t.alcance, contexto: contextoParaGemini(t.titulo, t.pedido) };
  const pedidos = normalizarCandidatos(opciones.candidatos ?? t.arena_candidatos ?? undefined);
  const plan = planArena({ pedidos, restanteMesUsd: config.mensualUsd - gasto.mesUsd, promptEjemplo: promptCandidato(entrada, enfoqueDeCandidato(0, t.ruta)), precios: config });
  if (plan.n === 0) return { ok: false, status: 409, error: plan.aviso ?? "No queda presupuesto de Gemini para esta tarea." };

  const ahora = new Date();
  // Los pasos de avance van al primer escritorio de la ruta; el del juez, a Dirección.
  const areaTrabajo: Paso["area"] = t.ruta.find((a) => a !== "direccion") ?? "direccion";
  let recorrido = [...t.recorrido, paso(`Gemini arrancó la arena: ${plan.n} respuesta${plan.n === 1 ? "" : "s"} compiten${plan.aviso ? ` (${plan.aviso})` : ""}.`, "Gemini", modelo, areaTrabajo, ahora)];
  const reclamada = await db
    .from("bandeja_claude" as any)
    .update({
      estado: "en_curso",
      ejecutor: "gemini",
      clase,
      tomada_at: t.tomada_at ?? ahora.toISOString(),
      arena_candidatos: pedidos,
      intentos: t.intentos + 1,
      ultimo_error: null,
      motivo_espera: null,
      recorrido,
    })
    .eq("id", id)
    .eq("updated_at", t.updated_at)
    .select("id")
    .maybeSingle();
  if (reclamada.error) return { ok: false, status: 500, error: "No se pudo tomar la tarea." };
  if (!reclamada.data) return { ok: false, status: 409, error: "La tarea cambió mientras tanto. Recargá la Oficina." };

  const cerrar = async (cambios: Record<string, unknown>) => {
    const { data, error } = await db.from("bandeja_claude" as any).update(cambios).eq("id", id).eq("estado", "en_curso").eq("ejecutor", "gemini").select(COLUMNAS_OFICINA).maybeSingle();
    if (error) console.error("[oficina/gemini/cerrar]", error.message);
    return data ? filaATareaOficina(data) : null;
  };

  try {
    let ultimoGasto = Date.now();
    const corrida = await correrArena(entrada, plan.n, generar ?? generadorGemini(modelo), {
      precios: config,
      modelo,
      pedidos,
      alAvanzar: async (texto) => {
        recorrido = [...recorrido, paso(texto, "Gemini", modelo, areaTrabajo)];
        await db.from("bandeja_claude" as any).update({ recorrido }).eq("id", id).eq("estado", "en_curso");
      },
      // 27/11 (auditoría): el gasto se registra por tanda y no solo al final, para que
      // cuente en el tope de USD 30 aunque la función se corte a mitad de camino.
      alGastar: async (g) => {
        const ahoraMs = Date.now();
        await registrarGastoOficina({
          rubroId: t.rubro_id,
          bandejaId: id,
          llamadas: g.llamadas,
          tokensEntrada: g.tokensEntrada,
          tokensSalida: g.tokensSalida,
          costoUsd: g.costoUsd,
          latenciaMs: ahoraMs - ultimoGasto,
          resultado: g.sirvio ? "enviado" : "sin_texto",
          herramientas: ["arena", g.tipo === "juez" ? "juez" : `candidatos:${g.llamadas}`],
          error: null,
        });
        ultimoGasto = ahoraMs;
      },
    });
    // Aviso para el dueño: presupuesto o tope por corrida, y si el plazo cortó tandas.
    const recorte = corrida.recortadas
      ? `Por el tiempo de la función corrieron ${corrida.arena.corridos} de ${plan.n} respuestas; podés volver a pedirle a Gemini otra vuelta.`
      : null;
    const aviso = [plan.aviso, recorte].filter(Boolean).join(" ") || null;
    const costo = Math.round((t.costo_usd + corrida.costoUsd) * 10_000) / 10_000;
    if (!corrida.resultado) {
      recorrido = [...recorrido, paso(corrida.falla ?? "Sin ganador.", "Juez de la arena (Gemini)", modelo)];
      const tarea = await cerrar({ estado: "en_espera", motivo_espera: corrida.falla, ultimo_error: corrida.falla, arena: corrida.arena, costo_usd: costo, recorrido });
      return tarea ? { ok: true, tarea, aviso: [corrida.falla, recorte].filter(Boolean).join(" ") || null } : { ok: false, status: 409, error: "La tarea cambió mientras Gemini trabajaba." };
    }
    const nota =
      corrida.arena.corridos > 1
        ? `Ganó ${corrida.arena.ganadorId} entre ${corrida.arena.corridos} respuestas${corrida.arena.promedio !== null ? ` (${corrida.arena.promedio}/10)` : ""}. ${corrida.arena.porque}`
        : corrida.arena.porque;
    recorrido = [...recorrido, paso(nota, "Juez de la arena (Gemini)", modelo)];
    const tarea = await cerrar({
      estado: "lista",
      resultado: resultadoConArena(corrida.resultado, corrida.arena),
      resultado_gemini: corrida.resultado,
      repaso: "sin_repasar",
      repaso_nota: null,
      repaso_at: null,
      decision: null,
      arena: corrida.arena,
      costo_usd: costo,
      cerrada_at: new Date().toISOString(),
      recorrido,
    });
    return tarea ? { ok: true, tarea, aviso } : { ok: false, status: 409, error: "La tarea cambió mientras Gemini trabajaba." };
  } catch (e) {
    const motivo = e instanceof Error ? e.message.slice(0, 200) : "Gemini falló.";
    console.error("[oficina/gemini]", motivo);
    await cerrar({ estado: "en_espera", motivo_espera: `Gemini no pudo terminar: ${motivo}`, ultimo_error: motivo, recorrido: [...recorrido, paso(`No pudo terminar: ${motivo}`, "Gemini", modelo, areaTrabajo)] });
    return { ok: false, status: 502, error: `Gemini no pudo terminar: ${motivo}` };
  }
}

