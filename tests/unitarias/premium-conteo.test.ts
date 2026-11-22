import test from "node:test";
import assert from "node:assert/strict";
import { sePuedeContar, suavizado, textoDePaso } from "@/lib/premium/conteo";
import { formatoNumero } from "@/lib/premium/anillo";

test("premium · suavizado: arranca en 0, llega exacto a 1 y nunca baja", () => {
  assert.equal(suavizado(0), 0);
  assert.equal(suavizado(-1), 0);
  assert.equal(suavizado(1), 1);
  assert.equal(suavizado(3), 1);
  let previo = 0;
  for (let i = 1; i <= 100; i++) {
    const v = suavizado(i / 100);
    assert.ok(v >= previo, `retrocede en ${i}`);
    assert.ok(v <= 1);
    previo = v;
  }
  // Es de salida rápida: a un tercio del tiempo ya recorrió más de la mitad.
  assert.ok(suavizado(1 / 3) > 0.5);
});

test("premium · el último paso del conteo es idéntico al texto del servidor", () => {
  for (const fin of [1, 7, 12, 46, 999, 1284, 1_000_000]) {
    assert.equal(textoDePaso(fin, 1), formatoNumero(fin));
  }
  assert.equal(textoDePaso(100, 0), "0");
});

test("premium · sePuedeContar: solo positivos razonables", () => {
  assert.equal(sePuedeContar(12), true);
  assert.equal(sePuedeContar(0), false);
  assert.equal(sePuedeContar(-4), false);
  assert.equal(sePuedeContar(Number.NaN), false);
  assert.equal(sePuedeContar(10_000_000), false);
});
