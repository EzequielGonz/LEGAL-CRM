import { createHash, randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleInboundMessage } from "@/lib/inbound";
import { applyDeliveryStatus } from "@/lib/delivery-status";
import { findOrCreateContact, findOrCreateConversation } from "@/lib/contacts";
import { insertMessageRow } from "@/lib/messaging";
import { supabaseAttachmentStore } from "@/lib/adjuntos/guardar";
import { ATTACHMENTS_BUCKET, ATTACHMENT_MAX_BYTES, baseMime, extensionFor, storageContentType, storagePathFor, type AttachmentKind } from "@/lib/adjuntos/modelo";
import { descifrar } from "@/lib/wasender/cifrado";
import { descifrarArchivo } from "@/lib/wasender/cliente";
import { elegirEco, type PendienteEco } from "@/lib/wasender/eco";
import { estadoComoMeta, firmaValida, traducirEvento, type EventoWasender } from "@/lib/wasender/eventos";
import { lineaInterna } from "@/lib/wasender/lineas";
import { wasenderHabilitado } from "@/lib/wasender/envio";
import { antesDeProcesar, cambiosDevolver, cambiosTomar, despuesDeProcesar } from "@/lib/wasender/prueba";
import type { Area } from "@/lib/supabase/database.types";

/**
 * Entrada de Wasender (10/11): lo que llega por el webhook de una línea.
 *
 * - Mensaje de una persona → mismo camino que Meta (`handleInboundMessage`,
 *   sin cambios): contacto, oportunidad, chat y bot con su conocimiento.
 * - Estados de entrega → la misma función que usa Meta (`applyDeliveryStatus`).
 * - Eco de lo que mandó el panel → se empareja con su envío (no se duplica).
 * - Mensaje escrito desde el celular → aparece en el chat y el chat queda
 *   tomado por una persona, como «Tomar el chat».
 * - Modo prueba → el chat queda en atención humana entre mensaje y mensaje.
 *
 * Nada de esto toca a Meta. Lo que no se puede procesar queda retenido en
 * `wasender_eventos` con el motivo.
 */

type Db = ReturnType<typeof createAdminClient>;

const TIPO_ADJUNTO: Record<string, AttachmentKind> = { image: "imagen", video: "video", audio: "audio", document: "documento", sticker: "sticker" };

/** Espera antes de volver a buscar el envío del panel (el eco puede llegar antes de que se guarde). */
export const ESPERA_ECO_MS = 4_000;

async function registrarEvento(
  supabase: Db,
  fila: { linea_id: string | null; evento: string | null; resultado: "procesado" | "ignorado" | "retenido" | "error"; detalle?: string | null; payload?: unknown }
) {
  try {
    await (supabase.from("wasender_eventos" as any) as any).insert({
      linea_id: fila.linea_id,
      evento: fila.evento,
      resultado: fila.resultado,
      detalle: fila.detalle ? String(fila.detalle).slice(0, 1000) : null,
      payload: fila.payload ?? null,
    });
  } catch (err) {
    console.error("[wasender] No se pudo registrar el evento:", err);
  }
}

async function canalWhatsApp(supabase: Db, area: Area): Promise<string | null> {
  const { data } = await supabase.from("channels").select("id").eq("area", area).eq("type", "whatsapp").maybeSingle();
  return (data as any)?.id ?? null;
}

/** Contacto y conversación de ese número en el área (los mismos que usaría Meta). */
async function conversacionDe(supabase: Db, area: Area, telefono: string, nombre: string | null) {
  const channelId = await canalWhatsApp(supabase, area);
  if (!channelId) throw new Error(`No existe el canal de WhatsApp del área ${area}.`);
  const { contact } = await findOrCreateContact({ area, channelType: "whatsapp", externalUserId: telefono, phone: telefono, fullName: nombre, source: "organico_whatsapp", channelId });
  const conversation = await findOrCreateConversation({ contactId: contact.id, channelId, area });
  return { contact, conversation };
}

async function yaGuardado(supabase: Db, claveId: string): Promise<boolean> {
  const { data } = await supabase.from("messages").select("id").eq("external_message_id", claveId).is("duplicate_of", null).limit(1).maybeSingle();
  return !!data;
}

async function tomarSiSigueConIa(supabase: Db, conversationId: string, ahora: Date) {
  await (supabase.from("conversations") as any).update(cambiosTomar(ahora)).eq("id", conversationId).eq("ai_enabled", true);
}

