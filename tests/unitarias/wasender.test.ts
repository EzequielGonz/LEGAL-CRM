import { test } from "node:test";
import assert from "node:assert/strict";
import { cifrar, descifrar, claveCifradoLista } from "@/lib/wasender/cifrado";
import {
  EVENTOS_WEBHOOK,
  WasenderError,
  actualizarWebhook,
  WASENDER_API,
  conectarLinea,
  crearLinea,
  cuerpoCrearLinea,
  cuerpoMensaje,
  enviarMensaje,
  normalizarEstado,
  numeroInternacional,
} from "@/lib/wasender/cliente";
import { esChatIgnorado, estadoComoMeta, estadoDeWasender, firmaValida, telefonoDeClave, traducirEvento } from "@/lib/wasender/eventos";
import { decidirSalida } from "@/lib/wasender/proveedor";
import { LineaWasenderNoDisponible, enviarPorWasender, motivoNoDisponible, wasenderHabilitado } from "@/lib/wasender/envio";
import { antesDeProcesar, cambiosDevolver, cambiosTomar, despuesDeProcesar, tomadoPorModoPrueba } from "@/lib/wasender/prueba";

// Datos ficticios: ningún número, clave ni secreto real.
const ENV = { WASENDER_CLAVE_CIFRADO: "frase-larga-de-prueba-que-no-es-real", WASENDER_PAT: "pat-ficticio", WASENDER_HABILITADO: "true" };
const TEL = "5491100000000";

function falso(status: number, cuerpo: unknown) {
  const llamadas: { url: string; metodo: string; auth: string; cuerpo: any }[] = [];
  const fetchImpl = async (url: string, init: { method: string; headers: Record<string, string>; body?: string }) => {
    llamadas.push({ url, metodo: init.method, auth: init.headers.Authorization, cuerpo: init.body ? JSON.parse(init.body) : undefined });
    return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(cuerpo) };
  };
  return { fetchImpl, llamadas };
}

// ---------------------------------------------------------------- cifrado

test("wasender: la clave de la línea se cifra y se recupera; alterada o con otra clave no se lee", () => {
  const c = cifrar("clave-de-linea-ficticia", ENV);
  assert.match(c, /^v1\./);
  assert.ok(!c.includes("clave-de-linea-ficticia"));
  assert.equal(descifrar(c, ENV), "clave-de-linea-ficticia");
  assert.equal(descifrar(c.slice(0, -2) + "xx", ENV), null);
  assert.equal(descifrar(c, { WASENDER_CLAVE_CIFRADO: "otra-frase-larga-de-prueba-distinta" }), null);
  assert.equal(descifrar("cualquier cosa", ENV), null);
  assert.equal(descifrar(null, ENV), null);
});

test("wasender: sin clave de cifrado configurada no se guarda nada", () => {
  assert.equal(claveCifradoLista({}), false);
  assert.equal(claveCifradoLista({ WASENDER_CLAVE_CIFRADO: "corta" }), false);
  assert.equal(claveCifradoLista(ENV), true);
  assert.throws(() => cifrar("x", {}), /WASENDER_CLAVE_CIFRADO/);
});

// ---------------------------------------------------------------- firma

test("wasender: el webhook solo se acepta con el secreto de la línea", () => {
  assert.equal(firmaValida("secreto-ficticio", "secreto-ficticio"), true);
  assert.equal(firmaValida(" secreto-ficticio ", "secreto-ficticio"), true);
  assert.equal(firmaValida("otro", "secreto-ficticio"), false);
  assert.equal(firmaValida(null, "secreto-ficticio"), false);
  assert.equal(firmaValida("secreto-ficticio", null), false);
  assert.equal(firmaValida("", ""), false);
});

// ---------------------------------------------------------------- cliente

test("wasender: la línea se crea con protección de cuenta, sin guardar mensajes ni grupos", () => {
  const c = cuerpoCrearLinea({ nombre: "Línea de prueba", telefono: "+54 9 11 0000-0000", webhookUrl: "https://ejemplo.invalid/api/webhooks/wasender?linea=x" });
  assert.equal(c.account_protection, true);
  assert.equal(c.log_messages, false);
  assert.equal(c.read_incoming_messages, false);
  assert.equal(c.ignore_groups, true);
  assert.equal(c.ignore_channels, true);
  assert.equal(c.ignore_broadcasts, true);
  assert.equal(c.webhook_enabled, true);
  assert.equal(c.phone_number, "+5491100000000");
  assert.deepEqual(c.webhook_events, [...EVENTOS_WEBHOOK]);
});

test("wasender: crear y conectar usan el token de la cuenta y devuelven clave, secreto y QR", async () => {
  const f = falso(200, { success: true, data: { id: 123, status: "disconnected", api_key: "clave-ficticia", webhook_secret: "secreto-ficticio" } });
  const r = await crearLinea({ nombre: "L", telefono: TEL, webhookUrl: "https://ejemplo.invalid/w" }, { fetchImpl: f.fetchImpl, env: ENV });
  assert.deepEqual(r, { sesionId: "123", estado: "disconnected", apiKey: "clave-ficticia", webhookSecret: "secreto-ficticio" });
  assert.equal(f.llamadas[0].url, `${WASENDER_API}/whatsapp-sessions`);
  assert.equal(f.llamadas[0].auth, "Bearer pat-ficticio");

  const q = falso(200, { success: true, data: { status: "NEED_SCAN", qrCode: "2@qr-ficticio" } });
  const c = await conectarLinea("123", { fetchImpl: q.fetchImpl, env: ENV });
  assert.deepEqual(c, { estado: "need_scan", qr: "2@qr-ficticio" });
  assert.equal(q.llamadas[0].url, `${WASENDER_API}/whatsapp-sessions/123/connect`);
  assert.deepEqual(q.llamadas[0].cuerpo, { linkMethod: "qr" });

  await assert.rejects(() => crearLinea({ nombre: "L", telefono: TEL, webhookUrl: "x" }, { fetchImpl: f.fetchImpl, env: {} }), /WASENDER_PAT/);
});

