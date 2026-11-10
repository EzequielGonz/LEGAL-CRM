import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Traducción de los eventos del webhook de Wasender (10/11) a lo que guarda el
 * panel. Funciones puras, sin red ni base: se prueban solas.
 *
 * Formato según https://wasenderapi.com/api-docs (webhooks), leído el 10/11:
 * { event, sessionId, data, timestamp }. Los mensajes traen la estructura de
 * WhatsApp Web (key.id, key.fromMe, key.remoteJid, message.*) y, además,
 * `messageBody` con el texto. Algunos contactos llegan con un identificador
 * interno («@lid») y el número aparte (`senderPn` o `cleanedSenderPn`).
 */

export type EstadoEntrega = "enviado" | "entregado" | "leido" | "fallido";

export interface ArchivoWasender {
  /** Tipo según WhatsApp: imageMessage, videoMessage, audioMessage, documentMessage o stickerMessage. */
  campo: string;
  /** Contenido tal como llegó, necesario para descifrarlo con Wasender. */
  contenido: Record<string, unknown>;
  mimeType: string | null;
  nombre: string | null;
}

export type EventoWasender =
  | {
      tipo: "mensaje";
      claveId: string;
      deMi: boolean;
      telefono: string | null;
      nombre: string | null;
      cuerpo: string;
      tipoMensaje: string;
      legible: boolean;
      esBoton: boolean;
      metadata: Record<string, unknown>;
      archivo: ArchivoWasender | null;
    }
  | { tipo: "estado"; claveId: string; estado: EstadoEntrega; deMi: boolean; telefono: string | null }
  | { tipo: "enviado"; claveId: string; telefono: string | null; cuerpo: string | null; ok: boolean }
  | { tipo: "sesion"; estado: string }
  | { tipo: "qr"; qr: string }
  | { tipo: "ignorado"; motivo: string };

/**
 * La firma de Wasender es el secreto de la línea en el encabezado
 * X-Webhook-Signature (sin HMAC, según su documentación). Se compara en
 * tiempo constante.
 */
export function firmaValida(encabezado: string | null | undefined, secreto: string | null | undefined): boolean {
  if (!encabezado || !secreto) return false;
  const a = createHash("sha256").update(encabezado.trim()).digest();
  const b = createHash("sha256").update(secreto.trim()).digest();
  return timingSafeEqual(a, b);
}

/** Estados de Wasender (0 error, 1 pendiente, 2 enviado, 3 entregado, 4 leído, 5 reproducido). */
export function estadoDeWasender(codigo: unknown): EstadoEntrega | null {
  const n = typeof codigo === "string" && codigo.trim() !== "" ? Number(codigo) : codigo;
  switch (n) {
    case 0:
      return "fallido";
    case 2:
      return "enviado";
    case 3:
      return "entregado";
    case 4:
    case 5:
      return "leido";
    default:
      return null;
  }
}

