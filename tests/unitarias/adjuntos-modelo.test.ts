// Guardado privado de originales (alcance acotado de la pregunta 24):
// qué se guarda, dónde y cómo se abre. Sin transcripción, respuestas ni envíos.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  ATTACHMENT_MAX_BYTES,
  INLINE_MAX_BYTES,
  attachmentCandidates,
  downloadDeadline,
  downloadName,
  extensionFor,
  opensInline,
  sha256Matches,
  storageContentType,
  storagePathFor,
} from "@/lib/adjuntos/modelo";
import { parseWhatsAppMessage } from "@/lib/webhooks/whatsapp-parse";

test("adjuntos: un audio de WhatsApp se registra con su identificador de Meta", () => {
  const parsed = parseWhatsAppMessage({
    from: "5491100000000",
    id: "wamid.AUDIO",
    type: "audio",
    audio: { id: "MEDIA_AUDIO_1", mime_type: "audio/ogg; codecs=opus", sha256: "abc", voice: true },
  });
  const c = attachmentCandidates({ channelType: "whatsapp", messageType: parsed.messageType, metadata: parsed.metadata });
  assert.equal(c.length, 1);
  assert.deepEqual([c[0].kind, c[0].provider_media_id, c[0].mime_type, c[0].position], ["audio", "MEDIA_AUDIO_1", "audio/ogg; codecs=opus", 0]);
});

test("adjuntos: fotos, videos, documentos y stickers; texto, ubicación o contactos no", () => {
  const tipos: [string, string][] = [
    ["image", "imagen"],
    ["video", "video"],
    ["document", "documento"],
    ["sticker", "sticker"],
    ["voice", "audio"],
  ];
  for (const [type, kind] of tipos) {
    const md = { provider_type: type, media_id: `M_${type}`, mime_type: "application/octet-stream", filename: type === "document" ? "constancia.pdf" : null };
    const c = attachmentCandidates({ channelType: "whatsapp", messageType: type, metadata: md });
    assert.equal(c[0]?.kind, kind, type);
  }
  for (const type of ["text", "location", "contacts", "reaction", "button"]) {
    assert.deepEqual(attachmentCandidates({ channelType: "whatsapp", messageType: type, metadata: { provider_type: type } }), [], type);
  }
  // Sin identificador del archivo no hay nada que guardar.
  assert.deepEqual(attachmentCandidates({ channelType: "whatsapp", messageType: "image", metadata: { provider_type: "image" } }), []);
});

test("adjuntos: Instagram/Facebook pueden traer varios; solo archivos con enlace https", () => {
  const c = attachmentCandidates({
    channelType: "instagram",
    messageType: "image",
    metadata: {
      attachments: [
        { type: "image", payload: { url: "https://cdn.pruebas.invalid/a.jpg" } },
        { type: "share", payload: { url: "https://cdn.pruebas.invalid/post" } },
        { type: "file", payload: { url: "https://cdn.pruebas.invalid/b.pdf", title: "b.pdf" } },
        { type: "image", payload: { url: "http://inseguro.invalid/c.jpg" } },
      ],
    },
  });
  assert.deepEqual(c.map((x) => [x.position, x.kind]), [[0, "imagen"], [2, "documento"]]);
});

test("adjuntos: la ruta en el almacenamiento no lleva datos personales", () => {
  const path = storagePathFor({ area: "civil", conversationId: "11111111-2222-3333-4444-555555555555", attachmentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", ext: "ogg" });
  assert.equal(path, "civil/11111111-2222-3333-4444-555555555555/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.ogg");
  assert.equal(storagePathFor({ area: "civil", conversationId: "../x", attachmentId: "a/b", ext: "p d f" }), "civil/___x/a_b.p_d_f");
});

test("adjuntos: extensión, tipo guardado y apertura segura en el navegador", () => {
  assert.equal(extensionFor("audio/ogg; codecs=opus", null), "ogg");
  assert.equal(extensionFor("application/pdf", "x.bin"), "pdf");
  assert.equal(extensionFor(null, "Constancia.DOCX"), "docx");
  assert.equal(extensionFor(null, "sin-extension"), "bin");
  assert.equal(extensionFor("application/x-raro", "malicioso.html.exe"), "exe");
  // HTML, SVG y desconocidos se guardan como binario y se descargan (nunca se abren en el navegador).
  for (const m of ["text/html", "image/svg+xml", "application/javascript", "application/x-raro", null]) {
    assert.equal(storageContentType(m), "application/octet-stream", String(m));
    assert.equal(opensInline(m), false, String(m));
  }
  for (const m of ["audio/ogg", "image/jpeg", "image/png", "video/mp4", "application/pdf"]) {
    assert.equal(opensInline(m), true, m);
    assert.equal(storageContentType(m), m);
  }
  assert.equal(storageContentType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  assert.equal(downloadName({ kind: "documento", fileName: "Recibo: marzo/2026.pdf", ext: "pdf", receivedAt: new Date("2026-10-10T12:00:00Z") }), "Recibo_ marzo_2026.pdf");
  assert.equal(downloadName({ kind: "audio", fileName: null, ext: "ogg", receivedAt: new Date("2026-10-10T12:00:00Z") }), "audio-20261010.ogg");
});

test("adjuntos: plazo de descarga de WhatsApp (7 días) y topes de tamaño", () => {
  const llegada = new Date("2026-10-01T10:00:00Z");
  assert.equal(downloadDeadline("whatsapp", llegada)?.toISOString(), "2026-10-08T10:00:00.000Z");
  assert.equal(downloadDeadline("instagram", llegada), null);
  assert.ok(INLINE_MAX_BYTES < ATTACHMENT_MAX_BYTES);
  assert.equal(ATTACHMENT_MAX_BYTES, 50 * 1024 * 1024, "igual al límite del bucket privado");
});

test("adjuntos: la huella de Meta se compara en hexadecimal o base64", () => {
  const bytes = new TextEncoder().encode("contenido de prueba");
  const hex = createHash("sha256").update(bytes).digest("hex");
  const b64 = createHash("sha256").update(bytes).digest("base64");
  assert.equal(sha256Matches(hex.toUpperCase(), hex, b64), true);
  assert.equal(sha256Matches(b64, hex, b64), true);
  assert.equal(sha256Matches(b64.replace(/=+$/, ""), hex, b64), true);
  assert.equal(sha256Matches("otra", hex, b64), false);
  assert.equal(sha256Matches(null, hex, b64), null);
});