test("wasender: el mensaje sale con la clave de la línea; texto, foto y documento", async () => {
  assert.deepEqual(cuerpoMensaje({ to: TEL, body: "Hola" }), { to: `+${TEL}`, text: "Hola" });
  assert.deepEqual(cuerpoMensaje({ to: TEL, body: "", media: { kind: "image", link: "https://ejemplo.invalid/f.jpg" } }), { to: `+${TEL}`, imageUrl: "https://ejemplo.invalid/f.jpg" });
  assert.deepEqual(cuerpoMensaje({ to: TEL, body: "Te paso el PDF", media: { kind: "document", link: "https://ejemplo.invalid/a.pdf", filename: "a.pdf" } }), {
    to: `+${TEL}`,
    text: "Te paso el PDF",
    documentUrl: "https://ejemplo.invalid/a.pdf",
    fileName: "a.pdf",
  });

  const f = falso(200, { success: true, data: { msgId: 100000, jid: `+${TEL}`, status: "in_progress" } });
  const r = await enviarMensaje("clave-ficticia", { to: `+${TEL}`, text: "Hola" }, { fetchImpl: f.fetchImpl });
  assert.deepEqual(r, { msgId: "100000", estado: "in_progress" });
  assert.equal(f.llamadas[0].url, `${WASENDER_API}/send-message`);
  assert.equal(f.llamadas[0].auth, "Bearer clave-ficticia");
});

test("wasender: un error de Wasender no se confunde con un envío; si pide esperar poco, reintenta una vez", async () => {
  const mal = falso(422, { success: false, message: "Validation failed", errors: { to: ["The to field is required."] } });
  await assert.rejects(() => enviarMensaje("k", { to: `+${TEL}`, text: "x" }, { fetchImpl: mal.fetchImpl }), (e: any) => e instanceof WasenderError && e.status === 422 && /to field/.test(e.message));

  let vez = 0;
  const esperas: number[] = [];
  const fetchImpl = async () => {
    vez++;
    return vez === 1
      ? { ok: false, status: 429, text: async () => JSON.stringify({ success: false, message: "Too many", retry_after: 5 }) }
      : { ok: true, status: 200, text: async () => JSON.stringify({ success: true, data: { msgId: 7 } }) };
  };
  const r = await enviarMensaje("k", { to: `+${TEL}`, text: "x" }, { fetchImpl, esperar: async (ms) => void esperas.push(ms) });
  assert.equal(r.msgId, "7");
  assert.deepEqual(esperas, [5000]);

  const lento = async () => ({ ok: false, status: 429, text: async () => JSON.stringify({ success: false, retry_after: 60 }) });
  await assert.rejects(() => enviarMensaje("k", { to: `+${TEL}`, text: "x" }, { fetchImpl: lento, esperar: async () => {} }), (e: any) => e.status === 429);
});

test("wasender: número y estado normalizados", () => {
  assert.equal(numeroInternacional("+54 9 11 0000-0000"), "+5491100000000");
  assert.equal(numeroInternacional(""), "");
  assert.equal(normalizarEstado("NEED_SCAN"), "need_scan");
  assert.equal(normalizarEstado(undefined), "desconocido");
});

// ---------------------------------------------------------------- eventos

test("wasender: un mensaje de texto entra con el número, el nombre y la marca de Wasender, sin id de Meta", () => {
  const [e] = traducirEvento({
    event: "messages.received",
    sessionId: "s",
    data: { messages: { key: { id: "ABC1", fromMe: false, remoteJid: `${TEL}@s.whatsapp.net` }, pushName: "Persona de prueba", messageTimestamp: 1794316709, message: { conversation: "Hola, quiero consultar" } } },
  });
  assert.equal(e.tipo, "mensaje");
  if (e.tipo !== "mensaje") return;
  assert.equal(e.claveId, "ABC1");
  assert.equal(e.deMi, false);
  assert.equal(e.telefono, TEL);
  assert.equal(e.nombre, "Persona de prueba");
  assert.equal(e.cuerpo, "Hola, quiero consultar");
  assert.equal(e.legible, true);
  assert.equal(e.metadata.proveedor, "wasender");
  assert.equal("media_id" in e.metadata, false);
});

test("wasender: un contacto con identificador interno («@lid») se ubica por su número", () => {
  assert.equal(telefonoDeClave({ remoteJid: "123456789012345@lid", senderPn: `${TEL}@s.whatsapp.net` }), TEL);
  assert.equal(telefonoDeClave({ remoteJid: "123456789012345@lid", cleanedSenderPn: TEL }), TEL);
  assert.equal(telefonoDeClave({ remoteJid: "123456789012345@lid" }), null);
  const [e] = traducirEvento({ event: "messages.upsert", data: { messages: [{ key: { id: "L1", fromMe: false, remoteJid: "999@lid", senderPn: `${TEL}@s.whatsapp.net` }, message: { extendedTextMessage: { text: "hola" } } }] } });
  assert.equal(e.tipo === "mensaje" && e.telefono, TEL);
});

