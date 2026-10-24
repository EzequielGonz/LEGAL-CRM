import { test } from "node:test";
import assert from "node:assert/strict";
import { reglaDeRechazo } from "../../src/lib/captacion/insistencia";

test("marketing conserva la regla anterior (detener sin insistir)", () => {
  const r = reglaDeRechazo("marketing").join("\n");
  assert.match(r, /detener_contacto/);
  assert.doesNotMatch(r, /UNA sola vez/);
});

test("jurídico insiste una vez con segunda opinión y explica el origen sin decir que consultó", () => {
  const r = reglaDeRechazo("juridico").join("\n");
  assert.match(r, /segunda opinión/);
  assert.match(r, /UNA sola vez/);
  assert.match(r, /Facebook, Instagram/);
  assert.match(r, /equipo de marketing/);
  assert.doesNotMatch(r, /las bases/);
  assert.match(r, /No digas que consultó/);
  assert.match(r, /Nunca insistas dos veces/);
});

test("pedido de no escribir, enojo o número equivocado: nunca se insiste", () => {
  for (const s of ["juridico", "coberturas_medicas", "agencia_0km"]) {
    assert.match(reglaDeRechazo(s)[1], /Nunca insistas en estos casos/);
    assert.match(reglaDeRechazo(s)[0], /prevalecen sobre el guion/);
  }
});
