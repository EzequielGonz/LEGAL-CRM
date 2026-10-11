import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { whatsappCredentials } from "@/lib/whatsapp/client";
import type { Area } from "@/lib/supabase/database.types";
import {
  ATTACHMENTS_BUCKET,
  ATTACHMENT_MAX_BYTES,
  INLINE_MAX_BYTES,
  SIGNED_URL_SECONDS,
  attachmentCandidates,
  baseMime,
  downloadDeadline,
  downloadName,
  extensionFor,
  formatBytes,
  opensInline,
  sha256Matches,
  storageContentType,
  storagePathFor,
  type AttachmentKind,
  type AttachmentStatus,
} from "@/lib/adjuntos/modelo";

/**
 * Guardado privado de los originales que manda una persona (audios, fotos,
 * videos y documentos). Solo descarga de Meta y guarda en el bucket
 * privado: no transcribe, no responde y no envía nada a nadie.
 */

const GRAPH = "https://graph.facebook.com/v21.0";
/** Tiempo máximo de cada llamada a Meta. */
const FETCH_TIMEOUT_MS = 20_000;
/** Al recibir un mensaje, el guardado en el momento no puede demorar más que esto. */
const INLINE_BUDGET_MS = 12_000;
/** Meta puede devolver una página en lugar del archivo si el pedido no trae un agente identificable. */
const USER_AGENT = "legal-crm-adjuntos/1.0";

type Db = ReturnType<typeof createAdminClient>;

/** Dónde se guardan los archivos (el bucket privado; en las pruebas, uno en memoria). */
export interface AttachmentStore {
  put(path: string, bytes: Uint8Array, contentType: string): Promise<void>;
  /** Enlace firmado de corta duración. `download` = nombre para forzar la descarga. */
  signedUrl(path: string, seconds: number, download: string | null): Promise<string>;
}

export function supabaseAttachmentStore(supabase: Db = createAdminClient()): AttachmentStore {
  return {
    async put(path, bytes, contentType) {
      const { error } = await supabase.storage
        .from(ATTACHMENTS_BUCKET)
        .upload(path, bytes, { contentType, upsert: true, cacheControl: "300" });
      if (error) throw new Error(`No se pudo guardar en el almacenamiento privado: ${error.message}`);
    },
    async signedUrl(path, seconds, download) {
      const { data, error } = await supabase.storage
        .from(ATTACHMENTS_BUCKET)
        .createSignedUrl(path, seconds, download ? { download } : undefined);
      if (error || !data?.signedUrl) throw new Error(`No se pudo abrir el archivo: ${error?.message ?? "sin enlace"}`);
      return data.signedUrl;
    },
  };
}

export interface AttachmentDeps {
  supabase?: Db;
  store?: AttachmentStore;
  fetchImpl?: typeof fetch;
  /** Token para descargar de WhatsApp (por defecto, el de la línea o el del área). */
  whatsappToken?: (area: Area, credentialKey: string | null) => string | undefined;
}