test("wasender: grupos, difusiones y mensajes técnicos se ignoran", () => {
  assert.equal(esChatIgnorado("120363000000000000@g.us"), true);
  assert.equal(esChatIgnorado("status@broadcast"), true);
  assert.equal(esChatIgnorado(`${TEL}@s.whatsapp.net`), false);
  const [g] = traducirEvento({ event: "messages.upsert", data: { messages: [{ key: { id: "G", remoteJid: "1203@g.us" }, message: { conversation: "x" } }] } });
  assert.equal(g.tipo, "ignorado");
  const [t] = traducirEvento({ event: "messages.upsert", data: { messages: [{ key: { id: "T", remoteJid: `${TEL}@s.whatsapp.net` }, message: { protocolMessage: { type: 0 } } }] } });
  assert.equal(t.tipo, "ignorado");
});

test("wasender: foto, audio y documento entran como adjuntos que el bot no lee", () => {
  const [f] = traducirEvento({
    event: "messages.received",
    data: { messages: { key: { id: "F", remoteJid: `${TEL}@s.whatsapp.net` }, message: { imageMessage: { url: "https://ejemplo.invalid/e", mimetype: "image/jpeg", mediaKey: "k", caption: "el choque" } } } },
  });
  assert.equal(f.tipo, "mensaje");
  if (f.tipo !== "mensaje") return;
  assert.equal(f.cuerpo, "[Imagen] el choque");
  assert.equal(f.tipoMensaje, "image");
  assert.equal(f.legible, false);
  assert.equal(f.archivo?.campo, "imageMessage");
  assert.equal(f.archivo?.mimeType, "image/jpeg");

  const [a] = traducirEvento({ event: "messages.received", data: { messages: { key: { id: "A", remoteJid: `${TEL}@s.whatsapp.net` }, message: { audioMessage: { mimetype: "audio/ogg", ptt: true } } } } });
  assert.equal(a.tipo === "mensaje" && a.cuerpo, "[Audio]");

  const [d] = traducirEvento({
    event: "messages.received",
    data: { messages: { key: { id: "D", remoteJid: `${TEL}@s.whatsapp.net` }, message: { documentWithCaptionMessage: { message: { documentMessage: { fileName: "alta.pdf", mimetype: "application/pdf" } } } } } },
  });
  assert.equal(d.tipo === "mensaje" && d.cuerpo, "[Documento] alta.pdf");
});

test("wasender: un mensaje propio (desde el celular o eco del panel) se marca como propio", () => {
  const [e] = traducirEvento({ event: "messages.upsert", data: { messages: [{ key: { id: "M", fromMe: true, remoteJid: `${TEL}@s.whatsapp.net` }, message: { conversation: "Te llamo en un rato" } }] } });
  assert.equal(e.tipo === "mensaje" && e.deMi, true);
  const [s] = traducirEvento({ event: "message.sent", data: { key: { id: "M", fromMe: true, remoteJid: `${TEL}@s.whatsapp.net` }, message: { conversation: "Hola" }, success: true } });
  assert.deepEqual(s, { tipo: "enviado", claveId: "M", telefono: TEL, cuerpo: "Hola", ok: true });
});

test("wasender: estados de entrega equivalentes a los de Meta, sin retroceder por «pendiente»", () => {
  assert.equal(estadoDeWasender(0), "fallido");
  assert.equal(estadoDeWasender(1), null);
  assert.equal(estadoDeWasender(2), "enviado");
  assert.equal(estadoDeWasender(3), "entregado");
  assert.equal(estadoDeWasender("4"), "leido");
  assert.equal(estadoDeWasender(5), "leido");
  assert.equal(estadoComoMeta("entregado"), "delivered");
  const [u] = traducirEvento({ event: "messages.update", sessionId: "s", data: { update: { status: 3 }, key: { id: "X", fromMe: true, remoteJid: `${TEL}@s.whatsapp.net` } }, timestamp: 1 });
  assert.deepEqual(u, { tipo: "estado", claveId: "X", estado: "entregado", deMi: true, telefono: TEL });
  const [p] = traducirEvento({ event: "messages.update", data: { update: { status: 1 }, key: { id: "X" } } });
  assert.equal(p.tipo, "ignorado");
});

test("wasender: estado de la línea, QR y eventos desconocidos", () => {
  assert.deepEqual(traducirEvento({ event: "session.status", data: { status: "CONNECTED" } }), [{ tipo: "sesion", estado: "connected" }]);
  assert.deepEqual(traducirEvento({ event: "qrcode.updated", data: { qr: "2@qr" } }), [{ tipo: "qr", qr: "2@qr" }]);
  assert.equal(traducirEvento({ event: "call.received", data: {} })[0].tipo, "ignorado");
  assert.equal(traducirEvento(null)[0].tipo, "ignorado");
});

// ---------------------------------------------------------------- por dónde sale

test("wasender: se responde por la línea por la que escribió la persona", () => {
  const w = { direction: "entrante", metadata: { proveedor: "wasender", wasender_line_id: "linea-w" } };
  const m = { direction: "entrante", metadata: { phone_number_id: "123" } };
  const sw = { direction: "saliente", metadata: { proveedor: "wasender", wasender_line_id: "linea-w" } };
  assert.deepEqual(decidirSalida(w, null), { proveedor: "wasender", lineaId: "linea-w" });
  // Si la persona escribió por Meta, sale por Meta aunque antes se le haya escrito por Wasender.
  assert.deepEqual(decidirSalida(m, sw), { proveedor: "meta" });
  // Sin mensajes de la persona: si la empezó Wasender, sigue por Wasender.
  assert.deepEqual(decidirSalida(null, sw), { proveedor: "wasender", lineaId: "linea-w" });
  assert.deepEqual(decidirSalida(null, null), { proveedor: "meta" });
  assert.deepEqual(decidirSalida({ direction: "entrante", metadata: { proveedor: "wasender" } }, null), { proveedor: "meta" });
  assert.deepEqual(decidirSalida({ direction: "entrante", metadata: null }, null), { proveedor: "meta" });
});