/** Mensaje de una persona por una línea de Wasender. */
async function procesarEntrante(supabase: Db, linea: any, ev: Extract<EventoWasender, { tipo: "mensaje" }>): Promise<string> {
  if (!ev.telefono) {
    await registrarEvento(supabase, { linea_id: linea.id, evento: "mensaje", resultado: "retenido", detalle: "Llegó sin número de teléfono (identificador interno sin número).", payload: { claveId: ev.claveId, tipo: ev.tipoMensaje } });
    return "retenido";
  }
  if (await yaGuardado(supabase, ev.claveId)) return "duplicado";

  const area = linea.area as Area;
  const { conversation } = await conversacionDe(supabase, area, ev.telefono, ev.nombre);
  const puedeResponder =
    wasenderHabilitado() && linea.habilitada && linea.responde_con_bot && !linea.archivada_at && linea.estado === "connected";

  // Antes: en modo prueba se devuelve a la IA si el chat lo tomó el modo prueba;
  // si la línea no puede responder, el chat queda para una persona.
  const estadoChat = {
    aiEnabled: !!conversation.ai_enabled,
    humanTakeoverAt: (conversation as any).human_takeover_at ?? null,
    tomaAutomaticaAt: (conversation as any).wasender_toma_automatica_at ?? null,
  };
  if (puedeResponder && antesDeProcesar(estadoChat, !!linea.modo_prueba) === "devolver_a_ia") {
    await (supabase.from("conversations") as any).update(cambiosDevolver()).eq("id", conversation.id);
  } else if (!puedeResponder && conversation.ai_enabled) {
    await tomarSiSigueConIa(supabase, conversation.id, new Date());
  }

  const r = await handleInboundMessage({
    area,
    channelType: "whatsapp",
    externalUserId: ev.telefono,
    phone: ev.telefono,
    fullName: ev.nombre,
    body: ev.cuerpo,
    isButtonClick: ev.esBoton,
    externalMessageId: ev.claveId,
    messageType: ev.tipoMensaje,
    metadata: { ...ev.metadata, wasender_line_id: linea.id },
    aiReadable: ev.legible,
    // La línea de Meta de la conversación no se toca.
    lineId: null,
  });

  if (r.conversationId) {
    await (supabase.from("conversations") as any).update({ wasender_line_id: linea.id }).eq("id", r.conversationId);
    if (r.status === "guardado" && ev.archivo && r.messageId && r.contactId) {
      await guardarArchivo(supabase, linea, ev, { messageId: r.messageId, conversationId: r.conversationId, contactId: r.contactId });
    }
    // Después: en modo prueba el chat queda en atención humana (producción no le escribe).
    if (despuesDeProcesar(!!linea.modo_prueba) === "tomar") await tomarSiSigueConIa(supabase, r.conversationId, new Date());
  }
  return r.status;
}

async function pendientesDe(supabase: Db, conversationId: string): Promise<PendienteEco[]> {
  const { data } = await supabase
    .from("messages")
    .select("id, body, message_type, created_at, metadata")
    .eq("conversation_id", conversationId)
    .eq("direction", "saliente")
    .is("external_message_id", null)
    .order("created_at", { ascending: false })
    .limit(20);
  const sinId = (data ?? []) as PendienteEco[];
  const { data: conId } = await supabase
    .from("messages")
    .select("id, body, message_type, created_at, metadata")
    .eq("conversation_id", conversationId)
    .eq("direction", "saliente")
    .like("external_message_id", "wasender:%")
    .order("created_at", { ascending: false })
    .limit(20);
  return [...sinId, ...((conId ?? []) as PendienteEco[])];
}

/** Empareja el eco con el envío del panel. Devuelve true si lo encontró. */
async function emparejar(supabase: Db, linea: any, conversationId: string, claveId: string, eco: { cuerpo: string | null; tipoMensaje: string | null; esArchivo: boolean }): Promise<boolean> {
  const id = elegirEco(await pendientesDe(supabase, conversationId), { ...eco, lineaId: linea.id }, new Date());
  if (!id) return false;
  const { data: fila } = await supabase.from("messages").select("metadata").eq("id", id).maybeSingle();
  const metadata = { ...((fila as any)?.metadata ?? {}), wasender_pendiente: false, wasender_clave_id: claveId };
  await (supabase.from("messages") as any).update({ external_message_id: claveId, metadata }).eq("id", id);
  return true;
}

async function conversacionExistente(supabase: Db, area: Area, telefono: string): Promise<any | null> {
  const channelId = await canalWhatsApp(supabase, area);
  if (!channelId) return null;
  const { data: contacto } = await supabase.from("contacts").select("id").eq("area", area).eq("phone", telefono).maybeSingle();
  if (!contacto) return null;
  const { data: conv } = await supabase.from("conversations").select("*").eq("contact_id", (contacto as any).id).eq("channel_id", channelId).maybeSingle();
  return conv ?? null;
}