function deps(d: AttachmentDeps) {
  const supabase = d.supabase ?? createAdminClient();
  return {
    supabase,
    store: d.store ?? supabaseAttachmentStore(supabase),
    fetchImpl: d.fetchImpl ?? fetch,
    whatsappToken: d.whatsappToken ?? ((area: Area, key: string | null) => whatsappCredentials(area, key).accessToken),
  };
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

/**
 * Registra los adjuntos de un mensaje entrante ya guardado (estado
 * "pendiente"). Repetirlo no duplica nada. Devuelve los ids en orden.
 */
export async function registerMessageAttachments(
  input: {
    messageId: string;
    conversationId: string;
    contactId: string;
    area: Area;
    channelType: string;
    messageType?: string | null;
    metadata?: Record<string, any> | null;
    lineId?: string | null;
    rubroId?: string | null;
    receivedAt?: Date;
  },
  d: AttachmentDeps = {}
): Promise<string[]> {
  const candidates = attachmentCandidates({
    channelType: input.channelType,
    messageType: input.messageType,
    metadata: input.metadata,
  });
  if (!candidates.length) return [];
  const { supabase } = deps(d);
  const receivedAt = input.receivedAt ?? new Date();
  const deadline = downloadDeadline(input.channelType, receivedAt);
  const rows = candidates.map((c) => ({
    message_id: input.messageId,
    position: c.position,
    conversation_id: input.conversationId,
    contact_id: input.contactId,
    rubro_id: input.rubroId ?? null,
    line_id: input.lineId ?? null,
    area: input.area,
    channel_type: input.channelType,
    kind: c.kind,
    provider_media_id: c.provider_media_id,
    source_url: c.source_url,
    mime_type: baseMime(c.mime_type),
    file_name: c.file_name,
    provider_sha256: c.provider_sha256,
    received_at: receivedAt.toISOString(),
    expires_at: deadline ? deadline.toISOString() : null,
  }));
  const { error } = await supabase
    .from("message_attachments")
    .upsert(rows, { onConflict: "message_id,position", ignoreDuplicates: true });
  if (error) throw new Error(`No se pudo registrar el adjunto: ${error.message}`);
  const { data } = await supabase
    .from("message_attachments")
    .select("id")
    .eq("message_id", input.messageId)
    .order("position", { ascending: true });
  return (data ?? []).map((r: any) => r.id as string);
}

/**
 * Registra a pedido los adjuntos de un mensaje entrante que llegó antes de
 * que existiera este guardado (o cuyo registro falló al recibirlo).
 */
export async function registerFromMessage(messageId: string, d: AttachmentDeps = {}): Promise<string[]> {
  const { supabase } = deps(d);
  const { data: msg } = await supabase
    .from("messages")
    .select("id, direction, message_type, metadata, created_at, conversation_id, conversations(contact_id, area, line_id, channels(type), contacts(rubro_id))")
    .eq("id", messageId)
    .maybeSingle();
  if (!msg || (msg as any).direction !== "entrante") return [];
  const conv = (msg as any).conversations;
  if (!conv) return [];
  return registerMessageAttachments(
    {
      messageId: msg.id,
      conversationId: (msg as any).conversation_id,
      contactId: conv.contact_id,
      area: conv.area,
      channelType: conv.channels?.type ?? "",
      messageType: (msg as any).message_type,
      metadata: (msg as any).metadata,
      lineId: conv.line_id ?? null,
      rubroId: conv.contacts?.rubro_id ?? null,
      receivedAt: new Date((msg as any).created_at),
    },
    d
  );
}

// ---------------------------------------------------------------------------
// Descarga y guardado
// ---------------------------------------------------------------------------

export type SaveOutcome = {
  attachmentId: string;
  /** "ocupado": otro proceso lo está guardando en este momento. */
  status: AttachmentStatus | "ocupado" | "no_existe";
  detail: string | null;
};

class SaveStop extends Error {
  status: AttachmentStatus;
  constructor(status: AttachmentStatus, message: string) {
    super(message);
    this.name = "SaveStop";
    this.status = status;
  }
}

async function readWithLimit(res: Response, max: number): Promise<Uint8Array> {
  const declared = Number(res.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > max) {
    throw new SaveStop("demasiado_grande", `Pesa ${formatBytes(declared)}; el tope es ${formatBytes(max)}.`);
  }
  if (!res.body) return new Uint8Array(await res.arrayBuffer());
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => undefined);
      throw new SaveStop("demasiado_grande", `Pesa más de ${formatBytes(max)}.`);
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

function metaErrorText(raw: string, status: number): string {
  try {
    const e = JSON.parse(raw)?.error;
    if (e?.message) return `Meta respondió ${status}${e.code ? ` (código ${e.code})` : ""}: ${String(e.message).slice(0, 300)}`;
  } catch {
    // no era JSON
  }
  return `Meta respondió ${status}.`;
}

/**
 * Descarga el original de Meta y lo guarda en el bucket privado. Una sola
 * ejecución a la vez por adjunto (reserva en la base). `maxBytes` permite
 * dejar para después lo muy pesado (queda pendiente, se guarda a pedido).
 */
export async function saveAttachment(
  attachmentId: string,
  opts: { maxBytes?: number } = {},
  d: AttachmentDeps = {}
): Promise<SaveOutcome> {
  const { supabase, store, fetchImpl, whatsappToken } = deps(d);
  const hardMax = ATTACHMENT_MAX_BYTES;
  const softMax = Math.min(opts.maxBytes ?? hardMax, hardMax);

  const { data: token, error: claimError } = await supabase.rpc("attachment_claim", {
    p_attachment: attachmentId,
    p_seconds: 120,
  });
  if (claimError) throw new Error(`No se pudo reservar el adjunto: ${claimError.message}`);

  const { data: row } = await supabase
    .from("message_attachments")
    .select("id, status, last_error, conversation_id, area, channel_type, kind, provider_media_id, source_url, mime_type, file_name, provider_sha256, line_id, received_at")
    .eq("id", attachmentId)
    .maybeSingle();
  if (!row) return { attachmentId, status: "no_existe", detail: "No existe ese adjunto." };
  if (!token) {
    const st = (row as any).status as AttachmentStatus;
    return {
      attachmentId,
      status: st === "pendiente" || st === "error" ? "ocupado" : st,
      detail: st === "pendiente" || st === "error" ? "Se está guardando en este momento." : (row as any).last_error ?? null,
    };
  }

  const finish = async (status: AttachmentStatus, fields: Record<string, unknown>) => {
    const { data: ok, error } = await supabase.rpc("attachment_finish", {
      p_attachment: attachmentId,
      p_token: token,
      p_status: status,
      p_fields: fields,
    });
    if (error) throw new Error(`No se pudo registrar el resultado del adjunto: ${error.message}`);
    return ok === true;
  };

  const r = row as any;
  try {
    let url: string;
    let auth: Record<string, string> = {};
    let mime: string | null = r.mime_type;
    let providerSha: string | null = r.provider_sha256;

    if (r.channel_type === "whatsapp") {
      if (!r.provider_media_id) throw new SaveStop("error", "Falta el identificador del archivo en Meta.");
      let credentialKey: string | null = null;
      if (r.line_id) {
        const { data: line } = await supabase.from("profile_lines").select("credential_key, active").eq("id", r.line_id).maybeSingle();
        if (line && (line as any).active) credentialKey = (line as any).credential_key;
      }
      let accessToken: string | undefined;
      try {
        accessToken = whatsappToken(r.area, credentialKey);
      } catch (err: any) {
        throw new SaveStop("error", String(err?.message ?? err));
      }
      if (!accessToken) throw new SaveStop("error", "Falta el token de WhatsApp de esta línea en las variables privadas.");
      auth = { Authorization: `Bearer ${accessToken}`, "User-Agent": USER_AGENT };

      const infoRes = await fetchImpl(`${GRAPH}/${encodeURIComponent(r.provider_media_id)}`, {
        headers: auth,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      const infoRaw = await infoRes.text();
      if (!infoRes.ok) throw new SaveStop("error", metaErrorText(infoRaw, infoRes.status));
      let info: any = {};
      try {
        info = JSON.parse(infoRaw);
      } catch {
        throw new SaveStop("error", "Meta devolvió una respuesta que no se pudo leer.");
      }
      if (typeof info?.url !== "string" || !/^https:\/\//i.test(info.url)) {
        throw new SaveStop("error", "Meta no devolvió el enlace de descarga.");
      }
      url = info.url;
      mime = baseMime(info.mime_type) ?? mime;
      providerSha = typeof info.sha256 === "string" ? info.sha256 : providerSha;
      const declared = Number(info.file_size);
      if (Number.isFinite(declared) && declared > hardMax) {
        throw new SaveStop("demasiado_grande", `Pesa ${formatBytes(declared)}; el tope es ${formatBytes(hardMax)}.`);
      }
      if (Number.isFinite(declared) && declared > softMax) {
        await finish("pendiente", { last_error: `Pesa ${formatBytes(declared)}: se guarda al abrirlo o con "Guardar ahora".` });
        return { attachmentId, status: "pendiente", detail: `Pesa ${formatBytes(declared)}: queda para guardar a pedido.` };
      }
    } else {
      if (!r.source_url || !/^https:\/\//i.test(r.source_url)) throw new SaveStop("error", "Falta el enlace del archivo.");
      url = r.source_url;
      auth = { "User-Agent": USER_AGENT };
    }

    const fileRes = await fetchImpl(url, { headers: auth, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!fileRes.ok) {
      throw new SaveStop("error", `La descarga respondió ${fileRes.status}.`);
    }
    // Meta a veces devuelve una página de error con código 200: si se
    // esperaba otro tipo de archivo, no se guarda como si fuera el original.
    if (baseMime(fileRes.headers.get("content-type")) === "text/html" && baseMime(mime) !== "text/html") {
      await fileRes.body?.cancel().catch(() => undefined);
      throw new SaveStop("error", "Meta devolvió una página en lugar del archivo.");
    }
    const bytes = await readWithLimit(fileRes, softMax).catch(async (err) => {
      if (err instanceof SaveStop && err.status === "demasiado_grande" && softMax < hardMax) {
        // Más pesado de lo que se guarda en el momento: queda para después.
        throw new SaveStop("pendiente", "Es pesado: se guarda al abrirlo o con \"Guardar ahora\".");
      }
      throw err;
    });
    mime = mime ?? baseMime(fileRes.headers.get("content-type"));

    const hex = createHash("sha256").update(bytes).digest("hex");
    const b64 = createHash("sha256").update(bytes).digest("base64");
    const ext = extensionFor(mime, r.file_name);
    const path = storagePathFor({ area: r.area, conversationId: r.conversation_id, attachmentId, ext });
    await store.put(path, bytes, storageContentType(mime));

    await finish("guardado", {
      mime_type: mime,
      size_bytes: bytes.byteLength,
      sha256: hex,
      sha256_matches: sha256Matches(providerSha, hex, b64),
      storage_bucket: ATTACHMENTS_BUCKET,
      storage_path: path,
      provider_sha256: providerSha,
    });
    return { attachmentId, status: "guardado", detail: null };
  } catch (err: any) {
    const status: AttachmentStatus = err instanceof SaveStop ? err.status : "error";
    const detail =
      err instanceof SaveStop
        ? err.message
        : err?.name === "TimeoutError" || err?.name === "AbortError"
        ? "Meta no respondió a tiempo."
        : String(err?.message ?? err).slice(0, 500);
    try {
      await finish(status, { last_error: detail });
    } catch (finishErr) {
      // La reserva vence sola (2 minutos) y el adjunto se puede reintentar.
      console.error("[adjuntos] No se pudo registrar el resultado:", finishErr);
    }
    return { attachmentId, status, detail };
  }
}

/**
 * Guardado en el momento de recibir el mensaje: con un tope de tiempo y de
 * tamaño, para no demorar la respuesta a Meta. Lo que no entra queda
 * pendiente y se guarda al abrirlo o desde Revisión.
 */
export async function saveInboundAttachments(ids: string[], d: AttachmentDeps = {}): Promise<SaveOutcome[]> {
  const started = Date.now();
  const out: SaveOutcome[] = [];
  for (const id of ids) {
    if (Date.now() - started > INLINE_BUDGET_MS) break;
    try {
      out.push(await saveAttachment(id, { maxBytes: INLINE_MAX_BYTES }, d));
    } catch (err) {
      console.error("[adjuntos] No se pudo guardar el adjunto al recibirlo:", err);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Acceso desde el panel
// ---------------------------------------------------------------------------

export type OpenResult = { ok: true; url: string } | { ok: false; httpStatus: number; message: string };

const NOT_SAVED_MESSAGE: Record<string, { httpStatus: number; message: string }> = {
  vencido: { httpStatus: 410, message: "Meta ya no permite descargar este archivo (pasaron más de 7 días) y no llegó a guardarse." },
  demasiado_grande: { httpStatus: 413, message: "El archivo supera el tope de 50 MB y no se guardó." },
  ocupado: { httpStatus: 409, message: "Se está guardando en este momento. Probá de nuevo en unos segundos." },
  no_existe: { httpStatus: 404, message: "No existe ese adjunto." },
};

/**
 * Enlace firmado (corta duración) para abrir un original guardado. Si
 * todavía no se guardó y Meta lo permite, se guarda en ese momento.
 */
export async function openAttachment(attachmentId: string, d: AttachmentDeps = {}): Promise<OpenResult> {
  const { supabase, store } = deps(d);
  const load = async () =>
    (
      await supabase
        .from("message_attachments")
        .select("id, status, kind, mime_type, file_name, storage_path, received_at, last_error")
        .eq("id", attachmentId)
        .maybeSingle()
    ).data as any;

  let row = await load();
  if (!row) return { ok: false, ...NOT_SAVED_MESSAGE.no_existe };
  if (row.status !== "guardado") {
    if (row.status === "pendiente" || row.status === "error") {
      const outcome = await saveAttachment(attachmentId, {}, d);
      if (outcome.status !== "guardado") {
        const known = NOT_SAVED_MESSAGE[outcome.status];
        return known
          ? { ok: false, ...known }
          : { ok: false, httpStatus: 502, message: `No se pudo guardar el archivo: ${outcome.detail ?? "error desconocido"}` };
      }
      row = await load();
    } else {
      return { ok: false, ...(NOT_SAVED_MESSAGE[row.status] ?? { httpStatus: 404, message: "El archivo no está guardado." }) };
    }
  }
  if (!row?.storage_path) return { ok: false, httpStatus: 404, message: "El archivo no está guardado." };
  const ext = row.storage_path.split(".").pop() ?? "bin";
  const download = opensInline(row.mime_type)
    ? null
    : downloadName({ kind: row.kind as AttachmentKind, fileName: row.file_name, ext, receivedAt: new Date(row.received_at) });
  try {
    return { ok: true, url: await store.signedUrl(row.storage_path, SIGNED_URL_SECONDS, download) };
  } catch (err: any) {
    return { ok: false, httpStatus: 502, message: String(err?.message ?? err) };
  }
}

/** Adjunto de un mensaje (por posición). Lo registra si el mensaje es anterior a este guardado. */
export async function attachmentIdForMessage(messageId: string, position = 0, d: AttachmentDeps = {}): Promise<string | null> {
  const { supabase } = deps(d);
  const find = async () =>
    (
      await supabase
        .from("message_attachments")
        .select("id")
        .eq("message_id", messageId)
        .eq("position", position)
        .maybeSingle()
    ).data as any;
  const existing = await find();
  if (existing) return existing.id;
  await registerFromMessage(messageId, d);
  return (await find())?.id ?? null;
}
