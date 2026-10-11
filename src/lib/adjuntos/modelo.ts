/**
 * Adjuntos recibidos (audios, fotos, videos y documentos): qué se guarda,
 * dónde y cómo se muestra. Módulo puro: sin red ni base, se prueba solo.
 *
 * Alcance de la Etapa 1: guardar el original en almacenamiento privado y
 * poder abrirlo desde la conversación y la ficha. Sin transcripción, sin
 * respuestas y sin envíos.
 */

export type AttachmentKind = "audio" | "imagen" | "video" | "documento" | "sticker";
export type AttachmentStatus = "pendiente" | "guardado" | "error" | "vencido" | "demasiado_grande";
export type AttachmentChannel = "whatsapp" | "instagram" | "facebook";

export const ATTACHMENTS_BUCKET = "adjuntos-originales";
/** Tope de tamaño de un original (igual al límite del bucket). */
export const ATTACHMENT_MAX_BYTES = 50 * 1024 * 1024;
/** Al recibir el mensaje se guarda en el momento hasta este tamaño; lo más pesado se guarda a pedido. */
export const INLINE_MAX_BYTES = 16 * 1024 * 1024;
/** WhatsApp deja descargar lo recibido durante 7 días. */
export const WHATSAPP_DOWNLOAD_DAYS = 7;
/** Duración del enlace firmado con el que el panel abre un original. */
export const SIGNED_URL_SECONDS = 120;

export const KIND_LABEL: Record<AttachmentKind, string> = {
  audio: "Audio",
  imagen: "Foto",
  video: "Video",
  documento: "Documento",
  sticker: "Sticker",
};

export const STATUS_LABEL: Record<AttachmentStatus, string> = {
  pendiente: "Sin guardar todavía",
  guardado: "Guardado",
  error: "No se pudo guardar",
  vencido: "Vencido en Meta",
  demasiado_grande: "Demasiado pesado",
};