/** Mensaje propio: eco de un envío del panel o mensaje escrito desde el celular. */
async function procesarPropio(
  supabase: Db,
  linea: any,
  ev: { claveId: string; telefono: string | null; cuerpo: string | null; tipoMensaje: string | null; esArchivo: boolean; metadata?: Record<string, unknown> },
  opciones: { soloEco: boolean; esperar?: (ms: number) => Promise<void> }
): Promise<string> {
  if (!ev.telefono) return "sin_numero";
  if (await yaGuardado(supabase, ev.claveId)) return "duplicado";
  const area = linea.area as Area;
  const existente = await conversacionExistente(supabase, area, ev.telefono);
  if (existente && (await emparejar(supabase, linea, existente.id, ev.claveId, ev))) return "eco";

  // Puede que el envío del panel todavía no se haya guardado: se espera un poco y se vuelve a buscar.
  const esperar = opciones.esperar ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  await esperar(ESPERA_ECO_MS);
  if (await yaGuardado(supabase, ev.claveId)) return "duplicado";
  if (existente && (await emparejar(supabase, linea, existente.id, ev.claveId, ev))) return "eco";
  // «message.sent» solo confirma envíos: si no hay envío del panel, no se inventa un mensaje.
  if (opciones.soloEco) return "eco_sin_envio";

  // Lo escribió una persona desde el celular: queda en el chat y el chat pasa a atención humana.
  const { conversation } = existente ? { conversation: existente } : await conversacionDe(supabase, area, ev.telefono, null);
  const ahora = new Date().toISOString();
  await insertMessageRow(supabase, {
    conversation_id: conversation.id,
    sender_type: "admin",
    direction: "saliente",
    body: ev.cuerpo ?? "[Mensaje enviado desde el celular]",
    ...(ev.tipoMensaje && ev.tipoMensaje !== "text" ? { message_type: ev.tipoMensaje } : {}),
    metadata: { ...(ev.metadata ?? {}), proveedor: "wasender", wasender_line_id: linea.id, desde_celular: true },
    external_message_id: ev.claveId,
    delivery_status: "enviado",
    delivery_status_at: ahora,
    origin: "atencion_humana",
  });
  await (supabase.from("conversations") as any)
    .update({
      ai_enabled: false,
      status: "requiere_atencion_humana",
      ai_ack_token: null,
      ai_ack_expires_at: null,
      human_takeover_at: ahora,
      last_message_at: ahora,
      wasender_line_id: linea.id,
    })
    .eq("id", conversation.id);
  return "desde_celular";
}

/** Descarga el archivo recibido (el enlace de Wasender dura 1 hora) y lo guarda en el almacenamiento privado. */
async function guardarArchivo(
  supabase: Db,
  linea: any,
  ev: Extract<EventoWasender, { tipo: "mensaje" }>,
  ids: { messageId: string; conversationId: string; contactId: string }
) {
  const archivo = ev.archivo!;
  const kind = TIPO_ADJUNTO[ev.tipoMensaje] ?? "documento";
  const attachmentId = randomUUID();
  const mime = baseMime(archivo.mimeType);
  const base = {
    id: attachmentId,
    message_id: ids.messageId,
    position: 0,
    conversation_id: ids.conversationId,
    contact_id: ids.contactId,
    rubro_id: linea.rubro_id,
    line_id: null,
    area: linea.area,
    channel_type: "whatsapp",
    kind,
    provider_media_id: null,
    source_url: null,
    mime_type: mime,
    file_name: archivo.nombre,
    received_at: new Date().toISOString(),
  };
  try {
    const apiKey = descifrar(linea.api_key_cifrada);
    if (!apiKey) throw new Error("La línea no tiene su clave guardada.");
    const url = await descifrarArchivo(apiKey, { claveId: ev.claveId, contenido: archivo.contenido });
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`Wasender devolvió ${res.status} al bajar el archivo.`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength > ATTACHMENT_MAX_BYTES) throw new Error("El archivo supera el tamaño máximo.");
    const ext = extensionFor(mime, archivo.nombre);
    const path = storagePathFor({ area: linea.area, conversationId: ids.conversationId, attachmentId, ext });
    await supabaseAttachmentStore(supabase).put(path, bytes, storageContentType(mime));
    await (supabase.from("message_attachments") as any).insert({
      ...base,
      size_bytes: bytes.byteLength,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      storage_bucket: ATTACHMENTS_BUCKET,
      storage_path: path,
      status: "guardado",
      attempts: 1,
      last_attempt_at: new Date().toISOString(),
      saved_at: new Date().toISOString(),
    });
  } catch (err: any) {
    // «vencido» (no «error»): así el panel no intenta bajarlo de Meta.
    await (supabase.from("message_attachments") as any).insert({
      ...base,
      status: "vencido",
      attempts: 1,
      last_attempt_at: new Date().toISOString(),
      last_error: `No se pudo traer el archivo de Wasender: ${String(err?.message ?? err)}`.slice(0, 500),
    });
  }
}

