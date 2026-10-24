import { test } from "node:test";
import assert from "node:assert/strict";
import { lineaSinAvisos, urlWebhook, suscribirAvisos, appsSuscriptas } from "@/lib/whatsapp/avisos-meta";
import { validarRol, bloqueDeRol } from "@/lib/agentes/roles-reglas";

test("línea sin avisos: envió y Meta no devolvió nada", () => {
  assert.equal(lineaSinAvisos({ salientesViejos: 120, conEstado: 0, entrantes: 0 }), true);
  assert.equal(lineaSinAvisos({ salientesViejos: 120, conEstado: 3, entrantes: 0 }), false);
  assert.equal(lineaSinAvisos({ salientesViejos: 120, conEstado: 0, entrantes: 1 }), false);
  assert.equal(lineaSinAvisos({ salientesViejos: 2, conEstado: 0, entrantes: 0 }), false);
});

test("dirección del webhook", () => {
  assert.equal(urlWebhook({ VERCEL_PROJECT_PRODUCTION_URL: "panel.ejemplo.com" }), "https://panel.ejemplo.com/api/webhooks/whatsapp");
  assert.equal(urlWebhook({ PANEL_PUBLIC_URL: "https://x.ejemplo.com/" }), "https://x.ejemplo.com/api/webhooks/whatsapp");
  assert.equal(urlWebhook({}), null);
});

const env = { WHATSAPP_X_WABA_ID: "123456789", WHATSAPP_X_ACCESS_TOKEN: "tok", WHATSAPP_VERIFY_TOKEN: "v", VERCEL_PROJECT_PRODUCTION_URL: "panel.ejemplo.com" };

test("suscribir: manda override_callback_uri y no expone el token", async () => {
  let visto: any = null;
  const r = await suscribirAvisos("WHATSAPP_X", {
    env,
    fetchImpl: async (url, init) => {
      visto = { url, init };
      return { ok: true, status: 200, text: async () => JSON.stringify({ success: true }) };
    },
  });
  assert.equal(r.ok, true);
  assert.match(visto.url, /\/123456789\/subscribed_apps$/);
  assert.equal(visto.init.method, "POST");
  assert.deepEqual(JSON.parse(visto.init.body), { override_callback_uri: "https://panel.ejemplo.com/api/webhooks/whatsapp", verify_token: "v" });
  assert.doesNotMatch(r.mensaje, /tok/);
});

test("suscribir: errores de Meta en palabras propias", async () => {
  const r = await suscribirAvisos("WHATSAPP_X", { env, fetchImpl: async () => ({ ok: false, status: 403, text: async () => JSON.stringify({ error: { code: 200 } }) }) });
  assert.equal(r.ok, false);
  assert.match(r.mensaje, /permiso/);
  const sin = await suscribirAvisos("WHATSAPP_Y", { env });
  assert.equal(sin.ok, false);
});

test("apps suscriptas: lista nombres", async () => {
  const r = await appsSuscriptas("WHATSAPP_X", { env, fetchImpl: async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ data: [{ whatsapp_business_api_data: { name: "Panel" } }] }) }) });
  assert.deepEqual(r.apps, ["Panel"]);
});

test("roles: validación y bloque para el agente", () => {
  assert.equal(validarRol({ nombre: "x", instrucciones: "algo largo de verdad" }).ok, false);
  assert.equal(validarRol({ nombre: "Inmobiliarias", instrucciones: "corto" }).ok, false);
  assert.equal(validarRol({ nombre: "Inmobiliarias", instrucciones: "Llamá al 1155554444 y cerrá" }).ok, false);
  const v = validarRol({ nombre: " Inmobiliarias ", objetivo: "agendar llamada", instrucciones: "Abrí con su web y proponé una llamada corta." });
  assert.ok(v.ok);
  if (v.ok) {
    assert.equal(v.rol.nombre, "Inmobiliarias");
    const b = bloqueDeRol(v.rol, "Base 20/10");
    assert.match(b, /Rol para esta base \(«Base 20\/10»\): Inmobiliarias/);
    assert.match(b, /Objetivo: agendar llamada/);
    // 24/10: el rol se suma a la base general, no la reemplaza.
    assert.match(b, /se SUMA a tu guion general/);
    assert.doesNotMatch(b, /por encima del guion general/);
  }
});
