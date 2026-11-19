import test from "node:test";
import assert from "node:assert/strict";
import { debeArchivarse } from "../../src/lib/archivo/archivo";

const ahora = new Date("2026-11-19T12:00:00Z");
const hace = (d: number) => new Date(ahora.getTime() - d * 86_400_000).toISOString();
const base = { capture_state: "perdido", followup_state: "ninguno", attention_category: null, updated_at: hace(31), last_inbound_at: hace(40) };

test("un perdido con más de un mes sin novedades se archiva", () => assert.equal(debeArchivarse(base, ahora), true));
test("con menos de un mes no se archiva", () => assert.equal(debeArchivarse({ ...base, updated_at: hace(10) }, ahora), false));
test("si la persona escribió hace poco no se archiva", () => assert.equal(debeArchivarse({ ...base, last_inbound_at: hace(2) }, ahora), false));
test("un captado nunca se archiva solo", () => assert.equal(debeArchivarse({ ...base, capture_state: "captado" }, ahora), false));
test("un caído y un detenido viejos se archivan", () => {
  assert.equal(debeArchivarse({ ...base, capture_state: "en_conversacion", followup_state: "caido" }, ahora), true);
  assert.equal(debeArchivarse({ ...base, capture_state: "en_conversacion", attention_category: "detencion" }, ahora), true);
});
test("quien está en conversación sin descartar no se archiva", () => assert.equal(debeArchivarse({ ...base, capture_state: "en_conversacion" }, ahora), false));
test("ya archivado no se vuelve a archivar", () => assert.equal(debeArchivarse({ ...base, archived_at: hace(1) }, ahora), false));
