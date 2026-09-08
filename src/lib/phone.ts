export interface PhoneNormalizationResult {
  /** Formato final que espera la API de WhatsApp (549 + código de área + abonado), o null si no había nada que interpretar. */
  phone: string | null;
  /** "alta" = confiamos en el resultado. "revisar" = lo normalizamos con una regla genérica pero puede estar mal (otro código de área, error de tipeo, etc.) y conviene que un humano lo confirme antes de una campaña. */
  confidence: "alta" | "revisar";
  original: string;
}

/**
 * Normaliza teléfonos argentinos al formato E.164 sin "+" que usa la API de
 * WhatsApp: 54 + 9 + código de área + abonado (sin el 0 de larga distancia
 * ni el 15 de discado móvil local).
 *
 * Cubre con confianza alta los formatos más comunes: ya en formato
 * internacional (con o sin 9), formato local con o sin el 0 inicial, y el
 * caso particular de CABA/GBA con "15" (área "11" + 15 + 8 dígitos).
 *
 * Para otros códigos de área que también usan "15" en el discado local no
 * hay forma genérica de saber dónde cortar sin una tabla de códigos de área
 * completa, así que en esos casos devolvemos el mejor intento pero con
 * confidence "revisar" en vez de arriesgarnos a inventar un número
 * incorrecto silenciosamente.
 */
export function normalizePhoneAR(raw: string | null | undefined): PhoneNormalizationResult {
  const original = raw ?? "";
  if (!raw || !raw.trim()) {
    return { phone: null, confidence: "revisar", original };
  }

  let digits = raw.replace(/[^\d]/g, "");

  if (digits.startsWith("54")) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("9") && digits.length > 10) {
    digits = digits.slice(1);
  }
  // 0 de larga distancia nacional (ej: "011...")
  digits = digits.replace(/^0/, "");

  // CABA/GBA con "15": área "11" + "15" + 8 dígitos = 12 dígitos.
  if (digits.length === 12 && digits.startsWith("1115")) {
    digits = "11" + digits.slice(4);
  }

  if (digits.length === 10) {
    return { phone: `549${digits}`, confidence: "alta", original };
  }

  if (digits.length >= 8) {
    return { phone: `549${digits}`, confidence: "revisar", original };
  }

  return { phone: null, confidence: "revisar", original };
}
