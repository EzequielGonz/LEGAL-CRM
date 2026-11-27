import test from "node:test";
import assert from "node:assert/strict";
import { INCLINACION_MAX, INCLINACION_POR_DEFECTO, calcularInclinacion } from "@/lib/premium/inclinacion";

test("premium · inclinación: en el centro no se inclina y el brillo queda al medio", () => {
  const v = calcularInclinacion(100, 50, 200, 100);
  assert.deepEqual(v, { rx: 0, ry: 0, bx: 50, by: 50 });
  assert.ok(!Object.is(v.rx, -0) && !Object.is(v.ry, -0));
});

test("premium · inclinación: el borde del cursor se hunde y nunca pasa del máximo", () => {
  const derecha = calcularInclinacion(200, 50, 200, 100, 5);
  assert.equal(derecha.ry, 5);
  assert.equal(derecha.bx, 100);
  const izquierda = calcularInclinacion(0, 50, 200, 100, 5);
  assert.equal(izquierda.ry, -5);
  const abajo = calcularInclinacion(100, 100, 200, 100, 5);
  assert.equal(abajo.rx, -5);
  const arriba = calcularInclinacion(100, 0, 200, 100, 5);
  assert.equal(arriba.rx, 5);
  // Fuera de la tarjeta se acota; el máximo absoluto es 6°.
  assert.equal(calcularInclinacion(9999, -9999, 200, 100, 5).ry, 5);
  assert.equal(calcularInclinacion(200, 50, 200, 100, 40).ry, INCLINACION_MAX);
  assert.equal(calcularInclinacion(200, 50, 200, 100).ry, INCLINACION_POR_DEFECTO);
});

test("premium · inclinación: medidas o posiciones inválidas no rompen nada", () => {
  assert.deepEqual(calcularInclinacion(10, 10, 0, 100), { rx: 0, ry: 0, bx: 50, by: 50 });
  assert.deepEqual(calcularInclinacion(Number.NaN, 10, 100, 100), { rx: 0, ry: 0, bx: 50, by: 50 });
  assert.equal(calcularInclinacion(100, 50, 200, 100, Number.NaN).ry, 0);
  assert.equal(calcularInclinacion(150, 50, 200, 100, -3).ry, 0);
});
