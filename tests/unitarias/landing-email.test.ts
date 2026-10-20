import test from "node:test";
import assert from "node:assert/strict";
import { armarCorreoLanding, enviarCorreoLanding, DESTINOS_CORREO, escaparHtml } from "@/lib/landing-email";

const base = { nombre: "Ana Pérez", telefono: "1140000000", email: "ana@mail.com", consulta: "Quiero consultar", pagina: "/prepagas", llegada: "Instagram" };

test("correo landing: cada perfil va a su casilla", () => {
  assert.equal(armarCorreoLanding({ ...base, area: "marketing" })?.to, "agenciakocos@hotmail.com");
  assert.equal(armarCorreoLanding({ ...base, area: "agencia_0km" })?.to, "autoskocos@hotmail.com");
  assert.equal(armarCorreoLanding({ ...base, area: "coberturas_medicas" })?.to, "comparatuobrasocial@hotmail.com");
  assert.equal(armarCorreoLanding({ ...base, area: "civil" })?.to, "estudiojuridicointegralvita@gmail.com");
  assert.equal(armarCorreoLanding({ ...base, area: "penal" })?.to, "estudiojuridicointegralvita@gmail.com");
  assert.equal(Object.keys(DESTINOS_CORREO).length, 5);
  assert.equal(armarCorreoLanding({ ...base, area: "otra" }), null);
});

test("correo landing: asunto, origen y responder al contacto", () => {
  const c = armarCorreoLanding({ ...base, area: "civil" });
  assert.ok(c);
  assert.match(c.subject, /Estudio Jurídico Vita/);
  assert.match(c.text, /Llegó desde: Instagram/);
  assert.match(c.text, /Página: \/prepagas/);
  assert.equal(c.replyTo, "ana@mail.com");
  const sin = armarCorreoLanding({ ...base, area: "civil", email: "no-es-correo", llegada: null });
  assert.equal(sin?.replyTo, null);
  assert.match(sin?.text ?? "", /Llegó desde: No informado/);
});

test("correo landing: escapa HTML y no deja saltos de línea en el asunto", () => {
  const c = armarCorreoLanding({ ...base, area: "marketing", nombre: "Ana\r\nBcc: x@y.com", consulta: "<script>alert(1)</script>" });
  assert.ok(c);
  assert.ok(!/[\r\n]/.test(c.subject));
  assert.ok(!c.html.includes("<script>"));
  assert.match(c.html, /&lt;script&gt;/);
  assert.equal(escaparHtml(`<a href="x">&'`), "&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
});

test("correo landing: sin clave o sin remitente no envía", async () => {
  const c = armarCorreoLanding({ ...base, area: "marketing" })!;
  let llamadas = 0;
  const f = (async () => { llamadas++; return new Response("{}", { status: 200 }); }) as typeof fetch;
  assert.deepEqual(await enviarCorreoLanding(c, { apiKey: undefined, from: "a@b.com" }, f), { enviado: false, motivo: "sin_configuracion" });
  assert.deepEqual(await enviarCorreoLanding(c, { apiKey: "k", from: undefined }, f), { enviado: false, motivo: "sin_configuracion" });
  assert.equal(llamadas, 0);
});

test("correo landing: envía a Resend, y un fallo no lanza", async () => {
  const c = armarCorreoLanding({ ...base, area: "coberturas_medicas" })!;
  let pedido: { url: string; init: RequestInit } | null = null;
  const ok = (async (url: string, init: RequestInit) => { pedido = { url, init }; return new Response("{}", { status: 200 }); }) as unknown as typeof fetch;
  assert.deepEqual(await enviarCorreoLanding(c, { apiKey: "clave-x", from: "Avisos <avisos@kocosmkt.com>" }, ok), { enviado: true });
  assert.equal(pedido!.url, "https://api.resend.com/emails");
  const cuerpo = JSON.parse(String(pedido!.init.body));
  assert.deepEqual(cuerpo.to, ["comparatuobrasocial@hotmail.com"]);
  assert.equal(cuerpo.reply_to, "ana@mail.com");
  assert.equal((pedido!.init.headers as Record<string, string>).Authorization, "Bearer clave-x");

  const mal = (async () => new Response("{}", { status: 422 })) as typeof fetch;
  assert.deepEqual(await enviarCorreoLanding(c, { apiKey: "k", from: "a@b.com" }, mal), { enviado: false, motivo: "respuesta_422" });
  const cae = (async () => { throw new TypeError("red"); }) as typeof fetch;
  assert.deepEqual(await enviarCorreoLanding(c, { apiKey: "k", from: "a@b.com" }, cae), { enviado: false, motivo: "TypeError" });
});
