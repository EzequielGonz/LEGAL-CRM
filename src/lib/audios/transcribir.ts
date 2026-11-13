import { GoogleGenAI } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/admin";
import { identificadorModelo } from "@/lib/agentes/modelo";
import { attachmentIdForMessage, saveAttachment } from "@/lib/adjuntos/guardar";
import {
  AUDIO_MAX_BYTES,
  AUDIO_PRESUPUESTO_MS,
  CLAVE_AUDIOS,
  INSTRUCCION_TRANSCRIPCION,
  audiosEncendidos,
  cambiarLlaveAudios,
  correspondeTranscribir,
  duracionOggSeg,
  leerTranscripcion,
  type ResultadoAudio,
} from "@/lib/audios/reglas";

/**
 * Pasa a texto los audios que manda una persona (13/11). Usa el mismo
 * proveedor que ya lee los chats. Solo lee el audio y escribe el texto en el
 * mensaje: no responde ni le manda nada a nadie.
 */

type Db = ReturnType<typeof createAdminClient>;

export interface AudioCrudo {
  bytes: Uint8Array;
  mime: string | null;
}

/** Llamada al modelo, separada para poder probar todo lo demás sin la IA real. */
export type Transcriptor = (req: { bytes: Uint8Array; mime: string; senal: AbortSignal }) => Promise<{ crudo: string; tokens?: number }>;

let _cliente: GoogleGenAI | null = null;
const gemini = () => (_cliente ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }));

const transcriptorGemini: Transcriptor = async ({ bytes, mime, senal }) => {
  const resp = await gemini().models.generateContent({
    model: identificadorModelo(),
    contents: [
      {
        role: "user",
        parts: [{ inlineData: { mimeType: mime, data: Buffer.from(bytes).toString("base64") } }, { text: "Pasá este mensaje de voz a texto." }],
      },
    ],
    config: { systemInstruction: INSTRUCCION_TRANSCRIPCION, responseMimeType: "application/json", abortSignal: senal },
  });
  const crudo = (resp.candidates?.[0]?.content?.parts ?? []).map((p: any) => (typeof p.text === "string" && !p.thought ? p.text : "")).join("");
  const u: any = (resp as any).usageMetadata ?? {};
  return { crudo, tokens: (u.promptTokenCount ?? 0) + (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0) };
};

let _transcriptor: Transcriptor = transcriptorGemini;
/** Solo pruebas: reemplaza la llamada al modelo (null vuelve al real). */
export function usarTranscriptor(t: Transcriptor | null) {
  _transcriptor = t ?? transcriptorGemini;
}

export interface Transcripcion extends ResultadoAudio {
  tokens: number | null;
  ms: number;
}

/** Aplica las reglas, llama al modelo con tope de tiempo y lee la respuesta. Nunca lanza. */
export async function transcribirBytes(audio: AudioCrudo, opts: { presupuestoMs?: number } = {}): Promise<Transcripcion> {
  const inicio = Date.now();
  const segundos = duracionOggSeg(audio.bytes);
  const base = { texto: "", claridad: "no" as const, idioma: null, segundos, tokens: null };
  const regla = correspondeTranscribir({ mime: audio.mime, bytes: audio.bytes.byteLength, segundos });
  if (!regla.ok) return { ...base, estado: regla.estado, detalle: regla.detalle, ms: 0 };
  if (_transcriptor === transcriptorGemini && !process.env.GEMINI_API_KEY) {
    return { ...base, estado: "error", detalle: "Falta la clave del proveedor de IA en las variables privadas.", ms: 0 };
  }
  const presupuesto = opts.presupuestoMs ?? AUDIO_PRESUPUESTO_MS;
  const corte = new AbortController();
  let reloj: ReturnType<typeof setTimeout> | undefined;
  try {
    const r = await Promise.race([
      _transcriptor({ bytes: audio.bytes, mime: regla.mime, senal: corte.signal }),
      new Promise<never>((_, rechazar) => {
        reloj = setTimeout(() => {
          corte.abort();
          rechazar(new Error("tiempo"));
        }, presupuesto);
      }),
    ]);
    const leido = leerTranscripcion(r.crudo);
    return { ...leido, segundos, tokens: r.tokens ?? null, ms: Date.now() - inicio };
  } catch (err: any) {
    const tiempo = err?.message === "tiempo" || err?.name === "AbortError";
    return {
      ...base,
      estado: "error",
      detalle: tiempo ? `El proveedor de IA tardó más de ${Math.round(presupuesto / 1000)} segundos.` : `El proveedor de IA devolvió un error: ${String(err?.message ?? err).slice(0, 200)}`,
      ms: Date.now() - inicio,
    };
  } finally {
    if (reloj) clearTimeout(reloj);
  }
}

/** Escribe el resultado en el mensaje. El cuerpo y el original no se tocan. */
export async function guardarTranscripcion(supabase: Db, messageId: string, t: Transcripcion): Promise<void> {
  const { error } = await (supabase.from("messages") as any)
    .update({
      audio_texto: t.estado === "hecha" ? t.texto : null,
      audio_texto_estado: t.estado,
      audio_texto_idioma: t.idioma,
      audio_texto_detalle: t.detalle ? t.detalle.slice(0, 500) : t.estado === "hecha" && t.claridad === "a_medias" ? "Algunas partes no se entendieron bien." : null,
      audio_texto_at: new Date().toISOString(),
      audio_seg: t.segundos,
      audio_tokens: t.tokens,
      audio_ms: t.ms,
    })
    .eq("id", messageId);
  if (error) throw new Error(`No se pudo guardar el texto del audio: ${error.message}`);
}