/** Equivalente en el formato de Meta, para guardar el estado con la misma función del panel. */
export function estadoComoMeta(estado: EstadoEntrega): "sent" | "delivered" | "read" | "failed" {
  return estado === "enviado" ? "sent" : estado === "entregado" ? "delivered" : estado === "leido" ? "read" : "failed";
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

function digitos(v: unknown): string | null {
  const s = typeof v === "string" ? v.split("@")[0].split(":")[0] : "";
  const d = s.replace(/\D/g, "");
  return d.length >= 8 ? d : null;
}

/** Grupos, difusiones, estados y canales: el panel no los atiende. */
export function esChatIgnorado(jid: string | null): boolean {
  if (!jid) return false;
  return jid.endsWith("@g.us") || jid.endsWith("@broadcast") || jid.endsWith("@newsletter") || jid === "status@broadcast";
}

/** Número de la persona a partir de la clave del mensaje (resuelve los «@lid»). */
export function telefonoDeClave(key: any): string | null {
  const jid = str(key?.remoteJid);
  if (jid && jid.endsWith("@s.whatsapp.net")) return digitos(jid);
  return digitos(key?.cleanedSenderPn) ?? digitos(key?.senderPn) ?? digitos(key?.remoteJidAlt) ?? null;
}

const ETIQUETA: Record<string, string> = {
  image: "Imagen",
  video: "Video",
  audio: "Audio",
  document: "Documento",
  sticker: "Sticker",
};

const CAMPO_ARCHIVO: Record<string, string> = {
  imageMessage: "image",
  videoMessage: "video",
  audioMessage: "audio",
  documentMessage: "document",
  stickerMessage: "sticker",
};

interface Contenido {
  cuerpo: string;
  tipo: string;
  legible: boolean;
  esBoton: boolean;
  archivo: ArchivoWasender | null;
  extra: Record<string, unknown>;
}

/** Lo que dice el mensaje, con las mismas etiquetas que los de Meta. */
export function contenidoDeMensaje(message: any, messageBody?: unknown): Contenido {
  const m = message?.ephemeralMessage?.message ?? message?.viewOnceMessage?.message ?? message?.viewOnceMessageV2?.message ?? message ?? {};
  const texto = str(m.conversation) ?? str(m.extendedTextMessage?.text);
  if (texto) return { cuerpo: texto, tipo: "text", legible: true, esBoton: false, archivo: null, extra: {} };

  const doc = m.documentWithCaptionMessage?.message?.documentMessage;
  const fuente = doc ? { documentMessage: doc } : m;
  for (const campo of Object.keys(CAMPO_ARCHIVO)) {
    const media = fuente[campo];
    if (!media || typeof media !== "object") continue;
    const tipo = CAMPO_ARCHIVO[campo];
    const caption = str(media.caption);
    const nombre = str(media.fileName) ?? str(media.title);
    const etiqueta = ETIQUETA[tipo];
    return {
      cuerpo: caption ? `[${etiqueta}] ${caption}` : nombre ? `[${etiqueta}] ${nombre}` : `[${etiqueta}]`,
      tipo,
      legible: false,
      esBoton: false,
      archivo: { campo, contenido: { [campo]: media }, mimeType: str(media.mimetype), nombre },
      extra: { requiere_revision: true, mime_type: str(media.mimetype), filename: nombre },
    };
  }

  const boton =
    str(m.buttonsResponseMessage?.selectedDisplayText) ??
    str(m.templateButtonReplyMessage?.selectedDisplayText) ??
    str(m.listResponseMessage?.title) ??
    str(m.interactiveResponseMessage?.body?.text);
  if (boton) return { cuerpo: boton, tipo: "button", legible: true, esBoton: true, archivo: null, extra: {} };

  if (m.locationMessage) {
    const l = m.locationMessage;
    const partes = [str(l.name), str(l.address)].filter(Boolean).join(" · ");
    const coords = typeof l.degreesLatitude === "number" && typeof l.degreesLongitude === "number" ? `${l.degreesLatitude}, ${l.degreesLongitude}` : "";
    return {
      cuerpo: `[Ubicación] ${[partes, coords].filter(Boolean).join(" — ")}`.trim(),
      tipo: "location",
      legible: false,
      esBoton: false,
      archivo: null,
      extra: { requiere_revision: true },
    };
  }
  if (m.contactMessage || m.contactsArrayMessage) {
    const lista: any[] = m.contactsArrayMessage?.contacts ?? [m.contactMessage];
    const nombres = lista.map((c) => str(c?.displayName) ?? "Sin nombre").join(", ");
    // Números aportados por terceros: se guardan como dato, nunca se usan solos.
    return { cuerpo: `[Contacto compartido] ${nombres}`.trim(), tipo: "contacts", legible: false, esBoton: false, archivo: null, extra: { requiere_revision: true } };
  }
  if (m.reactionMessage) {
    return { cuerpo: `[Reacción ${str(m.reactionMessage.text) ?? ""}]`.replace(" ]", "]"), tipo: "reaction", legible: false, esBoton: false, archivo: null, extra: {} };
  }

  const cuerpo = str(messageBody);
  if (cuerpo) return { cuerpo, tipo: "text", legible: true, esBoton: false, archivo: null, extra: {} };
  return { cuerpo: "[Mensaje no compatible]", tipo: "unknown", legible: false, esBoton: false, archivo: null, extra: { requiere_revision: true } };
}

/** Mensajes técnicos de WhatsApp (borrados, claves de cifrado, etc.): no son conversación. */
function esTecnico(message: any): boolean {
  if (!message || typeof message !== "object") return true;
  const claves = Object.keys(message).filter((k) => k !== "messageContextInfo");
  return claves.length === 0 || claves.every((k) => k === "protocolMessage" || k === "senderKeyDistributionMessage");
}

function comoLista(v: unknown): any[] {
  if (Array.isArray(v)) return v;
  return v && typeof v === "object" ? [v] : [];
}

function traducirMensaje(m: any): EventoWasender {
  const key = m?.key ?? {};
  const claveId = str(key.id);
  if (!claveId) return { tipo: "ignorado", motivo: "sin_id" };
  const jid = str(key.remoteJid);
  if (esChatIgnorado(jid)) return { tipo: "ignorado", motivo: "grupo_o_difusion" };
  if (esTecnico(m?.message) && !str(m?.messageBody)) return { tipo: "ignorado", motivo: "mensaje_tecnico" };
  const c = contenidoDeMensaje(m?.message, m?.messageBody);
  const marca = m?.messageTimestamp;
  return {
    tipo: "mensaje",
    claveId,
    deMi: key.fromMe === true,
    telefono: telefonoDeClave(key),
    nombre: str(m?.pushName),
    cuerpo: c.cuerpo,
    tipoMensaje: c.tipo,
    legible: c.legible,
    esBoton: c.esBoton,
    archivo: c.archivo,
    // Sin `media_id`: el guardado de adjuntos de Meta no intenta bajarlo.
    metadata: {
      proveedor: "wasender",
      provider_type: c.tipo,
      provider_timestamp: marca === undefined || marca === null ? null : String(marca),
      wasender_jid: jid,
      ...(c.archivo ? { wasender_archivo: { campo: c.archivo.campo } } : {}),
      ...c.extra,
    },
  };
}

/** Traduce un evento del webhook (puede traer varios mensajes). */
export function traducirEvento(payload: any): EventoWasender[] {
  const evento = str(payload?.event) ?? "";
  const data = payload?.data;
  switch (evento) {
    case "messages.received":
    case "messages.upsert":
    case "messages.personal.received":
    case "personal.message.received": {
      const lista = comoLista(data?.messages ?? data);
      return lista.length ? lista.map(traducirMensaje) : [{ tipo: "ignorado", motivo: "sin_mensajes" }];
    }
    case "messages.update":
    case "message-receipt.update": {
      const lista = comoLista(data);
      const salida: EventoWasender[] = [];
      for (const u of lista) {
        const key = u?.key ?? {};
        const claveId = str(key.id);
        const estado = estadoDeWasender(u?.update?.status ?? u?.status);
        if (!claveId || !estado) {
          salida.push({ tipo: "ignorado", motivo: "estado_sin_cambio" });
          continue;
        }
        salida.push({ tipo: "estado", claveId, estado, deMi: key.fromMe !== false, telefono: telefonoDeClave(key) });
      }
      return salida.length ? salida : [{ tipo: "ignorado", motivo: "sin_estados" }];
    }
    case "message.sent": {
      const key = data?.key ?? {};
      const claveId = str(key.id);
      if (!claveId) return [{ tipo: "ignorado", motivo: "sin_id" }];
      const c = data?.message ? contenidoDeMensaje(data.message, data?.messageBody) : null;
      return [{ tipo: "enviado", claveId, telefono: telefonoDeClave(key), cuerpo: c && c.tipo !== "unknown" ? c.cuerpo : null, ok: data?.success !== false }];
    }
    case "session.status": {
      const estado = str(data?.status) ?? str(data);
      return estado ? [{ tipo: "sesion", estado: estado.toLowerCase() }] : [{ tipo: "ignorado", motivo: "sin_estado" }];
    }
    case "qrcode.updated": {
      const qr = str(data?.qr) ?? str(data?.qrCode);
      return qr ? [{ tipo: "qr", qr }] : [{ tipo: "ignorado", motivo: "sin_qr" }];
    }
    default:
      return [{ tipo: "ignorado", motivo: evento ? `evento_${evento}` : "sin_evento" }];
  }
}
