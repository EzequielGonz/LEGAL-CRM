/**
 * Errores al enviar por la API de WhatsApp (Meta) y cómo se tratan.
 * Módulo puro: sin red ni base, se prueba solo.
 *
 * La regla de fondo: un destinatario solo queda "fallido" cuando Meta
 * confirmó un problema de ESE destinatario. Los problemas técnicos no se le
 * atribuyen al prospecto, y cuando no se sabe si Meta aceptó el mensaje
 * (se cortó la conexión, venció el tiempo, la respuesta no se pudo leer)
 * el caso queda para revisión y nunca se reenvía solo.
 */

/** Meta respondió con un error HTTP (el mensaje no fue aceptado). */
export class WhatsAppSendError extends Error {
  status: number;
  metaCode: number | null;
  constructor(message: string, status: number, metaCode: number | null) {
    super(message);
    this.name = "WhatsAppSendError";
    this.status = status;
    this.metaCode = metaCode;
  }
}

/** Meta respondió "bien" pero sin el identificador del mensaje: no se puede confirmar el envío. */
export class WhatsAppUnconfirmedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WhatsAppUnconfirmedError";
  }
}

export type SendFailureKind =
  /** Meta confirmó un problema de ese destinatario: queda "fallido". */
  | "contacto"
  /** La plantilla no está disponible o no coincide: pendiente y campaña en pausa. */
  | "plantilla"
  /** Token, permisos, cuenta o línea: pendiente y campaña en pausa. */
  | "cuenta"
  /** Falla temporal de Meta (no aceptó el mensaje): vuelve a la cola, con límite de intentos. */
  | "transitorio"
  /** No se sabe si Meta aceptó el mensaje: a revisión, sin reenvío automático. */
  | "incierto"
  /** Meta rechazó el mensaje por un motivo no clasificado: a revisión. */
  | "desconocido";

export interface SendFailure {
  kind: SendFailureKind;
  code: number | null;
  httpStatus: number | null;
  /** true si Meta respondió con un error, o sea que el mensaje seguro NO salió. */
  certainNotSent: boolean;
  detail: string;
}

const CONTACT_CODES = new Set([131021, 131026, 131049, 131050]);
const TRANSIENT_CODES = new Set([1, 2, 4, 80007, 130429, 131000, 131016, 131056, 133004]);
const ACCOUNT_CODES = new Set([
  0, 3, 10, 190, 368, 130497, 131005, 131030, 131031, 131037, 131042, 131045, 131057, 133000, 133005, 133006, 133008, 133009,
  133010, 133015,
]);

/** Clasificación por código de error de Meta (cuando Meta respondió). */
export function classifyMetaErrorCode(code: number | null | undefined): Exclude<SendFailureKind, "incierto"> {
  if (typeof code !== "number" || !Number.isFinite(code)) return "desconocido";
  if (code >= 132000 && code <= 132999) return "plantilla";
  if (CONTACT_CODES.has(code)) return "contacto";
  if (TRANSIENT_CODES.has(code)) return "transitorio";
  if (ACCOUNT_CODES.has(code) || (code >= 200 && code <= 299)) return "cuenta";
  return "desconocido";
}

/**
 * Clasifica cualquier error de un intento de envío. Sin respuesta de Meta
 * (red, tiempo agotado, cancelación) o con una respuesta que no se puede
 * interpretar, el resultado es "incierto".
 */
export function classifySendFailure(err: unknown): SendFailure {
  const message = String((err as any)?.message ?? err ?? "Error desconocido").slice(0, 1000);
  if (err instanceof WhatsAppSendError) {
    if (err.metaCode !== null) {
      return {
        kind: classifyMetaErrorCode(err.metaCode),
        code: err.metaCode,
        httpStatus: err.status,
        certainNotSent: true,
        detail: message,
      };
    }
    // Error HTTP sin el formato de error de Meta: un 5xx puede venir de un
    // intermediario después de que Meta aceptara el mensaje.
    return err.status >= 500
      ? { kind: "incierto", code: null, httpStatus: err.status, certainNotSent: false, detail: message }
      : { kind: "desconocido", code: null, httpStatus: err.status, certainNotSent: true, detail: message };
  }
  return { kind: "incierto", code: null, httpStatus: null, certainNotSent: false, detail: message };
}

/** Texto corto para el panel. */
export function failureNote(f: SendFailure): string {
  const code = f.code !== null ? ` (código ${f.code})` : f.httpStatus ? ` (HTTP ${f.httpStatus})` : "";
  switch (f.kind) {
    case "contacto":
      return `Meta no pudo entregarle a este destinatario${code}: ${f.detail}`;
    case "plantilla":
      return `Meta rechazó la plantilla${code}. El envío quedó pendiente.`;
    case "cuenta":
      return `Meta rechazó el envío por la línea o la cuenta${code}. El envío quedó pendiente.`;
    case "transitorio":
      return `Falla temporal de Meta${code}: no aceptó el mensaje.`;
    case "incierto":
      return `No se pudo confirmar si Meta aceptó el mensaje (${f.detail}). No se reenvía solo: revisarlo antes de reintentar.`;
    default:
      return `Meta rechazó el mensaje por un motivo no clasificado${code}: ${f.detail}`;
  }
}

/** Intentos máximos para fallas temporales antes de pasar a revisión. */
export const MAX_TRANSIENT_ATTEMPTS = 3;
