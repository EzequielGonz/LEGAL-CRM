import { test } from "node:test";
import assert from "node:assert/strict";
import { agruparOrigenes, esPeriodoResultado, esVistaResultado, fuenteDe, origenEnPalabras, quienLoHizo, rangoResultado } from "@/lib/resultados";

test("origen: manda la campaña, después la base, después cómo llegó", () => {
  assert.equal(origenEnPalabras({ campana: "Graves", base: "Base A", fuente: "base_de_datos" }), "Campaña «Graves»");
  assert.equal(origenEnPalabras({ base: "Base A", fuente: "base_de_datos" }), "Base «Base A»");
  assert.equal(origenEnPalabras({ fuente: "organico_whatsapp" }), "Escribió por su cuenta");
  assert.equal(origenEnPalabras({ fuente: "google_maps" }), "Negocios de Google Maps");
  assert.equal(origenEnPalabras({ fuente: "formulario_web", detalleFuente: "landing vita" }), "Formulario web · landing vita");
  assert.equal(origenEnPalabras({ fuente: "no_informada" }), "Sin origen registrado");
  assert.equal(origenEnPalabras({}), "Sin origen registrado");
});

test("fuente: la primera registrada vale salvo que no diga nada", () => {
  assert.equal(fuenteDe({ first_source: "no_informada", origin_source: "organico_whatsapp" }), "organico_whatsapp");
  assert.equal(fuenteDe({ first_source: "base_importada", origin_source: "base_de_datos" }), "base_importada");
  assert.equal(fuenteDe({ first_source: null, origin_source: "google_maps" }), "google_maps");
});

test("orígenes: agrupados de mayor a menor", () => {
  assert.deepEqual(agruparOrigenes(["B", "A", "B", "C", "B", "A"]), [
    { nombre: "B", cantidad: 3 },
    { nombre: "A", cantidad: 2 },
    { nombre: "C", cantidad: 1 },
  ]);
});

test("quién lo hizo: en palabras", () => {
  assert.equal(quienLoHizo("ia"), "el bot");
  assert.equal(quienLoHizo("operador"), "una persona del equipo");
  assert.equal(quienLoHizo(null), null);
});

test("vistas y períodos: solo los conocidos; «todo» no tiene límite", () => {
  assert.ok(esVistaResultado("derivados"));
  assert.ok(!esVistaResultado("borrar"));
  assert.ok(esPeriodoResultado("todo"));
  assert.ok(!esPeriodoResultado("ayer"));
  assert.deepEqual(rangoResultado("todo"), { desde: null, hasta: null });
  const r = rangoResultado("semana", new Date("2026-11-13T15:00:00Z"));
  assert.ok(r.desde && r.hasta && r.desde < r.hasta);
});
