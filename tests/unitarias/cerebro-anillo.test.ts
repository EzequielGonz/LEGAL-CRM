import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PANTALLAS,
  ajustar,
  filtrarBarrios,
  giroHacia,
  indiceAlFrente,
  pantallaDeAncla,
  pedidoDeRecomendacion,
  pedidoOrden,
  posicion,
  radioAnillo,
  recortar,
  resumenGrafo,
} from "../../src/lib/cerebro/anillo";

const N = PANTALLAS.length;

test("anillo: las pantallas pedidas están todas y sin ids repetidos", () => {
  const ids = PANTALLAS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ["aprendido", "decisiones", "pendientes", "oficina", "jarvis", "laboratorio", "salud", "semana", "mapa"]) assert.ok(ids.includes(id as never), id);
});

test("anillo: qué pantalla queda al frente al girar (también con giros negativos y varias vueltas)", () => {
  const p = 360 / N;
  assert.equal(indiceAlFrente(0, N), 0);
  assert.equal(indiceAlFrente(p, N), 1);
  assert.equal(indiceAlFrente(p * 0.4, N), 0);
  assert.equal(indiceAlFrente(-p, N), N - 1);
  assert.equal(indiceAlFrente(360 * 3 + 2 * p, N), 2);
  assert.equal(indiceAlFrente(Number.NaN, N), 0);
  assert.equal(indiceAlFrente(30, 0), 0);
});

test("anillo: ir a una pantalla toma el camino corto", () => {
  const p = 360 / N;
  // De la primera a la última: un paso hacia atrás, no una vuelta casi entera.
  assert.equal(giroHacia(N - 1, 0, N), (N - 1) * p - 360);
  assert.equal(indiceAlFrente(giroHacia(N - 1, 0, N), N), N - 1);
  // Desde varias vueltas, sigue cerca.
  const g = giroHacia(3, 720 + 0.2 * p, N);
  assert.ok(Math.abs(g - (720 + 3 * p)) < 1e-9);
});

test("anillo: ajustar encaja en la pantalla más cercana", () => {
  const p = 360 / N;
  assert.equal(ajustar(p * 1.4, N), p);
  assert.equal(ajustar(p * 1.6, N), 2 * p);
  assert.equal(ajustar(Number.POSITIVE_INFINITY, N), 0);
});

test("anillo: posición y cercanía (1 al frente, 0 atrás)", () => {
  const frente = posicion(2, giroHacia(2, 0, N), N);
  assert.equal(Math.round(frente.angulo), 0);
  assert.equal(frente.cercania, 1);
  const p = posicion(0, 180, 2);
  assert.equal(Math.abs(p.angulo), 180);
  assert.equal(p.cercania, 0);
  const a = posicion(1, 0, N).angulo;
  assert.ok(a > 0 && a <= 180);
});

test("anillo: el radio crece con más pantallas", () => {
  assert.ok(radioAnillo(11, 260) > radioAnillo(6, 260));
  assert.ok(radioAnillo(11, 260) > 260);
  assert.equal(radioAnillo(2, 200), 200);
});

test("anillo: las secciones viejas (#alertas, #preguntas…) abren su pantalla nueva", () => {
  assert.equal(pantallaDeAncla("#alertas"), "salud");
  assert.equal(pantallaDeAncla("preguntas"), "pendientes");
  assert.equal(pantallaDeAncla("#corregi"), "decisiones");
  assert.equal(pantallaDeAncla("#oficina"), "oficina");
  assert.equal(pantallaDeAncla("#nada"), null);
  assert.equal(pantallaDeAncla(""), null);
  assert.equal(pantallaDeAncla(null), null);
});

test("ordenale: valida el largo y arma el pedido para la Oficina", () => {
  assert.equal(pedidoOrden("hola").ok, false);
  assert.equal(pedidoOrden("x".repeat(2000)).ok, false);
  const r = pedidoOrden("  Armá   un plan de reels para Coberturas  ");
  assert.ok(r.ok);
  if (r.ok) {
    assert.match(r.pedido, /^Orden del dueño desde el Cerebro: Armá un plan de reels para Coberturas/);
    assert.match(r.pedido, /borrador/);
  }
  assert.match(pedidoDeRecomendacion("Subir el ritmo", "hay cupo"), /Subir el ritmo.*hay cupo/s);
});

test("mapa del código: lee el informe de Graphify del repo", () => {
  const md = readFileSync(join(process.cwd(), "cerebro", "mapa-codigo", "GRAPH_REPORT.md"), "utf8");
  const g = resumenGrafo(md);
  assert.ok((g.nodos ?? 0) > 100);
  assert.ok((g.relaciones ?? 0) > 100);
  assert.ok((g.comunidades ?? 0) > 1);
  assert.ok(g.centrales.length > 0);
  assert.ok(g.barrios.length > 0);
  assert.ok(g.barrios.every((b) => !b.startsWith("ref_")));
});

test("mapa del código: tolera un informe vacío o incompleto y filtra sin tildes", () => {
  const g = resumenGrafo("");
  assert.equal(g.nodos, null);
  assert.deepEqual(g.centrales, []);
  const h = resumenGrafo("# Graph Report - x  (2026-11-22)\n- 5,541 nodes · 8.314 edges · 572 communities\n");
  assert.equal(h.fecha, "2026-11-22");
  assert.equal(h.nodos, 5541);
  assert.equal(h.relaciones, 8314);
  assert.deepEqual(filtrarBarrios(["oficina/reglas.ts", "salud/reglas.ts"], "OFICINA"), ["oficina/reglas.ts"]);
  assert.deepEqual(filtrarBarrios(["a", "b"], "  "), ["a", "b"]);
});

test("recortar: corta en el último espacio y suma puntos suspensivos", () => {
  assert.equal(recortar("corto", 64), "corto");
  const r = recortar("22/11 · El cerebro orquesta y la Oficina es un edificio por sectores", 40);
  assert.ok(r.length <= 40);
  assert.ok(r.endsWith("…"));
  assert.ok(!/\s…$/.test(r));
  assert.equal(recortar("", 10), "");
});
