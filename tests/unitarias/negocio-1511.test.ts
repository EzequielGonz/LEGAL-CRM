import { test } from "node:test";
import assert from "node:assert/strict";
import { apagaEntrenamiento, ENTRENAMIENTO, esResultadoSemana, estadoEntrenamiento } from "../../src/lib/campanas/entrenamiento";
import { topeAlcanzado, TOPE_SIN_RESPUESTA } from "../../src/lib/contacto/tope";
import { frenoRespuestaSalteado, motivoDeFrenoPorRespuesta } from "../../src/lib/wasender/ritmo";
import { captadoEsperaDeMas } from "../../src/lib/hoy/colas";

test("entrenamiento: 20 por día, 7 días, y un límite mayor lo apaga", () => {
  assert.equal(ENTRENAMIENTO.porDia, 20);
  assert.ok(apagaEntrenamiento(50));
  assert.ok(apagaEntrenamiento(null), "sin límite es ir por más volumen");
  assert.ok(!apagaEntrenamiento(15));
  const desde = "2026-11-10T12:00:00Z";
  assert.deepEqual(estadoEntrenamiento({ entrenamiento_desde: desde }, new Date("2026-11-10T20:00:00Z")), { enEntrenamiento: true, dia: 1, terminado: false, pideResultado: false });
  const d7 = estadoEntrenamiento({ entrenamiento_desde: desde }, new Date("2026-11-16T13:00:00Z"))!;
  assert.equal(d7.dia, 7);
  assert.ok(d7.pideResultado && d7.enEntrenamiento);
  const d9 = estadoEntrenamiento({ entrenamiento_desde: desde, resultado_semana: "avanzo" }, new Date("2026-11-18T13:00:00Z"))!;
  assert.ok(d9.terminado && !d9.pideResultado);
  assert.equal(estadoEntrenamiento({ entrenamiento_desde: null }), null);
  assert.ok(esResultadoSemana("vendido") && !esResultadoSemana("ganado"));
});

test("tope por persona: 3 automáticos sin respuesta", () => {
  assert.equal(TOPE_SIN_RESPUESTA, 3);
  assert.ok(!topeAlcanzado(2));
  assert.ok(topeAlcanzado(3));
});

test("freno por respuesta: menos del 1 % con 100 envíos o más, y se puede saltear a mano", () => {
  assert.equal(motivoDeFrenoPorRespuesta({ enviados: 99, respondieron: 0 }), null);
  assert.equal(motivoDeFrenoPorRespuesta({ enviados: 200, respondieron: 2 }), null);
  assert.match(motivoDeFrenoPorRespuesta({ enviados: 200, respondieron: 1 })!, /^Freno por respuesta:/);
  const ahora = new Date("2026-11-15T12:00:00Z");
  assert.ok(frenoRespuestaSalteado("2026-11-12T12:00:00Z", ahora));
  assert.ok(!frenoRespuestaSalteado("2026-11-01T12:00:00Z", ahora));
  assert.ok(!frenoRespuestaSalteado(null, ahora));
});

test("captado esperando el llamado más de 24 horas", () => {
  const ahora = new Date("2026-11-15T12:00:00Z");
  assert.ok(captadoEsperaDeMas("2026-11-14T11:00:00Z", ahora));
  assert.ok(!captadoEsperaDeMas("2026-11-14T13:00:00Z", ahora));
  assert.ok(!captadoEsperaDeMas(null, ahora));
});
