import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Cifrado de la clave y del secreto de cada línea de Wasender (10/11, decisión
 * de la responsable: se guardan cifrados en la base). AES-256-GCM, el mismo
 * esquema que el token de Search Console, con su propia clave en la
 * configuración privada del servidor (WASENDER_CLAVE_CIFRADO). El valor nunca
 * se muestra en el panel, el chat ni los registros. Puro: se prueba solo.
 */

type Env = Record<string, string | undefined>;

/** Largo mínimo de la clave de cifrado (una frase larga al azar). */
export const LARGO_MINIMO_CLAVE = 16;

export function claveCifradoLista(env: Env = process.env): boolean {
  return (env.WASENDER_CLAVE_CIFRADO ?? "").trim().length >= LARGO_MINIMO_CLAVE;
}

function clave(env: Env): Buffer {
  const base = (env.WASENDER_CLAVE_CIFRADO ?? "").trim();
  if (base.length < LARGO_MINIMO_CLAVE) {
    throw new Error("Falta la clave de cifrado de Wasender (WASENDER_CLAVE_CIFRADO) en la configuración privada del servidor.");
  }
  return createHash("sha256").update(`wasender:${base}`).digest();
}

export function cifrar(texto: string, env: Env = process.env): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", clave(env), iv);
  const enc = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), enc.toString("base64url")].join(".");
}

/** Devuelve el texto original, o null si el valor está alterado o se cifró con otra clave. */
export function descifrar(cifrado: string | null | undefined, env: Env = process.env): string | null {
  const [v, iv, tag, data] = String(cifrado ?? "").split(".");
  if (v !== "v1" || !iv || !tag || !data) return null;
  try {
    const d = createDecipheriv("aes-256-gcm", clave(env), Buffer.from(iv, "base64url"));
    d.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([d.update(Buffer.from(data, "base64url")), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}
