import test from "node:test";
import assert from "node:assert/strict";
import { altoDeBarra, palabrasDeCartel, saludoCartel } from "../../src/lib/premium/cartel";

test("cartel: las palabras entre corchetes van marcadas y el resto no", () => {
  assert.deepEqual(palabrasDeCartel("¿Con qué [perfil] trabajás?"), [
    { palabra: "¿Con", marcada: false },
    { palabra: "qué", marcada: false },
    { palabra: "perfil", marcada: true },
    { palabra: "trabajás?", marcada: false },
  ]);
  assert.deepEqual(palabrasDeCartel("Resumen de [todo]").map((p) => p.palabra).join(" "), "Resumen de todo");
  assert.deepEqual(palabrasDeCartel(""), []);
});

test("cartel: una marca puede tener varias palabras", () => {
  assert.deepEqual(palabrasDeCartel("en [gradient mesh]"), [
    { palabra: "en", marcada: false },
    { palabra: "gradient mesh", marcada: true },
  ]);
});

test("saludo: la última palabra queda recuadrada con su punto", () => {
  assert.equal(saludoCartel("Buenas tardes"), "Buenas [tardes.]");
  assert.equal(saludoCartel("Buen día"), "Buen [día.]");
  assert.equal(saludoCartel("Hola"), "Hola.");
});

test("barras: sin dato es un rastro, nunca cero; las chicas se siguen viendo", () => {
  assert.equal(altoDeBarra(null, 100), 4);
  assert.equal(altoDeBarra(100, 100), 100);
  assert.equal(altoDeBarra(0, 100), 6);
  assert.ok(altoDeBarra(4, 385) >= 10);
  assert.ok(altoDeBarra(32, 385) > altoDeBarra(4, 385));
  assert.equal(altoDeBarra(500, 100), 100);
});
