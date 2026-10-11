import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

process.env.SUPABASE_SERVICE_ROLE_KEY = "clave-de-prueba-local";
delete process.env.NEXT_PUBLIC_SUPABASE_URL; // sin base: la versión de sesión no se consulta

import { signSession, readSignedSession, validateSession, hmacBase64Url } from "@/lib/acceso/session";
import { isValidPinFormat, isWeakPin, hashPin, verifyPin, safeNextPath, clientIp } from "@/lib/acceso/pin";
import { verifyMetaSignature } from "@/lib/webhooks/security";
import { parseWhatsAppMessage, mapDeliveryStatus } from "@/lib/webhooks/whatsapp-parse";

test("sesión: firma y lectura", async () => {
  const token = await signSession({ v: 1, iat: 1700000000, sid: "abc" });
  assert.deepEqual(await readSignedSession(token), { v: 1, iat: 1700000000, sid: "abc" });
  assert.ok(await validateSession(token), "sin base disponible acepta la firma válida");
});

test("sesión: cookie alterada o con otra clave no vale", async () => {
  const token = await signSession({ v: 1, iat: 1700000000, sid: "abc" });
  const [body, sig] = token.split(".");
  const otroBody = Buffer.from(JSON.stringify({ v: 2, iat: 1700000000, sid: "abc" })).toString("base64url");
  assert.equal(await readSignedSession(`${otroBody}.${sig}`), null);
  assert.equal(await readSignedSession(`${body}.${sig.slice(0, -2)}xx`), null);
  assert.equal(await readSignedSession("basura"), null);
  assert.equal(await readSignedSession(undefined), null);
  process.env.SUPABASE_SERVICE_ROLE_KEY = "otra-clave";
  assert.equal(await readSignedSession(token), null);
  process.env.SUPABASE_SERVICE_ROLE_KEY = "clave-de-prueba-local";
});

test("PIN: formato de 6 números", () => {
  for (const ok of ["909013", "000001", "482915"]) assert.ok(isValidPinFormat(ok), ok);
  for (const no of ["12345", "1234567", "12a456", " 12345", "", null, 123456]) assert.ok(!isValidPinFormat(no as any), String(no));
});

test("PIN: rechaza los fáciles de adivinar", () => {
  for (const weak of ["000000", "111111", "123456", "654321", "890123", "121212", "123123"]) assert.ok(isWeakPin(weak), weak);
  for (const strong of ["909013", "482915", "730194"]) assert.ok(!isWeakPin(strong), strong);
});

test("PIN: hash y verificación (scrypt)", async () => {
  const h = await hashPin("482915");
  assert.match(h, /^scrypt\$16384\$8\$1\$/);
  assert.ok(await verifyPin("482915", h));
  assert.ok(!(await verifyPin("482916", h)));
  assert.notEqual(h, await hashPin("482915"), "sal distinta en cada hash");
});

test("redirección después de ingresar: solo rutas internas", () => {
  assert.equal(safeNextPath("/inbox/abc"), "/inbox/abc");
  for (const bad of ["https://otro.com", "//otro.com", "/api/x", "/login", null, 3]) assert.equal(safeNextPath(bad as any), "/inicio");
});

test("origen: primera IP de x-forwarded-for y hash estable", async () => {
  const req = new Request("https://x", { headers: { "x-forwarded-for": "200.1.2.3, 10.0.0.1" } });
  assert.equal(clientIp(req), "200.1.2.3");
  assert.equal(await hmacBase64Url("origen", "200.1.2.3"), await hmacBase64Url("origen", "200.1.2.3"));
  assert.notEqual(await hmacBase64Url("origen", "200.1.2.3"), await hmacBase64Url("origen", "200.1.2.4"));
});

test("webhook: firma de Meta", () => {
  process.env.META_APP_SECRET = "secreto-app";
  delete process.env.META_APP_SECRETS;
  const body = Buffer.from('{"entry":[]}');
  const good = "sha256=" + createHmac("sha256", "secreto-app").update(body).digest("hex");
  assert.equal(verifyMetaSignature(body, good), "ok");
  assert.equal(verifyMetaSignature(body, null), "ausente");
  assert.equal(verifyMetaSignature(Buffer.from('{"entry":[1]}'), good), "invalida");
  assert.equal(verifyMetaSignature(body, "sha256=xyz"), "invalida");
  process.env.META_APP_SECRETS = "otro-secreto";
  const other = "sha256=" + createHmac("sha256", "otro-secreto").update(body).digest("hex");
  assert.equal(verifyMetaSignature(body, other), "ok", "acepta secretos adicionales");
  delete process.env.META_APP_SECRET; delete process.env.META_APP_SECRETS;
  assert.equal(verifyMetaSignature(body, good), "sin_secreto");
});