export interface AttachmentCandidate {
  position: number;
  kind: AttachmentKind;
  provider_media_id: string | null;
  source_url: string | null;
  mime_type: string | null;
  file_name: string | null;
  provider_sha256: string | null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** Tipo de WhatsApp → tipo de adjunto (null si no es un archivo). */
export function kindFromWhatsAppType(type: unknown): AttachmentKind | null {
  switch (type) {
    case "audio":
    case "voice":
      return "audio";
    case "image":
      return "imagen";
    case "video":
      return "video";
    case "document":
      return "documento";
    case "sticker":
      return "sticker";
    default:
      return null;
  }
}

/** Tipo de adjunto de Instagram/Facebook → tipo de adjunto (null si no es un archivo). */
export function kindFromMetaType(type: unknown): AttachmentKind | null {
  switch (type) {
    case "audio":
      return "audio";
    case "image":
      return "imagen";
    case "video":
      return "video";
    case "file":
      return "documento";
    default:
      return null; // enlaces, publicaciones compartidas, ubicaciones, etc.
  }
}

/**
 * Adjuntos a guardar a partir de un mensaje entrante ya guardado (de su
 * tipo y su metadata). No inventa nada: si falta el identificador o el
 * enlace del archivo, no hay adjunto que guardar.
 */
export function attachmentCandidates(input: {
  channelType: string;
  messageType: string | null | undefined;
  metadata: Record<string, any> | null | undefined;
}): AttachmentCandidate[] {
  const md = input.metadata ?? {};
  if (input.channelType === "whatsapp") {
    const kind = kindFromWhatsAppType(md.provider_type ?? input.messageType);
    const mediaId = str(md.media_id);
    if (!kind || !mediaId) return [];
    return [
      {
        position: 0,
        kind,
        provider_media_id: mediaId,
        source_url: null,
        mime_type: str(md.mime_type),
        file_name: str(md.filename),
        provider_sha256: str(md.sha256),
      },
    ];
  }
  if (input.channelType === "instagram" || input.channelType === "facebook") {
    const list: any[] = Array.isArray(md.attachments) ? md.attachments : [];
    const out: AttachmentCandidate[] = [];
    list.forEach((a, index) => {
      const kind = kindFromMetaType(a?.type);
      const url = str(a?.payload?.url);
      if (!kind || !url || !/^https:\/\//i.test(url)) return;
      out.push({
        position: index,
        kind,
        provider_media_id: null,
        source_url: url,
        mime_type: null,
        file_name: str(a?.payload?.title) ?? str(a?.name),
        provider_sha256: null,
      });
    });
    return out;
  }
  return [];
}

/** Hasta cuándo se puede descargar (WhatsApp: 7 días desde que llegó). */
export function downloadDeadline(channelType: string, receivedAt: Date): Date | null {
  if (channelType !== "whatsapp") return null;
  return new Date(receivedAt.getTime() + WHATSAPP_DOWNLOAD_DAYS * 24 * 60 * 60 * 1000);
}

const MIME_EXT: Record<string, string> = {
  "audio/ogg": "ogg",
  "audio/opus": "opus",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/aac": "aac",
  "audio/amr": "amr",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "video/mp4": "mp4",
  "video/3gpp": "3gp",
  "video/quicktime": "mov",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
  "text/csv": "csv",
};

/** "audio/ogg; codecs=opus" → "audio/ogg". */
export function baseMime(mime: string | null | undefined): string | null {
  const m = str(mime)?.split(";")[0]?.trim().toLowerCase();
  return m && /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/.test(m) ? m : null;
}

/** Extensión del archivo guardado: por tipo de contenido o, si no, por el nombre original. */
export function extensionFor(mime: string | null | undefined, fileName: string | null | undefined): string {
  const fromMime = MIME_EXT[baseMime(mime) ?? ""];
  if (fromMime) return fromMime;
  const fromName = str(fileName)?.split(".").pop()?.toLowerCase() ?? "";
  if (fromName && fromName !== str(fileName)?.toLowerCase() && /^[a-z0-9]{1,8}$/.test(fromName)) return fromName;
  return "bin";
}

/**
 * Ruta dentro del bucket privado. Sin datos personales (ni nombre, ni
 * teléfono, ni el nombre original del archivo): área, conversación e
 * identificador del adjunto.
 */
export function storagePathFor(input: { area: string; conversationId: string; attachmentId: string; ext: string }): string {
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${safe(input.area)}/${safe(input.conversationId)}/${safe(input.attachmentId)}.${safe(input.ext) || "bin"}`;
}

// Tipos que el navegador puede mostrar sin riesgo. Cualquier otro (HTML,
// SVG, scripts, desconocidos) se guarda como binario y se abre como descarga.
const INLINE_SAFE = new Set([
  "audio/ogg",
  "audio/opus",
  "audio/mpeg",
  "audio/mp4",
  "audio/aac",
  "audio/amr",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/3gpp",
  "video/quicktime",
  "application/pdf",
  "text/plain",
]);

const STORE_AS_IS = new Set([...INLINE_SAFE, ...Object.keys(MIME_EXT)]);

/** Tipo de contenido con el que se guarda: los riesgosos o desconocidos, como binario. */
export function storageContentType(mime: string | null | undefined): string {
  const m = baseMime(mime);
  return m && STORE_AS_IS.has(m) ? m : "application/octet-stream";
}

/** ¿Se puede abrir en el navegador o conviene descargarlo? */
export function opensInline(mime: string | null | undefined): boolean {
  const m = baseMime(mime);
  return !!m && INLINE_SAFE.has(m);
}

/** Nombre sugerido al descargar (el original si lo hay, sin caracteres raros). */
export function downloadName(input: { kind: AttachmentKind; fileName: string | null; ext: string; receivedAt: Date }): string {
  const original = str(input.fileName)?.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").slice(0, 120);
  if (original) return original;
  const d = input.receivedAt;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${KIND_LABEL[input.kind].toLowerCase()}-${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}.${input.ext}`;
}

/**
 * ¿Coincide la huella que informó Meta con la del archivo descargado?
 * Meta la informa en hexadecimal o en base64 según el caso: se aceptan
 * las dos. null si Meta no informó ninguna.
 */
export function sha256Matches(provider: string | null | undefined, hex: string, base64: string): boolean | null {
  const p = str(provider);
  if (!p) return null;
  return p.toLowerCase() === hex.toLowerCase() || p === base64 || p.replace(/=+$/, "") === base64.replace(/=+$/, "");
}

/** Tamaño legible. */
export function formatBytes(n: number | null | undefined): string {
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}
