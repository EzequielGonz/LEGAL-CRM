// Guardado privado de originales (audios, fotos, videos y documentos) y su
// acceso desde la conversación y la ficha. Alcance acotado: sin
// transcripción, sin respuestas y sin envíos. Meta y Storage simulados.
import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";

import { RedSimulada, SIN_PAUSA, crearContacto, db, esperarApi, fijarPausa, sql, telefonoFicticio } from "./soporte/entorno";
import { processWhatsAppPayload } from "@/lib/webhooks/process";
import { handleInboundMessage } from "@/lib/inbound";
import { openAttachment, saveAttachment } from "@/lib/adjuntos/guardar";
import { GET as abrirDeMensaje } from "@/app/api/adjuntos/mensaje/[messageId]/route";
import { GET as abrirAdjunto } from "@/app/api/adjuntos/[id]/route";
import { POST as guardarAhora } from "@/app/api/adjuntos/[id]/guardar/route";

const JURIDICO = "11111111-1111-1111-1111-111111111111";
const LINEA_CIVIL = process.env.WHATSAPP_CIVIL_PHONE_NUMBER_ID!;

let red: RedSimulada;
before(async () => {
  red = new RedSimulada();
  await esperarApi();
  // Sin pausa (solo en la base de pruebas): así se comprueba que un audio
  // tampoco dispara respuestas ni envíos cuando todo está habilitado.
  await fijarPausa(SIN_PAUSA);
});
after(() => red.restaurar());

function webhook(phone: string, message: Record<string, unknown>) {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "WABA-PRUEBA",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: { display_phone_number: "5491100000000", phone_number_id: LINEA_CIVIL },
              contacts: [{ wa_id: phone, profile: { name: "Persona De Prueba" } }],
              messages: [{ from: phone, id: `wamid.ENTRANTE.${randomUUID()}`, timestamp: String(Math.floor(Date.now() / 1000)), ...message }],
            },
          },
        ],
      },
    ],
  };
}

async function adjuntosDe(externalId: string) {
  const { data: msg } = await db().from("messages").select("id, conversation_id").eq("external_message_id", externalId).single();
  const { data } = await db().from("message_attachments").select("*").eq("message_id", msg!.id).order("position");
  return { messageId: msg!.id as string, conversationId: msg!.conversation_id as string, rows: (data ?? []) as any[] };
}

function medio(mime: string, size = 2048) {
  const bytes = new Uint8Array(randomBytes(size));
  const mediaId = `MEDIA_${randomUUID().replace(/-/g, "")}`;
  return { mediaId, bytes, mime };
}

