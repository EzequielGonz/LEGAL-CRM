import { test } from "node:test";
import assert from "node:assert/strict";
import { cifrar, descifrar, claveCifradoLista } from "@/lib/wasender/cifrado";
import {
  EVENTOS_WEBHOOK,
  WasenderError,
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
import { configuracionWasender, direccionWebhook } from "@/lib/wasender/webhook-url";
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
