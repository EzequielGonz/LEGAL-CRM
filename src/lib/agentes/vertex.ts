/**
 * Cliente mínimo de Vertex AI (16/10): token de la cuenta de servicio (JWT
 * RS256 firmado con node:crypto), predicción contra el endpoint del modelo
 * ajustado, subida del corpus a Cloud Storage y trabajos de ajuste.
 *
 * Variables (solo en Vercel, nunca en el código): GCP_PROJECT_ID,
 * GCP_REGION, GCP_SERVICE_ACCOUNT_JSON y, para el ajuste, GCP_BUCKET.
 * Sin variables no se hace ninguna petición.
 */
import { createSign } from "node:crypto";

export interface CuentaServicio {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

export function leerCuentaServicio(env: Record<string, string | undefined> = process.env): CuentaServicio | null {
  const raw = (env.GCP_SERVICE_ACCOUNT_JSON ?? "").trim();
  if (!raw) return null;
  try {
    // Se acepta el JSON tal cual o en base64.
    const txt = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const j = JSON.parse(txt);
    if (typeof j.client_email !== "string" || typeof j.private_key !== "string") return null;
    return { client_email: j.client_email, private_key: j.private_key, token_uri: j.token_uri };
  } catch {
    return null;
  }
}

function b64url(v: Buffer | string): string {
  return Buffer.from(v).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/** JWT firmado para pedir el token OAuth (puro salvo la firma). */
export function armarJwt(cuenta: CuentaServicio, ahoraSeg = Math.floor(Date.now() / 1000)): string {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: cuenta.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: cuenta.token_uri ?? "https://oauth2.googleapis.com/token",
      iat: ahoraSeg,
      exp: ahoraSeg + 3600,
    })
  );
  const firma = createSign("RSA-SHA256").update(`${header}.${claim}`).sign(cuenta.private_key);
  return `${header}.${claim}.${b64url(firma)}`;
}

let _token: { valor: string; vence: number } | null = null;

export async function tokenVertex(env: Record<string, string | undefined> = process.env): Promise<string> {
  if (_token && _token.vence > Date.now() + 60_000) return _token.valor;
  const cuenta = leerCuentaServicio(env);
  if (!cuenta) throw new Error("GCP_SERVICE_ACCOUNT_JSON falta o no es un JSON de cuenta de servicio válido.");
  const res = await fetch(cuenta.token_uri ?? "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: armarJwt(cuenta) }),
  });
  const j = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!res.ok || !j.access_token) throw new Error(`Google no entregó el token (${res.status}): ${j.error_description ?? "sin detalle"}`);
  _token = { valor: j.access_token, vence: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return j.access_token;
}

function base(env: Record<string, string | undefined>) {
  const proyecto = (env.GCP_PROJECT_ID ?? "").trim();
  const region = (env.GCP_REGION ?? "us-central1").trim();
  return { proyecto, region, host: `https://${region}-aiplatform.googleapis.com/v1` };
}

