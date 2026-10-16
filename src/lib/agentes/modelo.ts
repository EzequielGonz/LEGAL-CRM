/**
 * Etapa 3 · Modelo técnico: adaptador por proveedor (cap. 17.3).
 *
 *  - gemini_api: el proveedor actual (`@google/genai` con GEMINI_API_KEY).
 *  - vertex: modelo ajustado o candidato en Google Cloud; usa cuenta de
 *    servicio y endpoint propios (variables GCP_*). Cambiar una cadena de
 *    modelo con la misma API key NO acredita acceso: si faltan variables,
 *    el adaptador informa qué falta y no llama a nada.
 *  - simulado: guion determinista para pruebas y simulador sin costo.
 *
 * `informeModeloActivo` dice qué responde hoy (proveedor e identificador
 * efectivo) sin exponer claves.
 */

export type Proveedor = "gemini_api" | "vertex" | "simulado";

export interface PedidoModelo {
  contents: unknown[];
  systemInstruction: string;
  tools: unknown[];
}
export interface RespuestaModelo {
  parts: { text?: string; functionCall?: { id?: string; name?: string; args?: unknown } }[];
  tokensEntrada?: number;
  tokensSalida?: number;
}
export type Generador = (req: PedidoModelo) => Promise<RespuestaModelo>;

// Gemini 3.8 Flash (estable, GA 02/09/2026). En la familia 3.x no se envían
// temperature/top_p/top_k ni candidate_count; el razonamiento usa el nivel
// por defecto del modelo. Con `generateContent`, cada FunctionResponse lleva
// el `id` de la llamada y su `name`.
export const MODELO_POR_DEFECTO = "gemini-3.8-flash";

/** Identificador efectivo que usa el agente: `GEMINI_MODEL` o el valor por defecto. */
export function identificadorModelo(env: Record<string, string | undefined> = process.env): string {
  return (env.GEMINI_MODEL ?? "").trim() || MODELO_POR_DEFECTO;
}

export function informeModeloActivo(env: Record<string, string | undefined> = process.env): {
  proveedor: Proveedor;
  identificador: string;
  origen: "variable" | "valor_por_defecto";
  claveConfigurada: boolean;
  vertex: { configurado: boolean; faltan: string[] };
} {
  const id = (env.GEMINI_MODEL ?? "").trim();
  return {
    proveedor: "gemini_api",
    identificador: identificadorModelo(env),
    origen: id ? "variable" : "valor_por_defecto",
    claveConfigurada: !!(env.GEMINI_API_KEY ?? "").trim(),
    vertex: configuracionVertex(env),
  };
}

const VARIABLES_VERTEX = ["GCP_PROJECT_ID", "GCP_REGION", "GCP_SERVICE_ACCOUNT_JSON"] as const;

export function configuracionVertex(env: Record<string, string | undefined> = process.env): { configurado: boolean; faltan: string[] } {
  const faltan = VARIABLES_VERTEX.filter((k) => !(env[k] ?? "").trim());
  return { configurado: faltan.length === 0, faltan: [...faltan] };
}

export class ModeloNoDisponibleError extends Error {
  constructor(public proveedor: Proveedor, public faltan: string[]) {
    super(`El proveedor ${proveedor} no está configurado${faltan.length ? ` (faltan: ${faltan.join(", ")})` : ""}.`);
    this.name = "ModeloNoDisponibleError";
  }
}

/** Generador para Vertex: preparado, se activa solo con las variables y el endpoint reales. */
export function generadorVertex(identificador: string, env: Record<string, string | undefined> = process.env): Generador {
  return async () => {
    const cfg = configuracionVertex(env);
    if (!cfg.configurado) throw new ModeloNoDisponibleError("vertex", cfg.faltan);
    // La llamada real (token OAuth de la cuenta de servicio + endpoint de
    // predicción del modelo ajustado) se habilita en 3C con el contrato
    // comprobado en la cuenta; hasta entonces no se hace ninguna petición.
    throw new ModeloNoDisponibleError("vertex", [`endpoint de ${identificador} no habilitado (incremento 3C)`]);
  };
}

/** Generador simulado: responde según un guion {turno → partes}; por defecto, una pregunta neutra. */
export function generadorSimulado(guion: Record<number, RespuestaModelo["parts"]> = {}): Generador {
  let turno = 0;
  return async () => {
    turno++;
    const parts = guion[turno] ?? [{ text: "Entiendo. ¿Me contás un poco más para orientar la consulta?" }];
    return { parts, tokensEntrada: 0, tokensSalida: 0 };
  };
}
