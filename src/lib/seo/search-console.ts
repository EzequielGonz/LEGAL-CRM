/**
 * Etapa 2 · Bloque 5 — Search Console por API con OAuth (preparado, SIN CONECTAR).
 *
 * Funciona solo cuando el servidor tiene sus variables (las carga una
 * persona en Vercel; nunca se pegan en el chat ni en el código) y
 * SEARCH_CONSOLE_ENABLED=true. El token de renovación se guarda cifrado
 * (AES-256-GCM) con una clave que existe solo en el servidor. Lectura
 * únicamente (webmasters.readonly). No se usan exportaciones manuales.
 */

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SCOPE_SEARCH_CONSOLE = "https://www.googleapis.com/auth/webmasters.readonly";
const VARIABLES = ["GSC_CLIENT_ID", "GSC_CLIENT_SECRET", "GSC_REDIRECT_URI", "GSC_TOKEN_KEY"] as const;

export function configuracionSearchConsole(env: Record<string, string | undefined> = process.env): { lista: boolean; habilitada: boolean; faltan: string[] } {
  const faltan = VARIABLES.filter((k) => !(env[k] ?? "").trim());
  if ((env.GSC_TOKEN_KEY ?? "").length > 0 && (env.GSC_TOKEN_KEY ?? "").length < 32) faltan.push("GSC_TOKEN_KEY (mínimo 32 caracteres)" as any);
  const habilitada = env.SEARCH_CONSOLE_ENABLED === "true";
  return { lista: faltan.length === 0 && habilitada, habilitada, faltan: faltan as string[] };
}

function clave(env: Record<string, string | undefined>, uso: string): Buffer {
  return createHash("sha256").update(`${uso}:${env.GSC_TOKEN_KEY ?? ""}`).digest();
}

/** Estado firmado del pedido de OAuth (perfil + vencimiento), contra falsificación. */
export function firmarEstado(rubroId: string, ahoraMs: number, env: Record<string, string | undefined> = process.env): string {
  const payload = Buffer.from(JSON.stringify({ r: rubroId, e: ahoraMs + 10 * 60_000, n: randomBytes(8).toString("hex") })).toString("base64url");
  const sig = createHmac("sha256", clave(env, "estado")).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verificarEstado(state: string, ahoraMs: number, env: Record<string, string | undefined> = process.env): { ok: true; rubroId: string } | { ok: false } {
  const [payload, sig] = String(state ?? "").split(".");
  if (!payload || !sig) return { ok: false };
  const esperado = createHmac("sha256", clave(env, "estado")).update(payload).digest();
  let recibido: Buffer;
  try {
    recibido = Buffer.from(sig, "base64url");
  } catch {
    return { ok: false };
  }
  if (recibido.length !== esperado.length || !timingSafeEqual(recibido, esperado)) return { ok: false };
  try {
    const d = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof d?.r !== "string" || typeof d?.e !== "number" || d.e < ahoraMs) return { ok: false };
    return { ok: true, rubroId: d.r };
  } catch {
    return { ok: false };
  }
}

export function urlAutorizacion(state: string, env: Record<string, string | undefined> = process.env): string {
  const p = new URLSearchParams({
    client_id: env.GSC_CLIENT_ID ?? "",
    redirect_uri: env.GSC_REDIRECT_URI ?? "",
    response_type: "code",
    scope: SCOPE_SEARCH_CONSOLE,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`;
}

export function cifrarToken(texto: string, env: Record<string, string | undefined> = process.env): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", clave(env, "token"), iv);
  const enc = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), enc.toString("base64url")].join(".");
}

export function descifrarToken(cifrado: string, env: Record<string, string | undefined> = process.env): string | null {
  const [v, iv, tag, data] = String(cifrado ?? "").split(".");
  if (v !== "v1" || !iv || !tag || !data) return null;
  try {
    const d = createDecipheriv("aes-256-gcm", clave(env, "token"), Buffer.from(iv, "base64url"));
    d.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([d.update(Buffer.from(data, "base64url")), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** Canje del código por tokens (solo se llama desde la vuelta de OAuth con todo configurado). */
export async function intercambiarCodigo(code: string, env: Record<string, string | undefined> = process.env): Promise<{ refreshToken: string | null; error: string | null }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GSC_CLIENT_ID ?? "",
      client_secret: env.GSC_CLIENT_SECRET ?? "",
      redirect_uri: env.GSC_REDIRECT_URI ?? "",
      grant_type: "authorization_code",
    }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) return { refreshToken: null, error: String(data?.error_description ?? data?.error ?? `error ${res.status}`) };
  return { refreshToken: typeof data?.refresh_token === "string" ? data.refresh_token : null, error: data?.refresh_token ? null : "Google no devolvió token de renovación" };
}
