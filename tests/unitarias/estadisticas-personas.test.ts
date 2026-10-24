import { test } from "node:test";
import assert from "node:assert/strict";
import { esTrabaReal, grupoPorMotivo, motivoLegible, seEnfrio } from "../../src/lib/estadisticas-personas-reglas";

test("motivos: por cerrar, pidió persona y no interesados van separados", () => {
  assert.equal(grupoPorMotivo("precio_fuera_alcance"), "por_cerrar");
  assert.equal(grupoPorMotivo("consulta_fuera_alcance"), "por_cerrar");
  assert.equal(grupoPorMotivo("pide_persona"), "pide_persona");
  for (const m of ["abogado_existente", "caso_resuelto", "desinteres", "no_quiere_mensajes", "numero_equivocado"]) {
    assert.equal(grupoPorMotivo(m), "no_interesado", m);
  }
  assert.equal(grupoPorMotivo("pregunta_procedencia"), null);
  assert.equal(grupoPorMotivo(null), null);
});

test("bot trabado: una detención frenada no cuenta", () => {
  assert.equal(esTrabaReal("retenido", null), true);
  assert.equal(esTrabaReal("error", "timeout del modelo"), true);
  assert.equal(esTrabaReal("error", "Contacto detenido: Necesidad resuelta"), false);
  assert.equal(esTrabaReal("enviado", null), false);
});

test("se enfrió: respondió, lo último fue nuestro y pasaron 48 h", () => {
  const ahora = new Date("2026-10-24T12:00:00Z");
  assert.equal(seEnfrio({ respondio: true, ultimoEsNuestro: true, ultimoAt: "2026-10-21T12:00:00Z" }, ahora), true);
  assert.equal(seEnfrio({ respondio: true, ultimoEsNuestro: true, ultimoAt: "2026-10-23T12:00:00Z" }, ahora), false);
  assert.equal(seEnfrio({ respondio: true, ultimoEsNuestro: false, ultimoAt: "2026-10-20T12:00:00Z" }, ahora), false);
  assert.equal(seEnfrio({ respondio: true, ultimoEsNuestro: true, ultimoAt: "2026-08-01T12:00:00Z" }, ahora), false);
});

test("motivo legible", () => {
  assert.match(motivoLegible("precio_fuera_alcance"), /precio/);
});