export interface ResultadoWebhook {
  ok: boolean;
  motivo?: string;
  resultados: string[];
}

/** Punto de entrada del webhook de una línea. Siempre registra qué pasó. */
export async function procesarWebhook(
  entrada: { lineaId: string; firma: string | null; payload: any },
  deps: { supabase?: Db; esperar?: (ms: number) => Promise<void> } = {}
): Promise<ResultadoWebhook> {
  const supabase = deps.supabase ?? createAdminClient();
  const evento = typeof entrada.payload?.event === "string" ? entrada.payload.event : null;
  const linea = /^[0-9a-f-]{36}$/i.test(entrada.lineaId) ? await lineaInterna(entrada.lineaId, supabase) : null;
  if (!linea) {
    await registrarEvento(supabase, { linea_id: null, evento, resultado: "retenido", detalle: "Llegó para una línea que no existe.", payload: entrada.payload });
    return { ok: false, motivo: "linea_desconocida", resultados: [] };
  }
  const secreto = descifrar(linea.webhook_secret_cifrado);
  if (!firmaValida(entrada.firma, secreto)) {
    await registrarEvento(supabase, {
      linea_id: linea.id,
      evento,
      resultado: "retenido",
      detalle: secreto ? "La firma no coincide con el secreto de la línea." : "La línea no tiene su secreto guardado.",
      payload: entrada.payload,
    });
    return { ok: false, motivo: "firma_invalida", resultados: [] };
  }

  const resultados: string[] = [];
  for (const ev of traducirEvento(entrada.payload)) {
    try {
      if (ev.tipo === "sesion") {
        const caida = ["logged_out", "expired", "disconnected", "need_scan"].includes(ev.estado);
        await (supabase.from("wasender_lineas" as any) as any)
          .update({ estado: ev.estado, estado_at: new Date().toISOString(), ...(caida ? { habilitada: false } : {}) })
          .eq("id", linea.id);
        resultados.push(`sesion:${ev.estado}`);
      } else if (ev.tipo === "mensaje") {
        if (!ev.deMi) {
          resultados.push(`entrante:${await procesarEntrante(supabase, linea, ev)}`);
        } else {
          resultados.push(
            `propio:${await procesarPropio(
              supabase,
              linea,
              { claveId: ev.claveId, telefono: ev.telefono, cuerpo: ev.cuerpo, tipoMensaje: ev.tipoMensaje, esArchivo: !!ev.archivo, metadata: ev.metadata },
              { soloEco: false, esperar: deps.esperar }
            )}`
          );
        }
      } else if (ev.tipo === "enviado") {
        resultados.push(
          `enviado:${await procesarPropio(supabase, linea, { claveId: ev.claveId, telefono: ev.telefono, cuerpo: ev.cuerpo, tipoMensaje: null, esArchivo: false }, { soloEco: true, esperar: deps.esperar })}`
        );
      } else if (ev.tipo === "estado") {
        if (ev.deMi) {
          await applyDeliveryStatus({ id: ev.claveId, status: estadoComoMeta(ev.estado), timestamp: String(Math.floor(Date.now() / 1000)), recipient_id: ev.telefono });
          resultados.push(`estado:${ev.estado}`);
        } else {
          resultados.push("estado:ajeno");
        }
      } else {
        resultados.push(ev.tipo === "qr" ? "qr" : `ignorado:${ev.motivo}`);
      }
    } catch (err: any) {
      console.error("[wasender] Error procesando un evento:", err);
      await registrarEvento(supabase, { linea_id: linea.id, evento, resultado: "error", detalle: String(err?.message ?? err), payload: entrada.payload });
      resultados.push("error");
    }
  }
  const todoIgnorado = resultados.every((r) => r.startsWith("ignorado") || r === "qr");
  await registrarEvento(supabase, { linea_id: linea.id, evento, resultado: todoIgnorado ? "ignorado" : "procesado", detalle: resultados.join(", ") });
  return { ok: true, resultados };
}