async function llamar<T>(url: string, init: RequestInit, env: Record<string, string | undefined>): Promise<T> {
  const token = await tokenVertex(env);
  const res = await fetch(url, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
  const txt = await res.text();
  let j: any = {};
  try {
    j = txt ? JSON.parse(txt) : {};
  } catch {
    j = { raw: txt.slice(0, 300) };
  }
  if (!res.ok) throw new Error(`Vertex respondió ${res.status}: ${j?.error?.message ?? j?.raw ?? "sin detalle"}`);
  return j as T;
}

export interface RespuestaVertex {
  parts: any[];
  tokensEntrada: number;
  tokensSalida: number;
  tokensRazonamiento: number;
  modeloRespuesta: string | null;
}

/** Recurso completo del endpoint (acepta el id corto o la ruta completa). */
export function recursoEndpoint(endpoint: string, env: Record<string, string | undefined> = process.env): string {
  if (endpoint.startsWith("projects/")) return endpoint;
  const { proyecto, region } = base(env);
  return `projects/${proyecto}/locations/${region}/endpoints/${endpoint}`;
}

export async function generarVertex(
  input: { endpoint: string; contents: unknown[]; systemInstruction: string; tools: unknown[] },
  env: Record<string, string | undefined> = process.env
): Promise<RespuestaVertex> {
  const { host } = base(env);
  const body: Record<string, unknown> = {
    contents: input.contents,
    systemInstruction: { role: "system", parts: [{ text: input.systemInstruction }] },
  };
  if (input.tools.length) body.tools = [{ functionDeclarations: input.tools }];
  const j = await llamar<any>(`${host}/${recursoEndpoint(input.endpoint, env)}:generateContent`, { method: "POST", body: JSON.stringify(body) }, env);
  const u = j.usageMetadata ?? {};
  return {
    parts: j.candidates?.[0]?.content?.parts ?? [],
    tokensEntrada: u.promptTokenCount ?? 0,
    tokensSalida: u.candidatesTokenCount ?? 0,
    tokensRazonamiento: u.thoughtsTokenCount ?? 0,
    modeloRespuesta: j.modelVersion ?? null,
  };
}

/** Sube el JSONL del corpus a gs://GCP_BUCKET/<nombre>. */
export async function subirCorpus(nombre: string, lineas: string[], env: Record<string, string | undefined> = process.env): Promise<string> {
  const bucket = (env.GCP_BUCKET ?? "").trim();
  if (!bucket) throw new Error("Falta GCP_BUCKET (bucket de Cloud Storage para el corpus).");
  const token = await tokenVertex(env);
  const url = `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucket)}/o?uploadType=media&name=${encodeURIComponent(nombre)}`;
  const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/jsonl" }, body: lineas.join("\n") + "\n" });
  if (!res.ok) throw new Error(`Cloud Storage respondió ${res.status} al subir el corpus.`);
  return `gs://${bucket}/${nombre}`;
}

export interface TrabajoVertex {
  name: string;
  state?: string;
  tunedModel?: { model?: string; endpoint?: string };
  error?: { message?: string };
}

export async function crearTrabajoAjuste(
  input: { modeloBase: string; entrenamiento: string; validacion?: string | null; epocas: number; nombre: string },
  env: Record<string, string | undefined> = process.env
): Promise<TrabajoVertex> {
  const { host, proyecto, region } = base(env);
  return llamar<TrabajoVertex>(
    `${host}/projects/${proyecto}/locations/${region}/tuningJobs`,
    {
      method: "POST",
      body: JSON.stringify({
        baseModel: input.modeloBase,
        tunedModelDisplayName: input.nombre,
        supervisedTuningSpec: {
          trainingDatasetUri: input.entrenamiento,
          ...(input.validacion ? { validationDatasetUri: input.validacion } : {}),
          hyperParameters: { epochCount: input.epocas },
        },
      }),
    },
    env
  );
}

export async function leerTrabajoAjuste(nombre: string, env: Record<string, string | undefined> = process.env): Promise<TrabajoVertex> {
  const { host } = base(env);
  return llamar<TrabajoVertex>(`${host}/${nombre}`, { method: "GET" }, env);
}

export async function cancelarTrabajoAjuste(nombre: string, env: Record<string, string | undefined> = process.env): Promise<void> {
  const { host } = base(env);
  await llamar(`${host}/${nombre}:cancel`, { method: "POST", body: "{}" }, env);
}

/** Estimación del costo del ajuste: tokens del corpus × épocas × tarifa. */
export const TARIFA_AJUSTE_USD_MILLON = 10;
export function estimarCostoAjuste(lineas: string[], epocas: number, tarifa = TARIFA_AJUSTE_USD_MILLON): { tokens: number; usd: number } {
  // Aproximación conservadora: 1 token cada 3,5 caracteres.
  const tokens = Math.ceil(lineas.reduce((a, l) => a + l.length, 0) / 3.5);
  return { tokens, usd: Math.round(((tokens * epocas * tarifa) / 1_000_000) * 100) / 100 };
}