test("wasender: una línea apagada, desconectada o sin clave no envía, y nunca pasa a otra", async () => {
  const linea = { id: "l", nombre: "Prueba", habilitada: true, estado: "connected", api_key_cifrada: "v1.x.y.z", archivada_at: null };
  assert.equal(motivoNoDisponible(linea, ENV), null);
  assert.match(motivoNoDisponible(linea, {})!, /apagado en este entorno/);
  assert.match(motivoNoDisponible({ ...linea, habilitada: false }, ENV)!, /apagada/);
  assert.match(motivoNoDisponible({ ...linea, estado: "need_scan" }, ENV)!, /no está conectada/);
  assert.match(motivoNoDisponible({ ...linea, archivada_at: "2026-11-10T00:00:00Z" }, ENV)!, /archivada/);
  assert.match(motivoNoDisponible({ ...linea, api_key_cifrada: null }, ENV)!, /clave/);
  assert.match(motivoNoDisponible(null, ENV)!, /no existe/);
  assert.equal(wasenderHabilitado({ WASENDER_HABILITADO: "true" }), true);
  assert.equal(wasenderHabilitado({ WASENDER_HABILITADO: "1" }), false);
  await assert.rejects(() => enviarPorWasender({ lineaId: "l", to: TEL, body: "x" }, { env: {} }), (e: any) => e instanceof LineaWasenderNoDisponible);
});

test("wasender: envío completo con la línea conectada, guardando la marca para el eco y el bot", async () => {
  const fila = { id: "l", nombre: "Prueba", habilitada: true, estado: "connected", api_key_cifrada: cifrar("clave-ficticia", ENV), archivada_at: null };
  const supabase: any = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: fila, error: null }) }) }) }) };
  const f = falso(200, { success: true, data: { msgId: 55, status: "in_progress" } });
  const r = await enviarPorWasender({ lineaId: "l", to: TEL, body: "Hola", plantilla: "bienvenida" }, { env: ENV, supabase, fetchImpl: f.fetchImpl });
  assert.equal(r.externalId, "wasender:55");
  assert.deepEqual(r.metadata, { proveedor: "wasender", wasender_line_id: "l", wasender_msg_id: "55", wasender_pendiente: true, plantilla: "bienvenida" });
  assert.equal(f.llamadas[0].auth, "Bearer clave-ficticia");
  assert.deepEqual(f.llamadas[0].cuerpo, { to: `+${TEL}`, text: "Hola" });
});

// ---------------------------------------------------------------- modo prueba

test("wasender: en modo prueba el chat queda en atención humana entre mensajes y se respeta la toma de una persona", () => {
  const auto = "2026-11-10T15:00:00.000Z";
  // Tomado por el modo prueba: al llegar un mensaje se devuelve a la IA.
  assert.equal(tomadoPorModoPrueba({ aiEnabled: false, humanTakeoverAt: auto, tomaAutomaticaAt: auto }), true);
  assert.equal(antesDeProcesar({ aiEnabled: false, humanTakeoverAt: auto, tomaAutomaticaAt: auto }, true), "devolver_a_ia");
  // Una persona lo tomó después: no se devuelve.
  assert.equal(antesDeProcesar({ aiEnabled: false, humanTakeoverAt: "2026-11-10T15:05:00.000Z", tomaAutomaticaAt: auto }, true), "nada");
  // Nunca lo tomó el modo prueba (lo tomó una persona): no se devuelve.
  assert.equal(antesDeProcesar({ aiEnabled: false, humanTakeoverAt: auto, tomaAutomaticaAt: null }, true), "nada");
  // Con la IA prendida no hay nada que devolver; fuera del modo prueba, tampoco.
  assert.equal(antesDeProcesar({ aiEnabled: true, humanTakeoverAt: null, tomaAutomaticaAt: auto }, true), "nada");
  assert.equal(antesDeProcesar({ aiEnabled: false, humanTakeoverAt: auto, tomaAutomaticaAt: auto }, false), "nada");
  assert.equal(despuesDeProcesar(true), "tomar");
  assert.equal(despuesDeProcesar(false), "nada");
  const t = cambiosTomar(new Date(auto));
  assert.equal(t.ai_enabled, false);
  assert.equal(t.status, "requiere_atencion_humana");
  assert.equal(t.human_takeover_at, auto);
  assert.equal(t.wasender_toma_automatica_at, auto);
  assert.deepEqual(cambiosDevolver(), { ai_enabled: true, status: "en_conversacion" });
});

// ---------------------------------------------------------------- etapa 2: líneas, QR y dirección del webhook

import { esNumeroDeMeta, etiquetaEstado, pideQr, puedeHabilitar, telefonoValido, ultimosDigitos } from "@/lib/wasender/reglas";
import { configuracionWasender, direccionWebhook, recibeEnEsteEntorno } from "@/lib/wasender/webhook-url";
import { qrComoImagen } from "@/lib/wasender/qr";

test("wasender: estados de la línea en palabras simples y cuándo mostrar el QR", () => {
  assert.equal(etiquetaEstado("connected").texto, "Conectada");
  assert.equal(etiquetaEstado("NEED_SCAN").tono, "aviso");
  assert.equal(etiquetaEstado("raro").texto, "Estado: raro");
  assert.equal(pideQr("need_scan"), true);
  assert.equal(pideQr("connected"), false);
  assert.equal(puedeHabilitar("connected"), true);
  assert.equal(puedeHabilitar("need_scan"), false);
});

test("wasender: número válido y nunca una línea que ya está en Meta", () => {
  assert.equal(telefonoValido("+54 9 11 0000-0000"), "+5491100000000");
  assert.equal(telefonoValido("123"), null);
  assert.equal(esNumeroDeMeta("+5491100000000", ["+54 9 11 0000-0000"]), true);
  assert.equal(esNumeroDeMeta("+5491100000000", ["011 0000-0000"]), true);
  assert.equal(esNumeroDeMeta("+5491100000000", ["+54 9 11 2222-3333", null, ""]), false);
  assert.equal(ultimosDigitos("+5491100001234"), "…1234");
});

