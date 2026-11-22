import test from "node:test";
import assert from "node:assert/strict";
import { clasesBento, spansBento } from "@/lib/premium/bento";
import { PARALAJE_NULO, calcularParalaje, desplazamientoCapa } from "@/lib/premium/paralaje";

test("premium · bento: columnas y filas se acotan y en tablet ocupan la mitad", () => {
  assert.deepEqual(spansBento(8, 2), { lg: 8, md: 4, filas: 2 });
  assert.deepEqual(spansBento(12), { lg: 12, md: 6, filas: 1 });
  assert.deepEqual(spansBento(4, 1, 3), { lg: 4, md: 3, filas: 1 });
  assert.deepEqual(spansBento(99, 9), { lg: 12, md: 6, filas: 3 });
  assert.deepEqual(spansBento(0, 0), { lg: 1, md: 1, filas: 1 });
  assert.deepEqual(spansBento(Number.NaN), { lg: 1, md: 1, filas: 1 });
  assert.equal(clasesBento(4, 2, 6), "pm-c-4 pm-m-6 pm-f-2");
});

test("premium · bento: toda clase que se genera existe en el CSS", async () => {
  const { readFileSync } = await import("node:fs");
  const css = readFileSync("src/app/premium.css", "utf8");
  for (let c = 1; c <= 12; c++) assert.ok(css.includes(`.pm-c-${c} {`), `pm-c-${c}`);
  for (let m = 1; m <= 6; m++) assert.ok(css.includes(`.pm-m-${m} {`), `pm-m-${m}`);
  for (let f = 1; f <= 3; f++) assert.ok(css.includes(`.pm-f-${f} {`), `pm-f-${f}`);
});

test("premium · parallax: centro es cero, bordes llegan a ±1 y el scroll se acota", () => {
  assert.deepEqual(calcularParalaje({ x: 500, y: 400, ancho: 1000, alto: 800, scroll: 0 }), PARALAJE_NULO);
  const v = calcularParalaje({ x: 1000, y: 0, ancho: 1000, alto: 800, scroll: 250 });
  assert.deepEqual(v, { px: 1, py: -1, sy: 2.5 });
  assert.equal(calcularParalaje({ x: 5000, y: -50, ancho: 1000, alto: 800, scroll: 99999 }).sy, 8);
  assert.equal(calcularParalaje({ x: 5000, y: -50, ancho: 1000, alto: 800, scroll: 0 }).px, 1);
  assert.deepEqual(calcularParalaje({ x: 1, y: 1, ancho: 0, alto: 800, scroll: 5 }), PARALAJE_NULO);
});

test("premium · parallax: ninguna capa se mueve más de lo sutil", () => {
  const peor = { px: 1, py: 1, sy: 8 };
  for (const k of [3, 6, 18]) {
    const d = desplazamientoCapa(peor, k);
    assert.ok(Math.abs(d.x) <= 24 && Math.abs(d.y) <= 24 * 4, `k=${k}`);
  }
  // Las capas de un encabezado (3, 6 y 18) son sutiles con puntero: máximo 18 px en X.
  assert.equal(desplazamientoCapa({ px: 1, py: 0, sy: 0 }, 18).x, 18);
  assert.equal(desplazamientoCapa({ px: 1, py: 0, sy: 0 }, 500).x, 60);
});
