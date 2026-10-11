// Corrección 1 — Pausa general ante configuración incompleta.
// Antes: sin registro, con valor nulo o sin campos, getAutomationPause
// devolvía las dos pausas en false (todo habilitado). Ahora se conservan
// pausadas y se informa el problema de configuración.
import test from "node:test";
import assert from "node:assert/strict";
import { parseAutomationPause } from "@/lib/automation-pause";

test("1: sin registro de configuración, las dos pausas quedan activas y se informa el problema", () => {
  for (const row of [null, undefined]) {
    const p = parseAutomationPause(row);
    assert.equal(p.aiRepliesPaused, true);
    assert.equal(p.outboundPaused, true);
    assert.match(p.configProblem ?? "", /No existe la configuración/);
  }
});

test("1: valor nulo, vacío o que no es un objeto: todo pausado con el problema visible", () => {
  for (const value of [null, undefined, "", "false", 0, false, [], [false, false]]) {
    const p = parseAutomationPause({ value });
    assert.equal(p.aiRepliesPaused, true, `valor ${JSON.stringify(value)}`);
    assert.equal(p.outboundPaused, true, `valor ${JSON.stringify(value)}`);
    assert.match(p.configProblem ?? "", /vacía o no es válida/, `valor ${JSON.stringify(value)}`);
  }
});

test("1: faltan campos o no son booleanos: esa pausa queda activa y se nombra el campo", () => {
  const sinCampos = parseAutomationPause({ value: {} });
  assert.deepEqual([sinCampos.aiRepliesPaused, sinCampos.outboundPaused], [true, true]);
  assert.match(sinCampos.configProblem ?? "", /ai_replies_paused/);
  assert.match(sinCampos.configProblem ?? "", /outbound_automations_paused/);

  const soloIa = parseAutomationPause({ value: { ai_replies_paused: false } });
  assert.equal(soloIa.aiRepliesPaused, false, "el false explícito sí se respeta");
  assert.equal(soloIa.outboundPaused, true, "el campo que falta queda en pausa");
  assert.match(soloIa.configProblem ?? "", /outbound_automations_paused/);
  assert.doesNotMatch(soloIa.configProblem ?? "", /ai_replies_paused/);

  for (const raro of ["false", 0, null, "no"]) {
    const p = parseAutomationPause({ value: { ai_replies_paused: raro, outbound_automations_paused: raro } });
    assert.deepEqual([p.aiRepliesPaused, p.outboundPaused], [true, true], `valor ${JSON.stringify(raro)}`);
    assert.ok(p.configProblem, `valor ${JSON.stringify(raro)} informa el problema`);
  }
});

test("1: configuración completa: solo un false explícito levanta cada pausa", () => {
  const libre = parseAutomationPause({ value: { ai_replies_paused: false, outbound_automations_paused: false, since: "2026-10-09T22:08:00Z", reason: "prueba" } });
  assert.deepEqual([libre.aiRepliesPaused, libre.outboundPaused, libre.configProblem], [false, false, undefined]);
  assert.equal(libre.since, "2026-10-09T22:08:00Z");
  assert.equal(libre.reason, "prueba");

  const pausado = parseAutomationPause({ value: { ai_replies_paused: true, outbound_automations_paused: true } });
  assert.deepEqual([pausado.aiRepliesPaused, pausado.outboundPaused, pausado.configProblem], [true, true, undefined]);
});
