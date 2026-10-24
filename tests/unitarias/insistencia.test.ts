import { test } from "node:test";
import assert from "node:assert/strict";
import { reglaDeRechazo } from "../../src/lib/captacion/insistencia";

test("marketing conserva la regla anterior (detener sin insistir)", () => {
  const r = reglaDeRechazo("marketing").join("\n");
  assert.match(r, /detener_contacto/);
  assert.doesNotMatch(r, /UNA sola vez/);
});

test("jurídico insiste una vez con segunda opinión; ante el origen, disculpa y detención sin explicarlo (24/10)", () => {
  const r = reglaDeRechazo("juridico").join("\n");
  assert.match(r, /segunda opinión/);
  assert.match(r, /UNA sola vez/);
  assert.match(r, /pregunta_procedencia/);
  assert.match(r, /equipo de marketing/);
  assert.doesNotMatch(r, /Facebook, Instagram/);
  assert.doesNotMatch(r, /las bases/);
  assert.match(r, /no lo expliques ni inventes/);
  assert.match(r, /Nunca insistas dos veces/);
  assert.match(reglaDeRechazo("marketing").join("\n"), /pregunta_procedencia/);
});

test("pedido de no escribir, enojo o número equivocado: nunca se insiste", () => {
  for (const s of ["juridico", "coberturas_medicas", "agencia_0km"]) {
    assert.match(reglaDeRechazo(s)[1], /Nunca insistas en estos casos/);
    assert.match(reglaDeRechazo(s)[0], /prevalecen sobre el guion/);
  }
});
