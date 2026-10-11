import { createCipheriv, createECDH, createHmac, createPrivateKey, randomBytes, sign } from "node:crypto";

/**
 * Avisos web (Web Push) sin dependencias externas (bloque 1.9):
 *  - identificación del servidor con VAPID (RFC 8292, firma ES256);
 *  - contenido cifrado "aes128gcm" (RFC 8188 + RFC 8291).
 * Las claves VAPID viven en la configuración privada del servidor
 * (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY, en base64url). Sin ellas, la
 * función de avisos queda deshabilitada y el panel lo informa.
 */

export function b64urlEncode(buf: Buffer | Uint8Array): string {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlDecode(s: string): Buffer {
  const norm = s.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(norm + "=".repeat((4 - (norm.length % 4)) % 4), "base64");
}

export interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

/** Configuración VAPID desde la configuración privada, o la lista de lo que falta. */
export function vapidConfig(): { config: VapidConfig | null; missing: string[] } {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim() ?? "";
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim() ?? "";
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || (productionHost ? `https://${productionHost}` : "");
  const missing: string[] = [];
  if (!publicKey) missing.push("VAPID_PUBLIC_KEY");
  if (!privateKey) missing.push("VAPID_PRIVATE_KEY");
  if (!subject) missing.push("VAPID_SUBJECT (mailto: o https:)");
  if (missing.length) return { config: null, missing };
  try {
    if (b64urlDecode(publicKey).length !== 65 || b64urlDecode(privateKey).length !== 32) {
      return { config: null, missing: ["Claves VAPID con formato inválido (se esperan 65 y 32 bytes en base64url)"] };
    }
  } catch {
    return { config: null, missing: ["Claves VAPID con formato inválido"] };
  }
  return { config: { publicKey, privateKey, subject }, missing: [] };
}

/** JWT de VAPID para el origen del servicio de avisos (válido 12 h). */
export function vapidJwt(audience: string, cfg: VapidConfig, nowSeconds = Math.floor(Date.now() / 1000)): string {
  const header = b64urlEncode(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = b64urlEncode(Buffer.from(JSON.stringify({ aud: audience, exp: nowSeconds + 12 * 3600, sub: cfg.subject })));
  const pub = b64urlDecode(cfg.publicKey);
  const key = createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
      d: cfg.privateKey,
      x: b64urlEncode(pub.subarray(1, 33)),
      y: b64urlEncode(pub.subarray(33, 65)),
    },
    format: "jwk",
  });
  const signature = sign("sha256", Buffer.from(`${header}.${payload}`), { key, dsaEncoding: "ieee-p1363" });
  return `${header}.${payload}.${b64urlEncode(signature)}`;
}

function hmac(key: Buffer, data: Buffer): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

/**
 * Cifra el contenido para una suscripción (aes128gcm, un solo registro).
 * `asPrivate` y `salt` solo se pasan en pruebas (vectores del RFC 8291).
 */
export function encryptPayload(
  plaintext: Buffer,
  uaPublicB64: string,
  authSecretB64: string,
  opts: { asPrivate?: Buffer; salt?: Buffer } = {}
): Buffer {
  const uaPublic = b64urlDecode(uaPublicB64);
  const authSecret = b64urlDecode(authSecretB64);
  const ecdh = createECDH("prime256v1");
  if (opts.asPrivate) ecdh.setPrivateKey(opts.asPrivate);
  else ecdh.generateKeys();
  const asPublic = ecdh.getPublicKey();
  const sharedSecret = ecdh.computeSecret(uaPublic);
  const salt = opts.salt ?? randomBytes(16);

  // RFC 8291: IKM a partir del secreto ECDH y del secreto de autenticación.
  const prkKey = hmac(authSecret, sharedSecret);
  const keyInfo = Buffer.concat([Buffer.from("WebPush: info\0"), uaPublic, asPublic, Buffer.from([1])]);
  const ikm = hmac(prkKey, keyInfo);
  // RFC 8188: clave y nonce del contenido.
  const prk = hmac(salt, ikm);
  const cek = hmac(prk, Buffer.from("Content-Encoding: aes128gcm\0\x01", "binary")).subarray(0, 16);
  const nonce = hmac(prk, Buffer.from("Content-Encoding: nonce\0\x01", "binary")).subarray(0, 12);

  const cipher = createCipheriv("aes-128-gcm", cek, nonce);
  const padded = Buffer.concat([plaintext, Buffer.from([2])]); // delimitador del último registro
  const ciphertext = Buffer.concat([cipher.update(padded), cipher.final(), cipher.getAuthTag()]);

  const header = Buffer.alloc(16 + 4 + 1);
  salt.copy(header, 0);
  header.writeUInt32BE(4096, 16);
  header.writeUInt8(asPublic.length, 20);
  return Buffer.concat([header, asPublic, ciphertext]);
}

export interface PushSubscriptionKeys {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushResult {
  ok: boolean;
  status: number;
  /** la suscripción ya no existe en el servicio (se marca vencida) */
  gone: boolean;
  error?: string;
}

/** Envía un aviso a un dispositivo. No reintenta: el resultado queda registrado. */
export async function sendWebPush(
  sub: PushSubscriptionKeys,
  message: { title: string; body?: string; url?: string; tag?: string },
  cfg: VapidConfig,
  opts: { ttlSeconds?: number; urgency?: "normal" | "high" } = {}
): Promise<PushResult> {
  let endpoint: URL;
  try {
    endpoint = new URL(sub.endpoint);
  } catch {
    return { ok: false, status: 0, gone: true, error: "Dirección de suscripción inválida" };
  }
  if (endpoint.protocol !== "https:") return { ok: false, status: 0, gone: true, error: "La suscripción no es https" };
  const body = encryptPayload(Buffer.from(JSON.stringify(message)), sub.p256dh, sub.auth);
  const jwt = vapidJwt(endpoint.origin, cfg);
  try {
    const res = await fetch(endpoint.toString(), {
      method: "POST",
      headers: {
        TTL: String(opts.ttlSeconds ?? 24 * 3600),
        Urgency: opts.urgency ?? "high",
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        Authorization: `vapid t=${jwt}, k=${cfg.publicKey}`,
      },
      body: new Uint8Array(body),
    });
    const gone = res.status === 404 || res.status === 410;
    if (res.ok) return { ok: true, status: res.status, gone: false };
    const text = await res.text().catch(() => "");
    return { ok: false, status: res.status, gone, error: text.slice(0, 300) || res.statusText };
  } catch (err: any) {
    return { ok: false, status: 0, gone: false, error: String(err?.message ?? err) };
  }
}
