import test from "node:test";
import assert from "node:assert/strict";
import { armarCifras, filasParaHoy, textoCifra, cifrasSinLeer, type PerfilResumen } from "../../src/lib/resumen/filas";

const p = (slug: any, nombre: string, esperan: number | null, sinDerivar = 0): PerfilResumen => ({ slug, nombre, cifras: armarCifras(slug, { esperan, sinDerivar, citasHoy: 0, propuestas: 0, alertas: null }) });

test("resumen: «—» para lo que no se pudo leer, nunca 0", () => {
  assert.equal(textoCifra(null), "—");
  assert.equal(textoCifra(0), "0");
  assert.equal(cifrasSinLeer([p("juridico", "Jurídico", null)]), 2);
});

test("resumen: Para hacer hoy ordena por urgencia, ignora ceros y nulos y corta en 5", () => {
  const f = filasParaHoy([p("juridico", "Jurídico", 3, 2), p("marketing", "Marketing", null, 4), p("agencia_0km", "Autos 0 km", 1, 1), p("coberturas_medicas", "Coberturas médicas", 0, 0)]);
  assert.equal(f.length, 5);
  assert.equal(f[0].texto, "Responder a 1 persona");
  assert.ok(f.every((x) => !x.texto.includes("0 ")));
  assert.ok(f.every((x) => x.slug !== "coberturas_medicas"));
});

test("resumen: enlaces por perfil sin cruzar rubros", () => {
  const j = armarCifras("juridico", { esperan: 1, sinDerivar: 1, citasHoy: 1, propuestas: 1, alertas: 1 });
  const m = armarCifras("marketing", { esperan: 1, sinDerivar: 1, citasHoy: 1, propuestas: 1, alertas: 1 });
  assert.equal(j.find((c) => c.clave === "citasHoy")!.href, "/agenda");
  assert.equal(m.find((c) => c.clave === "citasHoy")!.href, "/panel/marketing/agenda");
  assert.ok(m.every((c) => c.href.includes("marketing")));
});
