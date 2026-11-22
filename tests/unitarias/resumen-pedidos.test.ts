import { test } from "node:test";
import assert from "node:assert/strict";
import { armarCifras, filasParaHoy } from "../../src/lib/resumen/filas";
import { comparacionSemanal, pedidoDeFila, totalPendiente, urlAsistente } from "../../src/lib/resumen/pedidos";
import { recomendacionesDeHoy } from "../../src/lib/cerebro/recomendaciones";

const perfil = (valores: Partial<Record<"esperan" | "sinDerivar" | "citasHoy" | "propuestas" | "alertas", number | null>>) => ({
  slug: "juridico" as const,
  nombre: "Jurídico",
  cifras: armarCifras("juridico", { esperan: 0, sinDerivar: 0, citasHoy: 0, propuestas: 0, alertas: 0, ...valores }),
});

test("el pedido de una fila lleva la cifra y pide confirmación", () => {
  const ps = [perfil({ esperan: 3 })];
  const f = filasParaHoy(ps, 5)[0];
  const t = pedidoDeFila(f, ps);
  assert.match(t, /3/);
  assert.match(t, /no ejecutes nada hasta que yo te lo confirme/);
  assert.ok(urlAsistente(t).startsWith("/asistente?pedido="));
});

test("el total pendiente es null si falta un dato", () => {
  assert.equal(totalPendiente([perfil({ esperan: 2, alertas: 1 })]), 3);
  assert.equal(totalPendiente([perfil({ esperan: null })]), null);
});

test("sin datos de la semana todo queda sin dato", () => {
  const c = comparacionSemanal(null);
  assert.ok(c.every((x) => x.actual === null && x.variacion.flecha === "sin_dato"));
});

test("las recomendaciones son hasta tres y piden confirmación", () => {
  const r = recomendacionesDeHoy(3);
  assert.ok(r.length > 0 && r.length <= 3);
  assert.ok(r.every((x) => /confirme/.test(x.pedido)));
});
