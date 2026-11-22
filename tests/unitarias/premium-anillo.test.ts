import test from "node:test";
import assert from "node:assert/strict";
import {
  TAMANOS_ANILLO,
  desplazamiento,
  etiquetaAnillo,
  formatoNumero,
  fraccion,
  geometriaAnillo,
  geometriaMedidor,
  llegoALaMeta,
  porcentaje,
} from "@/lib/premium/anillo";

test("premium · fracción y porcentaje: se acotan entre 0 y 1 y toleran metas inválidas", () => {
  assert.equal(fraccion(12, 20), 0.6);
  assert.equal(porcentaje(12, 20), 60);
  assert.equal(fraccion(25, 20), 1);
  assert.equal(fraccion(0, 20), 0);
  assert.equal(fraccion(-3, 20), 0);
  assert.equal(fraccion(5, 0), 0);
  assert.equal(fraccion(5, -1), 0);
  assert.equal(fraccion(Number.NaN, 10), 0);
  assert.equal(fraccion(5, Number.POSITIVE_INFINITY), 0);
  assert.equal(porcentaje(1, 3), 33);
  assert.equal(porcentaje(2, 3), 67);
});

test("premium · llegoALaMeta: solo con meta válida y valor igual o mayor", () => {
  assert.equal(llegoALaMeta(20, 20), true);
  assert.equal(llegoALaMeta(21, 20), true);
  assert.equal(llegoALaMeta(19, 20), false);
  assert.equal(llegoALaMeta(5, 0), false);
});

test("premium · geometría del anillo: las tres medidas del brief", () => {
  const g = geometriaAnillo(TAMANOS_ANILLO.grande.diametro, TAMANOS_ANILLO.grande.trazo);
  assert.equal(g.radio, 74);
  assert.equal(g.centro, 80);
  assert.equal(g.largo, Math.round(2 * Math.PI * 74 * 1000) / 1000);
  assert.equal(TAMANOS_ANILLO.grande.cifra, 48);
  assert.equal(TAMANOS_ANILLO.grande.ms, 900);
  const chico = geometriaAnillo(64, 6);
  assert.equal(chico.radio, 29);
  assert.equal(TAMANOS_ANILLO.chico.ms, 600);
  assert.equal(TAMANOS_ANILLO.medio.diametro, 120);
  // El trazo entra entero en el SVG: radio + trazo/2 <= centro.
  for (const t of Object.values(TAMANOS_ANILLO)) {
    const x = geometriaAnillo(t.diametro, t.trazo);
    assert.ok(x.radio + t.trazo / 2 <= x.centro + 1e-9);
  }
});

test("premium · desplazamiento: lleno es 0, vacío es el largo, la mitad es la mitad", () => {
  const { largo } = geometriaAnillo(160, 12);
  assert.equal(desplazamiento(largo, 1), 0);
  assert.equal(desplazamiento(largo, 0), largo);
  assert.equal(desplazamiento(largo, 0.5), Math.round((largo / 2) * 1000) / 1000);
  assert.equal(desplazamiento(largo, 2), 0);
  assert.equal(desplazamiento(largo, -1), largo);
});

test("premium · medidor: el arco es media circunferencia y el trazado queda dentro del ancho", () => {
  const m = geometriaMedidor(200, 12);
  assert.equal(m.radio, 94);
  assert.equal(m.cx, 100);
  assert.equal(m.largo, Math.round(Math.PI * 94 * 1000) / 1000);
  assert.equal(m.alto, 106 + 0);
  assert.match(m.trazado, /^M 6 100 A 94 94 0 0 1 194 100$/);
});

test("premium · formatoNumero: punto de miles argentino sin depender de ICU", () => {
  assert.equal(formatoNumero(0), "0");
  assert.equal(formatoNumero(999), "999");
  assert.equal(formatoNumero(1234), "1.234");
  assert.equal(formatoNumero(1234567), "1.234.567");
  assert.equal(formatoNumero(12.6), "13");
  assert.equal(formatoNumero(-1500), "-1.500");
  assert.equal(formatoNumero(Number.NaN), "0");
});

test("premium · etiqueta para el lector de pantalla", () => {
  assert.equal(etiquetaAnillo({ nombre: "Jurídico", valor: 12, meta: 20, unidad: "consultas hoy" }), "Jurídico: 12 de 20 consultas hoy");
  assert.equal(etiquetaAnillo({ nombre: "Afiliaciones", valor: 72, meta: 100, sufijo: "%", unidad: "cargadas" }), "Afiliaciones: 72% cargadas");
  assert.equal(etiquetaAnillo({ nombre: "Autos 0 km", valor: 1234 }), "Autos 0 km: 1.234");
});