test("WhatsApp: todos los tipos se guardan", () => {
  assert.deepEqual(
    (({ body, messageType, aiReadable }) => ({ body, messageType, aiReadable }))(parseWhatsAppMessage({ type: "text", text: { body: "hola" } })),
    { body: "hola", messageType: "text", aiReadable: true }
  );
  const btn = parseWhatsAppMessage({ type: "button", button: { text: "Mi caso ya está resuelto", payload: "x" } });
  assert.equal(btn.isButtonClick, true); assert.equal(btn.body, "Mi caso ya está resuelto");
  const audio = parseWhatsAppMessage({ type: "audio", audio: { id: "m1", mime_type: "audio/ogg" } });
  assert.equal(audio.body, "[Audio]"); assert.equal(audio.aiReadable, false); assert.equal(audio.metadata.media_id, "m1");
  const img = parseWhatsAppMessage({ type: "image", image: { id: "m2", caption: "mi recibo" } });
  assert.equal(img.body, "[Imagen] mi recibo");
  const doc = parseWhatsAppMessage({ type: "document", document: { id: "m3", filename: "alta.pdf" } });
  assert.equal(doc.body, "[Documento] alta.pdf");
  const loc = parseWhatsAppMessage({ type: "location", location: { latitude: -34.6, longitude: -58.4, name: "Casa" } });
  assert.match(loc.body, /^\[Ubicación\] Casa — -34.6, -58.4$/);
  const inter = parseWhatsAppMessage({ type: "interactive", interactive: { type: "button_reply", button_reply: { id: "b1", title: "Sí" } } });
  assert.equal(inter.body, "Sí"); assert.equal(inter.isButtonClick, true);
  const contacts = parseWhatsAppMessage({ type: "contacts", contacts: [{ name: { formatted_name: "Ana" }, phones: [{ phone: "+54 11 1234" }] }] });
  assert.equal(contacts.body, "[Contacto compartido] Ana (+54 11 1234)"); assert.equal(contacts.aiReadable, false);
  assert.equal(parseWhatsAppMessage({ type: "reaction", reaction: { emoji: "👍", message_id: "w" } }).body, "[Reacción 👍]");
  assert.equal(parseWhatsAppMessage({ type: "unsupported" }).body, "[Mensaje no compatible: unsupported]");
});

test("WhatsApp: estados de entrega", () => {
  assert.equal(mapDeliveryStatus("sent"), "enviado");
  assert.equal(mapDeliveryStatus("delivered"), "entregado");
  assert.equal(mapDeliveryStatus("read"), "leido");
  assert.equal(mapDeliveryStatus("failed"), "fallido");
  assert.equal(mapDeliveryStatus("deleted"), null);
});

import { buildShareText, findBarrio, optionalShareFields } from "@/lib/ficha";

test("ficha: texto compartido por defecto y extras elegidos (ver también ficha-barrio.test.ts)", () => {
  // El campo barrio tiene prioridad sobre la localidad, venga de la ficha o de la base.
  assert.equal(findBarrio({ Localidad: "Lanús" }, { BARRIO: "otro" }), "otro");
  assert.equal(findBarrio({ Localidad: "Lanús" }, { Zona: "otro" }), "Lanús");
  assert.equal(findBarrio({}, { "Barrio / Partido": "Quilmes" }), "Quilmes");
  assert.equal(findBarrio(null, null), null);
  const text = buildShareText({ fullName: "Ana Pérez", barrio: "Lanús", phone: "5491122223333", extras: [] });
  assert.equal(text, "Nombre y apellido: Ana Pérez\nBarrio: Lanús\nTeléfono: +5491122223333");
  const extras = optionalShareFields({ dni: "30111222", email: "", areaLabel: "Civil", qualificationData: { lesion: "Fractura", localidad: "x", raro: { a: 1 } } });
  assert.deepEqual(extras.map((e) => e.key), ["dni", "area", "q:lesion"]);
  const withExtra = buildShareText({ fullName: "Ana", barrio: null, phone: null, extras: [extras[2]] });
  assert.equal(withExtra, "Nombre y apellido: Ana\nBarrio: —\nTeléfono: —\nLesion: Fractura");
});
