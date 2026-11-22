import test from "node:test";
import assert from "node:assert/strict";
import { textoRitmoDeLinea } from "@/lib/definiciones/ritmo";

test("22/11: una línea de Wasender con la sesión cerrada no dice «puede enviar 40»", () => {
  const cal = { dia: 7, limite: 40, porCalentamiento: true };
  const caida = textoRitmoDeLinea({ estado: "logged_out", habilitada: true, calentamiento: cal });
  assert.doesNotMatch(caida, /40/);
  assert.match(caida, /sin sesión/i);
  assert.match(textoRitmoDeLinea({ estado: "connected", habilitada: false, calentamiento: cal }), /apagados/);
  assert.match(textoRitmoDeLinea({ estado: "connected", habilitada: true, calentamiento: cal }), /Día 7 de calentamiento: hoy puede enviar hasta 40/);
  assert.equal(textoRitmoDeLinea({ estado: "connected", habilitada: true, calentamiento: { dia: 30, limite: 250, porCalentamiento: false } }), "Campañas: hasta 250 mensajes por día.");
  assert.match(textoRitmoDeLinea({ estado: null, habilitada: true, calentamiento: cal }), /sin sesión/i);
});
