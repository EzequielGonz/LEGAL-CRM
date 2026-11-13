import { test } from "node:test";
import assert from "node:assert/strict";
import { accionPorRelectura, leerRelectura, TEXTO_REGLA } from "../../src/lib/limpieza/reglas";
import { alPerderse } from "../../src/lib/opportunities";

// 13/11 · «reconocé el mensaje de lo último que habló, si concretó una llamada derivalo a captado,
// si no dejalo en quedaron sin respuesta»; ante la duda, «posible captación a revisar».

test("limpieza: se lee la respuesta del bot y lo que no se entiende no mueve a nadie", () => {
  assert.deepEqual(leerRelectura('{"tipo":"oportunidad","concreto_llamada":"si","motivo":"Dijo: llamame mañana a las 10"}'), { tipo: "oportunidad", concreto_llamada: "si", motivo: "Dijo: llamame mañana a las 10" });
  assert.equal(leerRelectura('```json\n{"tipo":"Rechazo","concreto_llamada":"No","motivo":"ya tiene abogado"}\n```')?.tipo, "rechazo");
  assert.equal(leerRelectura('{"tipo":"duda","concreto_llamada":"sí","motivo":""}')?.concreto_llamada, "si");
  assert.equal(leerRelectura('{"tipo":"cualquiera","concreto_llamada":"si"}'), null);
  assert.equal(leerRelectura('{"tipo":"duda"}'), null);
  assert.equal(leerRelectura("no es json"), null);
  assert.equal(leerRelectura(null), null);
});

test("limpieza: qué corresponde con quien quedó sin respuesta", () => {
  const r = (tipo: any, concreto_llamada: any) => ({ tipo, concreto_llamada, motivo: "" });
  assert.equal(accionPorRelectura("ultima_palabra_persona", r("oportunidad", "si")), "captar", "«llamame mañana a las 10»");
  assert.equal(accionPorRelectura("ultima_palabra_persona", r("duda", "si")), "captar", "«ok» después de que se le propuso una llamada");
  assert.equal(accionPorRelectura("ultima_palabra_persona", r("duda", "duda")), "posible_captacion", "«ok» suelto");
  assert.equal(accionPorRelectura("ultima_palabra_persona", r("oportunidad", "no")), "queda", "«¿cuánto sale?»: queda sin respuesta");
  assert.equal(accionPorRelectura("ultima_palabra_persona", r("duda", "no")), "queda");
  assert.equal(accionPorRelectura("ultima_palabra_persona", r("rechazo", "no")), "perder");
  assert.equal(accionPorRelectura("ultima_palabra_persona", r("baja", "no")), "perder_y_detener");
  assert.equal(accionPorRelectura("ultima_palabra_persona", r("rechazo", "si")), "perder", "una negativa clara manda");
});

test("limpieza: quien pedía una persona no se marca captado por una relectura", () => {
  const r = (tipo: any, concreto_llamada: any) => ({ tipo, concreto_llamada, motivo: "" });
  assert.equal(accionPorRelectura("pedia_persona", r("oportunidad", "si")), "queda");
  assert.equal(accionPorRelectura("pedia_persona", r("duda", "duda")), "queda", "ante la duda no se pierde a nadie");
  assert.equal(accionPorRelectura("pedia_persona", r("rechazo", "no")), "perder");
  assert.equal(accionPorRelectura("pedia_persona", r("baja", "no")), "perder_y_detener");
});

test("limpieza: cada regla tiene su explicación en palabras", () => {
  for (const k of ["perdido_sin_atencion", "rechazo_no_es_atencion", "relectura_rechazo", "relectura_baja", "dejo_de_responder", "concreto_llamada", "posible_captacion", "incidencia_de_migracion", "relectura_sin_cambio"]) {
    assert.ok(TEXTO_REGLA[k]?.titulo && TEXTO_REGLA[k]?.que, k);
  }
});

test("invariante: perdido ya no espera a una persona ni queda «a revisar»", () => {
  assert.deepEqual(alPerderse("capture_state", "perdido", { attention_state: "requiere_humano", posible_captacion: true }), { oportunidad: { attention_state: "ia", posible_captacion: false }, atencionAntes: "requiere_humano" });
  assert.deepEqual(alPerderse("capture_state", "perdido", { attention_state: "humano_en_curso" }), { oportunidad: { attention_state: "ia" }, atencionAntes: "humano_en_curso" });
  assert.deepEqual(alPerderse("capture_state", "perdido", { attention_state: "ia" }), { oportunidad: {}, atencionAntes: null });
  assert.deepEqual(alPerderse("capture_state", "captado", { attention_state: "requiere_humano" }), { oportunidad: {}, atencionAntes: null }, "un captado sigue esperando a su persona");
  assert.deepEqual(alPerderse("followup_state", "caido", { attention_state: "requiere_humano" }), { oportunidad: {}, atencionAntes: null });
});
