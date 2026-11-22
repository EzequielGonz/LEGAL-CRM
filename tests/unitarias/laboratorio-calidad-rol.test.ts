import { test } from "node:test";
import assert from "node:assert/strict";
import { EJEMPLOS_POR_RUBRO, enlaceMejorarRol, pedidoMejorarRol, revisarRol } from "../../src/lib/laboratorio/calidad-rol";
import { SLUGS_PERFIL } from "../../src/lib/marca";

const completo = {
  nombre: "Primera consulta",
  objetivo: "Saludá con calidez y presentate. Pedí nombre, zona y motivo de la consulta.",
  tono: "cercano",
  instrucciones: "Si es urgente, derivá a una persona del equipo. No debe prometer resultados ni plazos.",
};

test("rol completo cumple los cuatro puntos", () => {
  const r = revisarRol(completo);
  assert.equal(r.cumplidos, 4);
  assert.equal(r.faltan.length, 0);
});

test("rol vacío muestra qué falta", () => {
  const r = revisarRol({ nombre: "Rol" });
  assert.equal(r.cumplidos, 0);
  assert.deepEqual(r.faltan.map((f) => f.clave), ["saludo", "datos", "persona", "promesas"]);
  assert.ok(r.faltan.every((f) => f.falta.length > 10));
});

test("prometer resultados no tilda el punto aunque diga no prometer", () => {
  const r = revisarRol({ ...completo, instrucciones: "No debe prometer plazos. Te garantizo que ganamos seguro." });
  assert.equal(r.items.find((i) => i.clave === "promesas")?.ok, false);
});

test("hay ejemplos para los cuatro rubros, sin datos personales", () => {
  for (const s of SLUGS_PERFIL) {
    const e = EJEMPLOS_POR_RUBRO[s];
    assert.ok(e.length >= 3 && e.length <= 4);
    for (const t of e) assert.ok(!/\d{6,}|@/.test(t));
  }
});

test("el pedido para Jarvis pide confirmación y cabe en 1000 letras", () => {
  const p = pedidoMejorarRol("Jurídico", { nombre: "x".repeat(2000) });
  assert.ok(p.length <= 1000);
  const q = pedidoMejorarRol("Jurídico", { nombre: "Primera consulta" });
  assert.match(q, /confirmación/);
  assert.match(q, /Primera consulta/);
  assert.match(enlaceMejorarRol("Jurídico", { nombre: "A" }), /^\/asistente\?pedido=/);
});