test("wasender: en la Preview el webhook lleva la dirección fija de la rama y el acceso de Vercel; sin acceso, avisa qué falta", () => {
  const preview = { VERCEL_ENV: "preview", VERCEL_BRANCH_URL: "rama-ficticia.vercel.app", VERCEL_AUTOMATION_BYPASS_SECRET: "bypass-ficticio" };
  const d = direccionWebhook("linea-1", preview);
  assert.equal(d.url, "https://rama-ficticia.vercel.app/api/webhooks/wasender?linea=linea-1&x-vercel-protection-bypass=bypass-ficticio");
  const sin = direccionWebhook("linea-1", { VERCEL_ENV: "preview", VERCEL_BRANCH_URL: "rama-ficticia.vercel.app" });
  assert.equal(sin.url, null);
  assert.match(sin.falta.join(" "), /Protection Bypass/);
  const prod = direccionWebhook("linea-1", { VERCEL_ENV: "production", NEXT_PUBLIC_APP_URL: "https://panel-ficticio.vercel.app/" });
  assert.equal(prod.url, "https://panel-ficticio.vercel.app/api/webhooks/wasender?linea=linea-1");
});

test("wasender: se sabe si la línea le avisa a este entorno, sin mirar el bypass", () => {
  const prod = { VERCEL_ENV: "production", NEXT_PUBLIC_APP_URL: "https://panel-ficticio.vercel.app" };
  const dePreview = "https://rama-ficticia.vercel.app/api/webhooks/wasender?linea=linea-1&x-vercel-protection-bypass=bypass-ficticio";
  assert.equal(recibeEnEsteEntorno(dePreview, "linea-1", prod), false);
  assert.equal(recibeEnEsteEntorno("https://panel-ficticio.vercel.app/api/webhooks/wasender?linea=linea-1", "linea-1", prod), true);
  assert.equal(recibeEnEsteEntorno("https://panel-ficticio.vercel.app/api/webhooks/wasender?linea=otra", "linea-1", prod), false);
  const preview = { VERCEL_ENV: "preview", VERCEL_BRANCH_URL: "rama-ficticia.vercel.app", VERCEL_AUTOMATION_BYPASS_SECRET: "otro-bypass" };
  assert.equal(recibeEnEsteEntorno(dePreview, "linea-1", preview), true);
  assert.equal(recibeEnEsteEntorno(null, "linea-1", prod), null);
  assert.equal(recibeEnEsteEntorno("no es una dirección", "linea-1", prod), false);
});

test("wasender: cambiar a dónde avisa la línea usa el token de la cuenta y no toca la conexión", async () => {
  const f = falso(200, { success: true, data: {} });
  await actualizarWebhook("123", "https://panel-ficticio.vercel.app/api/webhooks/wasender?linea=linea-1", { fetchImpl: f.fetchImpl, env: ENV });
  assert.equal(f.llamadas.length, 1);
  assert.equal(f.llamadas[0].metodo, "PUT");
  assert.equal(f.llamadas[0].url, `${WASENDER_API}/whatsapp-sessions/123`);
  assert.equal(f.llamadas[0].auth, "Bearer pat-ficticio");
  assert.deepEqual(Object.keys(f.llamadas[0].cuerpo).sort(), ["webhook_enabled", "webhook_events", "webhook_url"]);
});

test("wasender: la pantalla dice qué falta configurar sin mostrar ningún valor", () => {
  const c = configuracionWasender({ VERCEL_ENV: "preview", WASENDER_PAT: "x" });
  assert.equal(c.lista, false);
  assert.deepEqual(c.items.filter((i) => !i.ok).map((i) => i.clave), ["WASENDER_CLAVE_CIFRADO", "VERCEL_AUTOMATION_BYPASS_SECRET", "WASENDER_HABILITADO"]);
  assert.ok(!JSON.stringify(c).includes('"x"'));
  assert.equal(configuracionWasender({ ...ENV, VERCEL_ENV: "preview", VERCEL_AUTOMATION_BYPASS_SECRET: "b" }).lista, true);
});

test("wasender: el QR se dibuja como imagen (no como HTML)", () => {
  const img = qrComoImagen("2@qr-ficticio-de-prueba,abc,def");
  assert.match(img, /^data:image\/gif;base64,[A-Za-z0-9+/=]+$/);
});

// ---------------------------------------------------------------- etapa 3: eco de los envíos y webhook

import { elegirEco, normalizar, VENTANA_ECO_MS } from "@/lib/wasender/eco";
import { procesarWebhook } from "@/lib/wasender/entrada";

const AHORA = new Date("2026-11-10T15:00:00.000Z");
const hace = (s: number) => new Date(AHORA.getTime() - s * 1000).toISOString();
const pend = (id: string, body: string | null, segs: number, extra: Record<string, unknown> = {}, tipo: string | null = null) => ({
  id,
  body,
  message_type: tipo,
  created_at: hace(segs),
  metadata: { wasender_pendiente: true, wasender_line_id: "linea-w", ...extra },
});

