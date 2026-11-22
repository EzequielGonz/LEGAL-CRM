import test from "node:test";
import assert from "node:assert/strict";
import { claveDeFila, claveDia, filtrarFilas, haceCuanto, nivelDeUrgencia, nombreCorto } from "../../src/lib/resumen/lista-reglas";
import { armarCifras, filasParaHoy, type PerfilResumen } from "../../src/lib/resumen/filas";
import { pedidoDeCifra } from "../../src/lib/resumen/pedidos";

const p = (slug: any, nombre: string, esperan: number, sinDerivar = 0): PerfilResumen => ({ slug, nombre, cifras: armarCifras(slug, { esperan, sinDerivar, citasHoy: 1, propuestas: 2, alertas: 0 }) });

test("nombre corto: primer nombre y una inicial, sin teléfonos ni apellidos completos", () => {
  assert.equal(nombreCorto("MARÍA FERNANDA lópez García"), "María G.");
  assert.equal(nombreCorto("juan"), "Juan");
  assert.equal(nombreCorto(null), "Sin nombre");
  assert.equal(nombreCorto("+54 9 11 5555 1234"), "Sin nombre");
});

test("hace cuánto", () => {
  const ahora = new Date("2026-11-22T12:00:00Z");
  assert.equal(haceCuanto("2026-11-22T09:00:00Z", ahora), "hace 3 h");
  assert.equal(haceCuanto("2026-11-20T12:00:00Z", ahora), "hace 2 días");
  assert.equal(haceCuanto("nada", ahora), null);
});

test("filtros: por perfil no mezcla rubros y por urgencia agrupa", () => {
  const filas = filasParaHoy([p("juridico", "Jurídico", 3, 2), p("marketing", "Marketing", 1, 1)], 20);
  const soloMk = filtrarFilas(filas, { slug: "marketing", nivel: "todos" });
  assert.ok(soloMk.length > 0 && soloMk.every((f) => f.slug === "marketing"));
  const urg = filtrarFilas(filas, { slug: "todos", nivel: "urgente" });
  assert.ok(urg.every((f) => nivelDeUrgencia(f.urgencia) === "urgente"));
  assert.equal(filtrarFilas(filas, { slug: "todos", nivel: "todos" }, new Set([filas[0].clave])).length, filas.length - 1);
  assert.equal(claveDeFila(filas[0]), "esperan");
});

test("día argentino y pedido por cifra", () => {
  assert.equal(claveDia(new Date("2026-11-22T02:00:00Z")), "2026-11-21");
  assert.match(pedidoDeCifra("Jurídico", "esperan", 3), /3 esperando respuesta.*no ejecutes nada/);
});

import { esPantallaMas } from "../../src/lib/mas-pantallas";
test("pantallas de Más: Bot, Redes, Ajustes, Seguimiento, Bandeja; no Contactos ni Citas", () => {
  assert.equal(esPantallaMas("mas", "bot", "Bot IA", "/agentes"), true);
  assert.equal(esPantallaMas("mas", "redes", "Accesos", "/redes/accesos"), true);
  assert.equal(esPantallaMas("mas", "contactos", "Seguimiento", "/seguimiento"), true);
  assert.equal(esPantallaMas("mas", "contactos", "Etapas", "/contactos"), false);
  assert.equal(esPantallaMas("mas", "contactos", "Citas", "/agenda"), false);
  assert.equal(esPantallaMas("trabajo", "inicio", "Resumen", "/hoy"), false);
  assert.equal(esPantallaMas("trabajo", "conversaciones", "Descartados", "/descartados"), true);
  assert.equal(esPantallaMas("trabajo", "conversaciones", "Activos", "/bandeja"), true);
});
