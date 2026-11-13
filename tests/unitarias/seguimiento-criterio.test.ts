import { test } from "node:test";
import assert from "node:assert/strict";
import { instruccionSeguimiento, leerCriterio, motivoNoInsistir, RUTA_SEGUIMIENTO } from "@/lib/seguimiento/criterio";
import { descartesVencidos, ESPERA_DESCARTE_HORAS } from "@/lib/hoy/descartes-motor";

test("criterio: por Wasender pide el texto; por Meta solo la decisión", () => {
  const libre = instruccionSeguimiento(2, 60, true);
  assert.match(libre, /"texto"/);
  assert.match(libre, /contacto 2 de un máximo de 3/);
  const meta = instruccionSeguimiento(2, 60, false);
  assert.doesNotMatch(meta, /"texto"/);
  assert.match(meta, /plantilla aprobada/);
  assert.match(instruccionSeguimiento(3, 60, true), /última vez/);
});

test("criterio: lee la decisión, con o sin envoltorio, y descarta lo ilegible", () => {
  assert.deepEqual(leerCriterio('{"escribir": false, "motivo": "ya tiene abogado"}', false), { escribir: false, motivo: "ya tiene abogado", texto: "" });
  const si = leerCriterio('```json\n{"escribir": true, "motivo": "preguntó y no siguió", "texto": " Hola, retomo lo que hablamos. ¿Seguimos? "}\n```', true);
  assert.equal(si?.escribir, true);
  assert.equal(si?.texto, "Hola, retomo lo que hablamos. ¿Seguimos?");
  // Por Meta el texto del bot nunca se usa aunque venga.
  assert.equal(leerCriterio('{"escribir": true, "motivo": "", "texto": "Hola"}', false)?.texto, "");
  assert.equal(leerCriterio("no sé", true), null);
  assert.equal(leerCriterio('{"motivo": "x"}', true), null);
});

test("criterio: el motivo de no insistir queda en palabras", () => {
  assert.equal(motivoNoInsistir(2, "dijo que ya lo resolvió."), "El bot no insistió (contacto 2): dijo que ya lo resolvió.");
  assert.match(motivoNoInsistir(3, ""), /no vio interés real/);
});

test("ruta: cinco pasos, cada uno dice cuándo sale y cuándo se suelta", () => {
  assert.equal(RUTA_SEGUIMIENTO.length, 5);
  for (const p of RUTA_SEGUIMIENTO) {
    assert.ok(p.cuando.length > 10 && p.suelta.length > 10 && p.quien.length > 10, p.clave);
  }
});

test("descartes automáticos: solo los que esperaron lo suficiente, nunca un captado ni sin oportunidad", () => {
  const ahora = new Date("2026-11-13T15:00:00Z");
  const hace = (h: number) => new Date(ahora.getTime() - h * 3_600_000).toISOString();
  const filas = [
    { id: "a", desde: hace(ESPERA_DESCARTE_HORAS + 1), oportunidadId: "o1", captado: false },
    { id: "b", desde: hace(1), oportunidadId: "o2", captado: false },
    { id: "c", desde: hace(30), oportunidadId: "o3", captado: true },
    { id: "d", desde: hace(30), oportunidadId: null, captado: false },
  ];
  assert.deepEqual(descartesVencidos(filas, ahora).map((f) => f.id), ["a"]);
});