test("wasender: el eco de un envío del panel se empareja por texto, línea y hora; nunca se inventa", () => {
  const lista = [pend("a", "Hola, ¿cómo estás?", 20), pend("b", "Te paso la info", 10)];
  assert.equal(elegirEco(lista, { cuerpo: "te paso   la info", tipoMensaje: "text", esArchivo: false, lineaId: "linea-w" }, AHORA), "b");
  // Otro texto: es un mensaje escrito desde el celular, no un eco.
  assert.equal(elegirEco(lista, { cuerpo: "Otra cosa", tipoMensaje: "text", esArchivo: false, lineaId: "linea-w" }, AHORA), null);
  // Otra línea o ya confirmado: no se empareja.
  assert.equal(elegirEco(lista, { cuerpo: "Te paso la info", tipoMensaje: "text", esArchivo: false, lineaId: "otra" }, AHORA), null);
  assert.equal(elegirEco([pend("c", "Hola", 5, { wasender_pendiente: false })], { cuerpo: "Hola", tipoMensaje: "text", esArchivo: false, lineaId: "linea-w" }, AHORA), null);
  // Fuera de la ventana: no se empareja.
  assert.equal(elegirEco([pend("d", "Hola", VENTANA_ECO_MS / 1000 + 5)], { cuerpo: "Hola", tipoMensaje: "text", esArchivo: false, lineaId: "linea-w" }, AHORA), null);
  // Archivos: por tipo; sin texto legible, solo si hay un único envío pendiente.
  const conFoto = [pend("e", "[Foto] mirá", 8, {}, "image"), pend("f", "Hola", 6)];
  assert.equal(elegirEco(conFoto, { cuerpo: "[Imagen] mirá", tipoMensaje: "image", esArchivo: true, lineaId: "linea-w" }, AHORA), "e");
  assert.equal(elegirEco([pend("g", "Hola", 3)], { cuerpo: null, tipoMensaje: null, esArchivo: false, lineaId: "linea-w" }, AHORA), "g");
  assert.equal(elegirEco(conFoto, { cuerpo: null, tipoMensaje: null, esArchivo: false, lineaId: "linea-w" }, AHORA), null);
  assert.equal(normalizar("  Hola\n  MUNDO "), "hola mundo");
});

const LINEA_ID = "0f0e0d0c-0b0a-4908-8706-050403020100";

function baseFalsa(lineas: Record<string, any>) {
  const registro = { eventos: [] as any[], updates: [] as any[] };
  const from = (tabla: string) => {
    const filtros: Record<string, unknown> = {};
    const q: any = {
      select: () => q,
      eq: (c: string, v: unknown) => {
        filtros[c] = v;
        return q;
      },
      maybeSingle: async () => ({ data: tabla === "wasender_lineas" ? lineas[String(filtros.id)] ?? null : null, error: null }),
      insert: async (fila: any) => {
        if (tabla === "wasender_eventos") registro.eventos.push(fila);
        return { error: null };
      },
      update: (cambios: any) => ({
        eq: async (c: string, v: unknown) => {
          registro.updates.push({ tabla, cambios, [c]: v });
          return { error: null };
        },
      }),
    };
    return q;
  };
  return { supabase: { from } as any, registro };
}

test("wasender: el webhook sin la firma de la línea no procesa nada y queda retenido", async () => {
  const anterior = process.env.WASENDER_CLAVE_CIFRADO;
  process.env.WASENDER_CLAVE_CIFRADO = ENV.WASENDER_CLAVE_CIFRADO;
  try {
    const linea = { id: LINEA_ID, rubro_id: "r", area: "marketing", nombre: "Prueba", webhook_secret_cifrado: cifrar("secreto-ficticio", ENV), api_key_cifrada: null, habilitada: false, estado: "need_scan", archivada_at: null };
    const { supabase, registro } = baseFalsa({ [LINEA_ID]: linea });

    const desconocida = await procesarWebhook({ lineaId: "no-es-un-id", firma: "secreto-ficticio", payload: { event: "session.status", data: { status: "connected" } } }, { supabase });
    assert.deepEqual([desconocida.ok, desconocida.motivo], [false, "linea_desconocida"]);

    const mala = await procesarWebhook({ lineaId: LINEA_ID, firma: "otra", payload: { event: "messages.received", data: {} } }, { supabase });
    assert.deepEqual([mala.ok, mala.motivo], [false, "firma_invalida"]);
    assert.equal(registro.updates.length, 0);
    assert.deepEqual(registro.eventos.map((e) => e.resultado), ["retenido", "retenido"]);
    assert.ok(registro.eventos[1].payload, "lo retenido guarda el contenido para revisarlo");
  } finally {
    process.env.WASENDER_CLAVE_CIFRADO = anterior;
  }
});

test("wasender: con la firma correcta se guarda el estado de la línea; si se cae, queda apagada", async () => {
  const anterior = process.env.WASENDER_CLAVE_CIFRADO;
  process.env.WASENDER_CLAVE_CIFRADO = ENV.WASENDER_CLAVE_CIFRADO;
  try {
    const linea = { id: LINEA_ID, rubro_id: "r", area: "marketing", nombre: "Prueba", webhook_secret_cifrado: cifrar("secreto-ficticio", ENV), api_key_cifrada: null, habilitada: true, estado: "connected", archivada_at: null };
    const { supabase, registro } = baseFalsa({ [LINEA_ID]: linea });

    const ok = await procesarWebhook({ lineaId: LINEA_ID, firma: "secreto-ficticio", payload: { event: "session.status", data: { status: "CONNECTED" } } }, { supabase });
    assert.deepEqual(ok, { ok: true, resultados: ["sesion:connected"] });
    assert.equal(registro.updates[0].cambios.estado, "connected");
    assert.equal("habilitada" in registro.updates[0].cambios, false);

    await procesarWebhook({ lineaId: LINEA_ID, firma: "secreto-ficticio", payload: { event: "session.status", data: { status: "LOGGED_OUT" } } }, { supabase });
    assert.equal(registro.updates[1].cambios.habilitada, false);

    const qr = await procesarWebhook({ lineaId: LINEA_ID, firma: "secreto-ficticio", payload: { event: "qrcode.updated", data: { qr: "2@x" } } }, { supabase });
    assert.deepEqual(qr.resultados, ["qr"]);
    assert.equal(registro.eventos.at(-1).resultado, "ignorado");
    // Lo procesado no guarda el contenido completo.
    assert.equal(registro.eventos.every((e) => e.resultado === "retenido" || e.payload === null), true);
  } finally {
    process.env.WASENDER_CLAVE_CIFRADO = anterior;
  }
});

