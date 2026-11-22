import { GoogleGenAI } from "@google/genai";
import { identificadorModelo } from "@/lib/agentes/modelo";
import { createAdminClient } from "@/lib/supabase/admin";
import { filaATareaOficina, leerTriaje, promptTriaje, rutaPorPalabras, tituloDePedido, type TareaOficina, type Triaje } from "@/lib/oficina/reglas";

/**
 * Oficina de agentes (22/11), lado servidor: el triaje con Gemini y las
 * lecturas de la base. Gemini solo ordena (qué áreas y en qué orden): no
 * resuelve ni publica nada. Si Gemini no responde, ordena por palabras.
 */

let _cliente: GoogleGenAI | null = null;

export async function triar(pedido: string): Promise<Triaje & { fuente: "gemini" | "palabras" }> {
  if (!process.env.GEMINI_API_KEY) return { titulo: tituloDePedido(pedido), ruta: rutaPorPalabras(pedido), plan: "", rapida: false, fuente: "palabras" };
  try {
    if (!_cliente) _cliente = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const r = await Promise.race([
      _cliente.models.generateContent({
        model: identificadorModelo(),
        contents: [{ role: "user", parts: [{ text: promptTriaje(pedido) }] }],
        config: { responseMimeType: "application/json" },
      }),
      new Promise<never>((_, no) => setTimeout(() => no(new Error("tiempo")), 12000)),
    ]);
    const texto = (r.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? "").join("");
    return { ...leerTriaje(texto, pedido), fuente: "gemini" };
  } catch (e) {
    console.error("[oficina/triaje]", e instanceof Error ? e.message : e);
    return { titulo: tituloDePedido(pedido), ruta: rutaPorPalabras(pedido), plan: "", rapida: false, fuente: "palabras" };
  }
}

export const COLUMNAS_OFICINA = "id, estado, area, ruta, recorrido, titulo, pedido, decision, resultado, updated_at, created_at";

export interface Arranque {
  pedido_at: string;
  estado: string;
  nota: string | null;
  tareas: number | null;
  terminado_at: string | null;
}

/**
 * Lo que muestra la Oficina: todas las tareas abiertas de la bandeja (los agentes
 * las toman todas), las últimas entregas de la Oficina y el último arranque. Las
 * tareas «lista» de la bandeja vieja no se muestran como «esperando tu OK».
 */
export async function leerOficina(): Promise<{ tareas: TareaOficina[]; arranque: Arranque | null } | null> {
  try {
    const db = createAdminClient();
    const [abiertas, cerradas, arr] = await Promise.all([
      db.from("bandeja_claude" as any).select(COLUMNAS_OFICINA).in("estado", ["pendiente", "en_curso", "en_espera"]).order("created_at", { ascending: true }).limit(60),
      db.from("bandeja_claude" as any).select(COLUMNAS_OFICINA).in("estado", ["lista"]).eq("origen", "oficina").order("updated_at", { ascending: false }).limit(20),
      db.from("oficina_arranques" as any).select("pedido_at, estado, nota, tareas, terminado_at").order("pedido_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (abiertas.error || cerradas.error) throw abiertas.error ?? cerradas.error;
    const tareas = [...(abiertas.data ?? []), ...(cerradas.data ?? [])].map(filaATareaOficina).filter((t): t is TareaOficina => Boolean(t));
    return { tareas, arranque: (arr.data as Arranque | null) ?? null };
  } catch (e) {
    console.error("[oficina/leer]", e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * Dispara la sesión de Claude que procesa la Oficina. Usa una tarea
 * programada de Claude Code con disparo por API: la dirección y el token
 * se cargan como variables de Vercel en la sesión «accesos»
 * (OFICINA_DISPARO_URL, OFICINA_DISPARO_TOKEN y, si la API lo pide,
 * OFICINA_DISPARO_BETA). Sin esas variables no dispara nada.
 */
export async function disparar(texto: string): Promise<{ estado: "disparado" | "sin_disparador" | "fallo"; nota: string }> {
  const url = process.env.OFICINA_DISPARO_URL;
  const token = process.env.OFICINA_DISPARO_TOKEN;
  if (!url || !token) return { estado: "sin_disparador", nota: "Falta conectar el disparo automático (sesión «accesos»)." };
  let destino: URL;
  try {
    destino = new URL(url);
  } catch {
    return { estado: "fallo", nota: "La dirección del disparo no es válida." };
  }
  if (destino.protocol !== "https:") return { estado: "fallo", nota: "La dirección del disparo tiene que ser https." };
  try {
    const headers: Record<string, string> = { "content-type": "application/json", authorization: `Bearer ${token}`, "anthropic-version": "2023-06-01" };
    if (process.env.OFICINA_DISPARO_BETA) headers["anthropic-beta"] = process.env.OFICINA_DISPARO_BETA;
    const r = await fetch(destino, { method: "POST", headers, body: JSON.stringify({ text: texto }), signal: AbortSignal.timeout(15000) });
    if (!r.ok) return { estado: "fallo", nota: `El disparo respondió ${r.status}.` };
    return { estado: "disparado", nota: "Los agentes arrancaron." };
  } catch (e) {
    return { estado: "fallo", nota: e instanceof Error && e.name === "TimeoutError" ? "El disparo no respondió a tiempo." : "No se pudo disparar." };
  }
}
