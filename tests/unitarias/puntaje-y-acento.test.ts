import { test } from "node:test";
import assert from "node:assert/strict";
import { puntajeBot } from "@/lib/agentes/puntaje";
import { escalaDesdeHex, variablesAcento } from "@/lib/acento";

const captacion = (o: Partial<{ nuevo: number; en_conversacion: number; en_seguimiento: number; captado: number; perdido: number }>) => ({
  nuevo: 0,
  en_conversacion: 0,
  en_seguimiento: 0,
  captado: 0,
  perdido: 0,
  ...o,
});

test("puntaje del bot: sin datos o con pocas conversaciones no inventa una cifra", () => {
  assert.equal(puntajeBot(null).puntaje, null);
  const p = puntajeBot({ captacion: captacion({ en_conversacion: 3, captado: 1 }), detenidos_por_motivo: {}, revision_pendiente: 0 });
  assert.equal(p.puntaje, null);
  assert.equal(p.nivel, "pocos_datos");
});

test("puntaje del bot: 30 % captado y nada perdido ni revisado da 100", () => {
  const p = puntajeBot({ captacion: captacion({ en_conversacion: 7, captado: 3 }), detenidos_por_motivo: {}, revision_pendiente: 0 });
  assert.equal(p.puntaje, 100);
  assert.equal(p.nivel, "muy_bien");
  assert.equal(p.sugerencia, null);
});

test("puntaje del bot: sin captados y con enojo baja y sugiere qué mejorar", () => {
  const p = puntajeBot({ captacion: captacion({ en_conversacion: 6, perdido: 4 }), detenidos_por_motivo: { enojo: 2 }, revision_pendiente: 0 });
  assert.ok(p.puntaje !== null && p.puntaje < 50, String(p.puntaje));
  assert.ok(p.sugerencia);
  assert.equal(p.componentes.length, 4);
});

test("acento elegido: escala de 11 tonos con el color en el 500; lo inválido se ignora", () => {
  const e = escalaDesdeHex("#FC6E20")!;
  assert.equal(e[500], "252 110 32");
  assert.equal(Object.keys(e).length, 11);
  assert.equal(e[50].split(" ").length, 3);
  assert.equal(escalaDesdeHex("rojo"), null);
  assert.equal(variablesAcento("#zzzzzz"), null);
  assert.equal(variablesAcento("#112250")?.["--c-gold-500"], "17 34 80");
});