test("wasender: la pantalla dice si la clave de cifrado no llega o si es corta, sin mostrarla", () => {
  const corta = configuracionWasender({ VERCEL_ENV: "preview", WASENDER_CLAVE_CIFRADO: "corta-123" });
  const item = corta.items.find((i) => i.clave === "WASENDER_CLAVE_CIFRADO")!;
  assert.equal(item.ok, false);
  assert.match(item.detalle!, /tiene 9 caracteres y necesita al menos 16/);
  assert.ok(!JSON.stringify(corta).includes("corta-123"));
  const falta = configuracionWasender({ VERCEL_ENV: "preview" }).items.find((i) => i.clave === "WASENDER_CLAVE_CIFRADO")!;
  assert.match(falta.detalle!, /Preview/);
});

// ---------------------------------------------------------------- bloque 1: plantillas propias

import { completar, copiarDesdeMeta, elegirVariante, perfilPorNombreMeta, usoDesdeMeta, validarPlantilla, variablesDe } from "@/lib/wasender/plantillas";
import { seccionActiva, seccionesDePerfil } from "@/lib/menu";

test("wasender: las plantillas solo aceptan {{nombre}}, {{asesor}} y {{marca}}", () => {
  assert.deepEqual(variablesDe("Hola {{ Nombre }}, soy {{asesor}} de {{marca}}"), ["nombre", "asesor", "marca"]);
  assert.deepEqual(validarPlantilla({ nombre: "a", cuerpo: "Hola {{nombre}}", variantes: [] }), []);
  const p = validarPlantilla({ nombre: "", cuerpo: "Hola {{1}}", variantes: [" "] });
  assert.deepEqual(p.map((x) => x.campo), ["nombre", "cuerpo", "variante 1"]);
});

test("wasender: sin nombre de la persona no quedan comas ni espacios sueltos", () => {
  assert.equal(completar("Hola {{nombre}}, soy {{asesor}} de {{marca}}.", { nombre: "Laura", asesor: "Martín", marca: "Kocos" }), "Hola Laura, soy Martín de Kocos.");
  assert.equal(completar("Hola {{nombre}}, ¿cómo estás?", { nombre: null }), "Hola, ¿cómo estás?");
});

test("wasender: cada persona recibe siempre la misma variante y se reparten todas", () => {
  const vs = ["B", "C"];
  assert.equal(elegirVariante("A", vs, "contacto-1"), elegirVariante("A", vs, "contacto-1"));
  const vistas = new Set(Array.from({ length: 60 }, (_, i) => elegirVariante("A", vs, `c-${i}`)));
  assert.deepEqual([...vistas].sort(), ["A", "B", "C"]);
  assert.equal(elegirVariante("A", ["", " "], "x"), "A");
});

test("wasender: una plantilla de Meta se copia con variables con nombre y los botones como texto", () => {
  const c = copiarDesdeMeta("Hola {{1}}, te escribe {{2}} de {{3}}. ¿Seguís buscando auto?", ["contacto.nombre", "perfil.presentacion", "perfil.marca"], ["Sí, sigo buscando", "Ya compré", "No me escriban más"]);
  assert.equal(c.cuerpo, "Hola {{nombre}}, te escribe {{asesor}} de {{marca}}. ¿Seguís buscando auto?\n\nRespondé: «Sí, sigo buscando», «Ya compré» o «No me escriban más».");
  assert.deepEqual(c.sinTraducir, []);
  // Sin asignación: cada variable se deduce por el texto que la precede.
  assert.equal(copiarDesdeMeta("Hola {{1}}, soy {{2}} de {{3}}.", null).cuerpo, "Hola {{nombre}}, soy {{asesor}} de {{marca}}.");
  assert.equal(copiarDesdeMeta("Hola, soy {{1}}, de {{2}}. ¿Tienen un momento?", null).cuerpo, "Hola, soy {{asesor}}, de {{marca}}. ¿Tienen un momento?");
  assert.equal(copiarDesdeMeta("Hola {{1}}, te escribimos de {{2}} por tu consulta.", null).cuerpo, "Hola {{nombre}}, te escribimos de {{marca}} por tu consulta.");
  assert.equal(copiarDesdeMeta("Hola, {{1}}. Soy {{2}}, del equipo de {{3}}.", null).cuerpo, "Hola, {{nombre}}. Soy {{asesor}}, del equipo de {{marca}}.");
  const hora = copiarDesdeMeta("Hola {{1}}, quedamos hoy a las {{2}}.", null);
  assert.equal(hora.cuerpo, "Hola {{nombre}}, quedamos hoy a las [revisar 2].");
  assert.deepEqual(hora.sinTraducir, ["{{2}}"]);
  const raro = copiarDesdeMeta("Turno a las {{2}}", ["contacto.nombre", "cita.hora"]);
  assert.equal(raro.cuerpo, "Turno a las [revisar 2]");
  assert.deepEqual(raro.sinTraducir, ["{{2}}"]);
  assert.equal(perfilPorNombreMeta("autos_recupero_a"), "agencia_0km");
  assert.equal(perfilPorNombreMeta("form_recibido_cob"), "coberturas_medicas");
  assert.equal(perfilPorNombreMeta("kocos_apertura"), "marketing");
  assert.equal(perfilPorNombreMeta("jur_base_fria"), "juridico");
  assert.equal(perfilPorNombreMeta("hello_world"), null);
  assert.equal(usoDesdeMeta("seguimiento_3", "x"), "seguimiento");
  assert.equal(usoDesdeMeta(null, "autos_reagendar"), "seguimiento");
});