test("adjuntos: un audio de WhatsApp se guarda en privado, sin datos personales en la ruta y sin responder nada", async () => {
  const phone = telefonoFicticio();
  const a = medio("audio/ogg");
  // Meta informa la huella en base64: se acepta igual.
  red.medios.set(a.mediaId, { bytes: a.bytes, mime: a.mime, sha256: createHash("sha256").update(a.bytes).digest("base64") });
  const payload = webhook(phone, { type: "audio", audio: { id: a.mediaId, mime_type: "audio/ogg; codecs=opus", voice: true } });
  const externalId = (payload.entry[0].changes[0].value.messages[0] as any).id;

  const resumen = await processWhatsAppPayload(payload);
  assert.equal(resumen.mensajes, 1);

  const { messageId, conversationId, rows } = await adjuntosDe(externalId);
  assert.equal(rows.length, 1);
  const r = rows[0];
  assert.equal(r.status, "guardado", r.last_error ?? "");
  assert.equal(r.kind, "audio");
  assert.equal(r.channel_type, "whatsapp");
  assert.equal(r.area, "civil");
  assert.equal(r.rubro_id, JURIDICO, "vinculado al perfil");
  assert.equal(r.conversation_id, conversationId, "vinculado a la conversación");
  assert.ok(r.contact_id, "vinculado a la ficha");
  assert.equal(r.size_bytes, a.bytes.byteLength);
  assert.equal(r.sha256, createHash("sha256").update(a.bytes).digest("hex"));
  assert.equal(r.sha256_matches, true);
  assert.equal(r.storage_bucket, "adjuntos-originales");
  assert.match(r.storage_path, /^civil\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.ogg$/);
  assert.ok(!r.storage_path.includes(phone), "la ruta no lleva el teléfono");
  assert.ok(new Date(r.expires_at).getTime() - new Date(r.received_at).getTime() === 7 * 24 * 3600 * 1000);

  const guardado = red.storage.get(`adjuntos-originales/${r.storage_path}`);
  assert.ok(guardado, "el archivo está en el bucket privado");
  assert.deepEqual(Buffer.from(guardado!.bytes), Buffer.from(a.bytes), "el original, byte por byte");
  assert.equal(guardado!.contentType, "audio/ogg");

  // Sin transcripción, respuestas ni envíos.
  assert.equal(red.envios.length, 0, "no se envió nada a nadie");
  const { data: salientes } = await db().from("messages").select("id").eq("conversation_id", conversationId).eq("direction", "saliente");
  assert.deepEqual(salientes, []);

  // Acceso desde la conversación: enlace firmado de corta duración, se abre en el navegador.
  const res = await abrirDeMensaje(new Request(`http://local/api/adjuntos/mensaje/${messageId}`), { params: { messageId } });
  assert.equal(res.status, 302);
  const location = res.headers.get("location")!;
  assert.match(location, /\/storage\/v1\/object\/sign\/adjuntos-originales\/civil\//);
  assert.match(location, /token=/);
  assert.doesNotMatch(location, /download=/, "un audio se escucha en el navegador");
  assert.equal(res.headers.get("cache-control"), "no-store");

  // La misma entrega repetida por Meta no duplica nada ni vuelve a descargar.
  const descargas = red.descargas.length;
  const otra = await processWhatsAppPayload(payload);
  assert.equal(otra.duplicados, 1);
  assert.equal((await adjuntosDe(externalId)).rows.length, 1);
  assert.equal(red.descargas.length, descargas);
});

test("adjuntos: un documento se descarga con su nombre original y nunca se abre como página", async () => {
  const phone = telefonoFicticio();
  const docx = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const d = medio(docx, 4096);
  red.medios.set(d.mediaId, { bytes: d.bytes, mime: docx });
  const payload = webhook(phone, { type: "document", document: { id: d.mediaId, mime_type: docx, filename: "Constancia de prueba.docx" } });
  await processWhatsAppPayload(payload);
  const { rows } = await adjuntosDe((payload.entry[0].changes[0].value.messages[0] as any).id);
  assert.equal(rows[0].status, "guardado");
  assert.match(rows[0].storage_path, /\.docx$/);
  const open = await openAttachment(rows[0].id);
  assert.equal(open.ok, true);
  assert.match((open as any).url, /download=Constancia%20de%20prueba\.docx/);

  // Un documento HTML se guarda como binario y solo se descarga (nunca se abre como página).
  const h = medio("text/html", 100);
  red.medios.set(h.mediaId, { bytes: h.bytes, mime: "text/html" });
  const p2 = webhook(phone, { type: "document", document: { id: h.mediaId, mime_type: "text/html", filename: "pagina.html" } });
  await processWhatsAppPayload(p2);
  const r2 = (await adjuntosDe((p2.entry[0].changes[0].value.messages[0] as any).id)).rows[0];
  assert.equal(r2.status, "guardado");
  assert.equal(red.storage.get(`adjuntos-originales/${r2.storage_path}`)!.contentType, "application/octet-stream");
  const open2 = await openAttachment(r2.id);
  assert.match((open2 as any).url, /download=pagina\.html/);

  // Si Meta devuelve una página de error en lugar de la foto, no se guarda como original.
  const f = medio("image/jpeg", 100);
  red.medios.set(f.mediaId, { bytes: f.bytes, mime: "image/jpeg", descarga: { status: 200, contentType: "text/html; charset=utf-8", body: "<html>Sorry</html>" } });
  const p3 = webhook(phone, { type: "image", image: { id: f.mediaId, mime_type: "image/jpeg" } });
  await processWhatsAppPayload(p3);
  const r3 = (await adjuntosDe((p3.entry[0].changes[0].value.messages[0] as any).id)).rows[0];
  assert.equal(r3.status, "error");
  assert.match(r3.last_error, /página en lugar del archivo/);
});

test("adjuntos: si Meta falla, el mensaje igual queda guardado y el original se guarda después ('Guardar ahora')", async () => {
  const phone = telefonoFicticio();
  const img = medio("image/jpeg");
  red.medios.set(img.mediaId, { bytes: img.bytes, mime: img.mime, errorInfo: { status: 500, body: { error: { code: 1, message: "An unknown error occurred" } } } });
  const payload = webhook(phone, { type: "image", image: { id: img.mediaId, mime_type: "image/jpeg", caption: "foto del recibo" } });
  const resumen = await processWhatsAppPayload(payload);
  assert.equal(resumen.mensajes, 1, "el mensaje se guardó igual");
  const { rows } = await adjuntosDe((payload.entry[0].changes[0].value.messages[0] as any).id);
  assert.equal(rows[0].status, "error");
  assert.match(rows[0].last_error, /Meta respondió 500/);
  assert.equal(rows[0].attempts, 1);

  // Meta se recupera: "Guardar ahora" desde la ficha o Revisión.
  red.medios.set(img.mediaId, { bytes: img.bytes, mime: img.mime });
  const res = await guardarAhora(new Request("http://local", { method: "POST" }), { params: { id: rows[0].id } });
  const body = await res.json();
  assert.equal(res.status, 200, JSON.stringify(body));
  assert.equal(body.estado, "guardado");
  const despues = await db().from("message_attachments").select("status, attempts, last_error").eq("id", rows[0].id).single();
  assert.deepEqual([despues.data!.status, despues.data!.attempts, despues.data!.last_error], ["guardado", 2, null]);
});

test("adjuntos: lo pesado se guarda a pedido; lo que supera el tope queda registrado sin guardar", async () => {
  const phone = telefonoFicticio();
  const v = medio("video/mp4");
  red.medios.set(v.mediaId, { bytes: v.bytes, mime: v.mime, fileSize: 17 * 1024 * 1024 });
  const p = webhook(phone, { type: "video", video: { id: v.mediaId, mime_type: "video/mp4" } });
  await processWhatsAppPayload(p);
  const r = (await adjuntosDe((p.entry[0].changes[0].value.messages[0] as any).id)).rows[0];
  assert.equal(r.status, "pendiente", "no es un error: se guarda al abrirlo");
  assert.match(r.last_error, /17,0 MB/);
  const res = await abrirAdjunto(new Request(`http://local/api/adjuntos/${r.id}`), { params: { id: r.id } });
  assert.equal(res.status, 302, await res.clone().text());
  assert.equal((await db().from("message_attachments").select("status").eq("id", r.id).single()).data!.status, "guardado");

  const g = medio("application/pdf");
  red.medios.set(g.mediaId, { bytes: g.bytes, mime: g.mime, fileSize: 60 * 1024 * 1024 });
  const p2 = webhook(phone, { type: "document", document: { id: g.mediaId, mime_type: "application/pdf", filename: "grande.pdf" } });
  await processWhatsAppPayload(p2);
  const r2 = (await adjuntosDe((p2.entry[0].changes[0].value.messages[0] as any).id)).rows[0];
  assert.equal(r2.status, "demasiado_grande");
  const res2 = await abrirAdjunto(new Request(`http://local/api/adjuntos/${r2.id}`), { params: { id: r2.id } });
  assert.equal(res2.status, 413);
  assert.match(await res2.text(), /50 MB/);
});

test("adjuntos: pasados los 7 días de Meta queda 'vencido' (se conserva el registro)", async () => {
  const phone = telefonoFicticio();
  const a = medio("audio/ogg");
  red.medios.set(a.mediaId, { bytes: a.bytes, mime: a.mime, errorInfo: { status: 503, body: { error: { code: 2, message: "Service temporarily unavailable" } } } });
  const p = webhook(phone, { type: "audio", audio: { id: a.mediaId, mime_type: "audio/ogg" } });
  await processWhatsAppPayload(p);
  const r = (await adjuntosDe((p.entry[0].changes[0].value.messages[0] as any).id)).rows[0];
  assert.equal(r.status, "error");
  sql(`update message_attachments set received_at = now() - interval '8 days', expires_at = now() - interval '1 day' where id = '${r.id}'`);
  const out = await saveAttachment(r.id);
  assert.equal(out.status, "vencido");
  const res = await abrirAdjunto(new Request(`http://local/api/adjuntos/${r.id}`), { params: { id: r.id } });
  assert.equal(res.status, 410);
  assert.match(await res.text(), /7 días/);
  const { count } = await db().from("message_attachments").select("id", { count: "exact", head: true }).eq("id", r.id);
  assert.equal(count, 1);
});

test("adjuntos: dos guardados a la vez descargan una sola vez", async () => {
  const phone = telefonoFicticio();
  const a = medio("image/png");
  red.medios.set(a.mediaId, { bytes: a.bytes, mime: a.mime, errorInfo: { status: 500, body: { error: { code: 1, message: "x" } } } });
  const p = webhook(phone, { type: "image", image: { id: a.mediaId, mime_type: "image/png" } });
  await processWhatsAppPayload(p);
  const r = (await adjuntosDe((p.entry[0].changes[0].value.messages[0] as any).id)).rows[0];
  red.medios.set(a.mediaId, { bytes: a.bytes, mime: a.mime, demoraMs: 300 });
  const antes = red.descargas.filter((x) => x === a.mediaId).length;
  const [x, y] = await Promise.all([saveAttachment(r.id), saveAttachment(r.id)]);
  assert.deepEqual([x.status, y.status].sort(), ["guardado", "ocupado"]);
  assert.equal(red.descargas.filter((d) => d === a.mediaId).length - antes, 1);
});

test("adjuntos: Instagram con dos fotos: dos originales, sin mandar el token de WhatsApp", async () => {
  const url1 = `https://cdn.pruebas.invalid/ig/${randomUUID()}.jpg`;
  const url2 = `https://cdn.pruebas.invalid/ig/${randomUUID()}.jpg`;
  red.cdn.set(url1, { bytes: new Uint8Array(randomBytes(500)), mime: "image/jpeg" });
  red.cdn.set(url2, { bytes: new Uint8Array(randomBytes(700)), mime: "image/jpeg" });
  const externalId = `mid.PRUEBA.${randomUUID()}`;
  await handleInboundMessage({
    area: "civil",
    channelType: "instagram",
    externalUserId: `igsid-${randomUUID()}`,
    body: "[Adjunto: image, image]",
    externalMessageId: externalId,
    messageType: "image",
    metadata: { attachments: [{ type: "image", payload: { url: url1 } }, { type: "image", payload: { url: url2 } }] },
    aiReadable: false,
  });
  const { rows, messageId } = await adjuntosDe(externalId);
  assert.deepEqual(rows.map((r) => [r.position, r.kind, r.status, r.channel_type]), [
    [0, "imagen", "guardado", "instagram"],
    [1, "imagen", "guardado", "instagram"],
  ]);
  const res = await abrirDeMensaje(new Request(`http://local/api/adjuntos/mensaje/${messageId}?n=1`), { params: { messageId } });
  assert.equal(res.status, 302);
  assert.ok(res.headers.get("location")!.includes(rows[1].storage_path));
});

test("adjuntos: un mensaje anterior a este guardado se registra y se guarda al abrirlo", async () => {
  const a = medio("image/jpeg");
  red.medios.set(a.mediaId, { bytes: a.bytes, mime: a.mime });
  // Mensaje guardado como antes de la migración 0117 (sin registro de adjunto).
  const s = db();
  const contact = await crearContacto({ area: "civil" });
  const { data: ch } = await s.from("channels").select("id").eq("area", "civil").eq("type", "whatsapp").single();
  const { data: conv } = await s.from("conversations").insert({ contact_id: contact!.id, channel_id: ch!.id, area: "civil" }).select("id").single();
  const { data: msg } = await s
    .from("messages")
    .insert({
      conversation_id: conv!.id,
      sender_type: "prospecto",
      direction: "entrante",
      body: "[Imagen]",
      message_type: "image",
      external_message_id: `wamid.VIEJO.${randomUUID()}`,
      metadata: { provider_type: "image", media_id: a.mediaId, mime_type: "image/jpeg" },
    })
    .select("id")
    .single();
  const res = await abrirDeMensaje(new Request(`http://local/api/adjuntos/mensaje/${msg!.id}`), { params: { messageId: msg!.id } });
  assert.equal(res.status, 302, await res.clone().text());
  const { data: rows } = await s.from("message_attachments").select("status, kind").eq("message_id", msg!.id);
  assert.deepEqual(rows, [{ status: "guardado", kind: "imagen" }]);

  // Un mensaje de texto no tiene archivo para abrir.
  const { data: texto } = await s
    .from("messages")
    .insert({ conversation_id: conv!.id, sender_type: "prospecto", direction: "entrante", body: "hola", message_type: "text" })
    .select("id")
    .single();
  const res2 = await abrirDeMensaje(new Request(`http://local/api/adjuntos/mensaje/${texto!.id}`), { params: { messageId: texto!.id } });
  assert.equal(res2.status, 404);
});

test("adjuntos: los registros no se borran", async () => {
  const { data } = await db().from("message_attachments").select("id").limit(1).single();
  const del = await db().from("message_attachments").delete().eq("id", data!.id);
  assert.ok(del.error, "la base rechaza el borrado");
  assert.match(del.error!.message, /no se borran|permission denied/);
});
