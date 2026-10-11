import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Verificación de la firma de Meta (X-Hub-Signature-256 = "sha256=" + HMAC
 * del cuerpo crudo con el secreto de la app).
 *
 * Secretos aceptados: META_APP_SECRET y, si alguna línea pertenece a otra
 * app de Meta, los que se agreguen separados por coma en META_APP_SECRETS.
 */
export type SignatureCheck = "ok" | "ausente" | "invalida" | "sin_secreto";

export function metaAppSecrets(): string[] {
  const list = [process.env.META_APP_SECRET ?? "", ...(process.env.META_APP_SECRETS ?? "").split(",")]
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set(list));
}

export function verifyMetaSignature(rawBody: Buffer, header: string | null): SignatureCheck {
  if (!header) return "ausente";
  const secrets = metaAppSecrets();
  if (secrets.length === 0) return "sin_secreto";
  const match = /^sha256=([a-f0-9]{64})$/i.exec(header.trim());
  if (!match) return "invalida";
  const given = Buffer.from(match[1], "hex");
  for (const secret of secrets) {
    const expected = createHmac("sha256", secret).update(rawBody).digest();
    if (expected.length === given.length && timingSafeEqual(expected, given)) return "ok";
  }
  return "invalida";
}

export type QuarantineReason =
  | "firma_invalida"
  | "firma_ausente"
  | "linea_no_asignada"
  | "error_procesamiento";

/**
 * Lo que no se puede procesar con seguridad se conserva para revisión
 * manual (Configuración → Mensajes retenidos). Nunca se procesa solo.
 */
export async function quarantineWebhook(input: {
  source: "whatsapp" | "meta";
  reason: QuarantineReason;
  accountId?: string | null;
  payload: unknown;
  detail?: string | null;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("webhook_quarantine").insert({
      source: input.source,
      reason: input.reason,
      account_id: input.accountId ?? null,
      payload: input.payload ?? {},
      detail: input.detail ?? null,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    // Último recurso: que quede en los logs de Vercel con el contenido completo.
    console.error("[webhook] No se pudo guardar en retenidos:", err, JSON.stringify(input).slice(0, 20000));
  }
}

/** Lee el cuerpo crudo una sola vez (para la firma) y lo interpreta como JSON. */
export async function readRawJson(request: Request): Promise<{ raw: Buffer; json: any | null }> {
  const raw = Buffer.from(await request.arrayBuffer());
  try {
    return { raw, json: JSON.parse(raw.toString("utf8")) };
  } catch {
    return { raw, json: null };
  }
}