test("wasender: el menú tiene Líneas y Plantillas, y cada ruta marca su pestaña", () => {
  const s = seccionesDePerfil("marketing");
  const w = s.find((x) => x.clave === "wasender")!;
  assert.deepEqual(w.tabs.map((t) => t.label), ["Líneas", "Plantillas"]);
  assert.equal(seccionActiva(s, "/wasender/plantillas", "perfil=marketing")?.tab.label, "Plantillas");
  assert.equal(seccionActiva(s, "/wasender", "perfil=marketing")?.tab.label, "Líneas");
});

// ---------------------------------------------------------------- campañas (bloque 3)
import { clasificarFallaWasender, faltantesWasender, proveedorDe, textoDeCampana } from "@/lib/wasender/campanas";
import { LineaWasenderNoDisponible as NoDisponible } from "@/lib/wasender/envio";

const PERFIL_OK = { brand_name: "Marca ficticia", agent_presentation_name: "Asesor ficticio" };
const LINEA_OK = { id: "l1", rubro_id: "r1", nombre: "Chip 1", habilitada: true, estado: "connected", api_key_cifrada: "v1.x", archivada_at: null, limite_diario: null };
const PLANTILLA_OK = { id: "p1", rubro_id: "r1", nombre: "Saludo", cuerpo: "Hola {{nombre}}, soy {{asesor}} de {{marca}}.", variantes: ["Buenas {{nombre}}! Te escribe {{asesor}}."], activa: true, archivada_at: null };

test("wasender campañas: las existentes y las sin método son de Meta", () => {
  assert.equal(proveedorDe({}), "meta");
  assert.equal(proveedorDe({ proveedor: null }), "meta");
  assert.equal(proveedorDe({ proveedor: "meta" }), "meta");
  assert.equal(proveedorDe({ proveedor: "wasender" }), "wasender");
});

test("wasender campañas: lista para lanzar solo con línea conectada y prendida, y plantilla activa del perfil", () => {
  const base = { area: "civil" as any, rubroId: "r1", perfil: PERFIL_OK, linea: LINEA_OK, lineaAsignada: true, plantilla: PLANTILLA_OK, plantillaAsignada: true };
  assert.deepEqual(faltantesWasender(base, ENV), []);
  assert.match(faltantesWasender({ ...base, lineaAsignada: false, linea: null }, ENV).join(" "), /Línea de Wasender asignada/);
  assert.match(faltantesWasender({ ...base, linea: { ...LINEA_OK, habilitada: false } }, ENV).join(" "), /apagada/);
  assert.match(faltantesWasender({ ...base, linea: { ...LINEA_OK, estado: "need_scan" } }, ENV).join(" "), /no está conectada/);
  assert.match(faltantesWasender({ ...base, linea: { ...LINEA_OK, rubro_id: "otro" } }, ENV).join(" "), /otro perfil/);
  assert.match(faltantesWasender(base, { ...ENV, WASENDER_HABILITADO: "" }).join(" "), /apagado en este entorno/);
  assert.match(faltantesWasender({ ...base, plantilla: { ...PLANTILLA_OK, activa: false } }, ENV).join(" "), /inactiva/);
  assert.match(faltantesWasender({ ...base, plantilla: { ...PLANTILLA_OK, cuerpo: "Turno el [revisar 2]" } }, ENV).join(" "), /\[revisar\]/);
  assert.match(faltantesWasender({ ...base, perfil: { brand_name: "", agent_presentation_name: "A" } }, ENV).join(" "), /marca/);
  // Si la plantilla no usa {{marca}}, la marca del perfil no hace falta.
  assert.deepEqual(faltantesWasender({ ...base, perfil: { brand_name: "", agent_presentation_name: "A" }, plantilla: { ...PLANTILLA_OK, cuerpo: "Hola {{nombre}}", variantes: [] } }, ENV), []);
});

test("wasender campañas: cada persona recibe siempre la misma variante, con sus datos", () => {
  const datos = { nombre: "Persona", asesor: "Asesor ficticio", marca: "Marca ficticia" };
  const a = textoDeCampana(PLANTILLA_OK, datos, "contacto-1");
  assert.equal(textoDeCampana(PLANTILLA_OK, datos, "contacto-1"), a);
  assert.ok(!a.includes("{{"));
  const textos = new Set(Array.from({ length: 30 }, (_, i) => textoDeCampana(PLANTILLA_OK, datos, `c-${i}`)));
  assert.equal(textos.size, 2);
  assert.equal(textoDeCampana({ cuerpo: "Hola {{nombre}}, ¿cómo va?", variantes: [] }, { ...datos, nombre: "" }, "x"), "Hola, ¿cómo va?");
});

test("wasender campañas: los errores se tratan igual que con Meta", () => {
  assert.equal(clasificarFallaWasender(new NoDisponible("apagada")).kind, "cuenta");
  assert.equal(clasificarFallaWasender(new WasenderError("x", 429, 5000)).kind, "transitorio");
  assert.equal(clasificarFallaWasender(new WasenderError("x", 401)).kind, "cuenta");
  assert.equal(clasificarFallaWasender(new WasenderError("The phone number is not on WhatsApp", 422)).kind, "contacto");
  const caida = clasificarFallaWasender(new WasenderError("x", 502));
  assert.equal(caida.kind, "incierto");
  assert.equal(caida.certainNotSent, false);
  assert.equal(clasificarFallaWasender(new Error("timeout")).kind, "incierto");
});
