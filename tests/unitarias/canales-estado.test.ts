import { test } from "node:test";
import assert from "node:assert/strict";
import { canalConectado, conEstadoReal } from "../../src/lib/canales-estado";

const env = { WHATSAPP_COBERTURAS_MEDICAS_ACCESS_TOKEN: "x", WHATSAPP_COBERTURAS_MEDICAS_PHONE_NUMBER_ID: "1", FACEBOOK_CIVIL_PAGE_ACCESS_TOKEN: "y" };

test("WhatsApp conectado con token e ID de número", () => {
  assert.equal(canalConectado({ area: "coberturas_medicas", type: "whatsapp" }, env), true);
  assert.equal(canalConectado({ area: "agencia_0km", type: "whatsapp" }, env), false);
});
test("Instagram y Facebook según el token de página del perfil", () => {
  assert.equal(canalConectado({ area: "civil", type: "instagram" }, env), true);
  assert.equal(canalConectado({ area: "coberturas_medicas", type: "facebook" }, env), false);
});
test("Landing siempre recibe y la columna vieja se ignora", () => {
  const [c] = conEstadoReal([{ area: "marketing", type: "landing", is_connected: false }], env);
  assert.equal(c.is_connected, true);
});