export async function leerLlaveAudios(supabase: Db): Promise<unknown> {
  const { data } = await (supabase.from("system_settings") as any).select("value").eq("key", CLAVE_AUDIOS).maybeSingle();
  return (data as any)?.value ?? null;
}

/** Enciende o apaga la función en un perfil. Los otros perfiles no se tocan. */
export async function cambiarAudiosDePerfil(perfil: string, encendido: boolean, por: string, supabase: Db = createAdminClient()) {
  const valor = cambiarLlaveAudios(await leerLlaveAudios(supabase), perfil, encendido, new Date(), por);
  const { error } = await (supabase.from("system_settings") as any).upsert({ key: CLAVE_AUDIOS, value: valor });
  if (error) throw new Error(`No se pudo guardar el ajuste: ${error.message}`);
  return valor;
}

/** El audio ya guardado en el almacenamiento privado (lo guarda en el momento si todavía no estaba). */
export async function audioDeAdjunto(supabase: Db, attachmentId: string): Promise<AudioCrudo | null> {
  const leer = async () =>
    (await (supabase.from("message_attachments") as any).select("kind, status, mime_type, size_bytes, storage_bucket, storage_path").eq("id", attachmentId).maybeSingle()).data as any;
  let fila = await leer();
  if (!fila || fila.kind !== "audio") return null;
  if (fila.status === "pendiente" || fila.status === "error") {
    await saveAttachment(attachmentId, { maxBytes: AUDIO_MAX_BYTES });
    fila = await leer();
  }
  if (fila?.status !== "guardado" || !fila.storage_bucket || !fila.storage_path) return null;
  if (Number(fila.size_bytes) > AUDIO_MAX_BYTES) return { bytes: new Uint8Array(AUDIO_MAX_BYTES + 1), mime: fila.mime_type };
  const { data, error } = await supabase.storage.from(fila.storage_bucket).download(fila.storage_path);
  if (error || !data) return null;
  return { bytes: new Uint8Array(await data.arrayBuffer()), mime: fila.mime_type ?? data.type ?? null };
}

/**
 * Al recibir un audio: si la función está encendida en ese perfil, lo pasa a
 * texto y lo guarda en el mensaje. Null = apagada o sin audio (todo sigue
 * como antes). Nunca lanza: un problema acá no puede frenar la entrada.
 */
export async function transcribirEntrante(input: {
  supabase: Db;
  messageId: string;
  perfil: string;
  obtener: () => Promise<AudioCrudo | null>;
}): Promise<Transcripcion | null> {
  try {
    if (!audiosEncendidos(await leerLlaveAudios(input.supabase), input.perfil)) return null;
    const inicio = Date.now();
    const audio = await Promise.race([input.obtener(), new Promise<null>((r) => setTimeout(() => r(null), AUDIO_PRESUPUESTO_MS))]);
    let t: Transcripcion;
    if (!audio) {
      t = { estado: "error", texto: "", claridad: "no", idioma: null, segundos: null, detalle: "No se pudo traer el audio a tiempo.", tokens: null, ms: Date.now() - inicio };
    } else {
      // Lo que tardó en bajar se descuenta: entre bajar y transcribir no se pasa del tope.
      t = await transcribirBytes(audio, { presupuestoMs: Math.max(5_000, AUDIO_PRESUPUESTO_MS - (Date.now() - inicio)) });
    }
    await guardarTranscripcion(input.supabase, input.messageId, t);
    return t;
  } catch (err) {
    console.error("[audios] No se pudo pasar el audio a texto:", err);
    return null;
  }
}

export type ResultadoBoton = { ok: true; transcripcion: Transcripcion } | { ok: false; httpStatus: number; error: string };

/**
 * «Pasar a texto» desde el panel, sobre un audio ya recibido. Solo escribe
 * el texto en el mensaje: no dispara ninguna respuesta ni cambia el estado
 * de la persona.
 */
export async function transcribirMensaje(messageId: string, supabase: Db = createAdminClient()): Promise<ResultadoBoton> {
  const { data: msg } = await (supabase.from("messages") as any).select("id, direction, message_type").eq("id", messageId).maybeSingle();
  if (!msg) return { ok: false, httpStatus: 404, error: "No existe ese mensaje." };
  if (msg.direction !== "entrante" || msg.message_type !== "audio") return { ok: false, httpStatus: 422, error: "Ese mensaje no es un audio recibido." };
  const attachmentId = await attachmentIdForMessage(messageId, 0, { supabase });
  const audio = attachmentId ? await audioDeAdjunto(supabase, attachmentId) : null;
  if (!audio) return { ok: false, httpStatus: 422, error: "El audio original no está guardado y ya no se puede descargar." };
  // Desde el panel no corre el apuro del webhook: se le da más tiempo.
  const t = await transcribirBytes(audio, { presupuestoMs: 45_000 });
  await guardarTranscripcion(supabase, messageId, t);
  return { ok: true, transcripcion: t };
}
