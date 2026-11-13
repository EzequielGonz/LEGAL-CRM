import test from "node:test";
import assert from "node:assert/strict";
import { areaSuave, etiquetaDeDia, leerSerie, puntosDeSerie, topeDeEje, trazoSuave } from "@/lib/resultados-grafico";

test("gráfico: el eje termina en un número redondo por encima del máximo", () => {
  assert.deepEqual([0, 3, 4, 5, 14, 22, 26, 51, 140, 1000].map(topeDeEje), [4, 4, 4, 5, 20, 25, 50, 100, 200, 1000]);
});

test("gráfico: los puntos quedan dentro del lienzo y el máximo toca el borde de arriba", () => {
  const m = { izq: 30, der: 10, arriba: 10, abajo: 30 };
  const p = puntosDeSerie([0, 10, 20], 700, 200, 20, m);
  assert.deepEqual(p, [{ x: 30, y: 170 }, { x: 360, y: 90 }, { x: 690, y: 10 }]);
  assert.deepEqual(puntosDeSerie([5], 700, 200, 20, m), [{ x: 360, y: 130 }]);
  assert.equal(puntosDeSerie([99], 700, 200, 20, m)[0].y, 10, "un valor mayor que el tope no se sale");
});

test("gráfico: la línea pasa por todos los puntos y el relleno cierra contra la base", () => {
  const p = [{ x: 0, y: 10 }, { x: 10, y: 0 }, { x: 20, y: 5 }];
  assert.equal(trazoSuave(p), "M0,10 C5,10 5,0 10,0 C15,0 15,5 20,5");
  assert.ok(areaSuave(p, 30).endsWith("L20,30 L0,30 Z"));
  assert.equal(areaSuave([p[0]], 30), "");
  assert.equal(trazoSuave([]), "");
});

test("gráfico: etiquetas de día y lectura de la serie", () => {
  assert.equal(etiquetaDeDia("2026-11-09", false), "lun 9");
  assert.equal(etiquetaDeDia("2026-11-13", true), "13");
  assert.deepEqual(leerSerie([{ dia: "2026-11-10", contactados: "30", respondieron: 1, captados: null }, { dia: 5 }, null]), [{ dia: "2026-11-10", contactados: 30, respondieron: 1, captados: 0 }]);
  assert.deepEqual(leerSerie(null), []);
});
