/**
 * Laboratorio del bot (15/11): modelos de Gemini disponibles para la clave
 * del servidor. Listar modelos no genera texto ni tiene costo. Si la API no
 * responde, se usa la lista configurable (LABORATORIO_MODELOS, separados por
 * coma) y siempre el modelo que usa hoy el servidor. Nunca se lee ni se
 * muestra la clave.
 */
import { GoogleGenAI } from "@google/genai";
import { identificadorModelo } from "@/lib/agentes/modelo";
import { listaDeModelos } from "./reglas";

let cache: { at: number; valor: { modelos: string[]; origen: "api" | "configuracion"; delServidor: string } } | null = null;
const TTL_MS = 10 * 60_000;

export async function modelosDisponibles(): Promise<{ modelos: string[]; origen: "api" | "configuracion"; delServidor: string }> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.valor;
  const delServidor = identificadorModelo();
  let deLaApi: string[] | null = null;
  if ((process.env.GEMINI_API_KEY ?? "").trim()) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const pager = await ai.models.list({ config: { pageSize: 100 } });
      const nombres: string[] = [];
      for await (const m of pager) {
        const acciones = (m as any).supportedActions as string[] | undefined;
        if (m.name && (!acciones || acciones.includes("generateContent"))) nombres.push(m.name);
        if (nombres.length >= 200) break;
      }
      deLaApi = nombres;
    } catch (err) {
      console.error("[laboratorio] No se pudo listar los modelos de Gemini; se usa la lista configurable:", (err as Error)?.message ?? err);
    }
  }
  const valor = { ...listaDeModelos({ deLaApi, configurables: process.env.LABORATORIO_MODELOS, delServidor }), delServidor };
  cache = { at: Date.now(), valor };
  return valor;
}
