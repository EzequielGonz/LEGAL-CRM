import test from "node:test";
import assert from "node:assert/strict";
import { esperaHace } from "@/lib/premium/espera";

const AHORA = Date.parse("2026-11-22T15:00:00Z");

test("espera · minutos, horas y días con su nivel", () => {
  assert.deepEqual(esperaHace("2026-11-22T14:59:40Z", AHORA), { texto: "recién", nivel: "info", minutos: 0 });
  assert.equal(esperaHace("2026-11-22T14:35:00Z", AHORA)?.texto, "hace 25 min");
  assert.equal(esperaHace("2026-11-22T14:00:00Z", AHORA)?.nivel, "info");
  assert.equal(esperaHace("2026-11-22T12:00:00Z", AHORA)?.texto, "hace 3 h");
  assert.equal(esperaHace("2026-11-22T12:00:00Z", AHORA)?.nivel, "atencion");
  assert.equal(esperaHace("2026-11-20T15:00:00Z", AHORA)?.texto, "hace 2 d");
  assert.equal(esperaHace("2026-11-20T15:00:00Z", AHORA)?.nivel, "error");
});

test("espera · datos inválidos o del futuro no rompen", () => {
  assert.equal(esperaHace(null, AHORA), null);
  assert.equal(esperaHace("no es fecha", AHORA), null);
  assert.equal(esperaHace("2026-11-23T00:00:00Z", AHORA)?.texto, "recién");
});
