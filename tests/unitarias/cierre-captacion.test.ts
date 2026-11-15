import { test } from "node:test";
import assert from "node:assert/strict";
import { cierreDeReserva, esCierreValido, instruccionCierre, pedidoDeCierre, primerNombre } from "../../src/lib/agentes/cierre-captacion";
import { validarTextoSalida } from "../../src/lib/agentes/contrato";
import { GUIA_CAPTACION_Y_CIERRE } from "../../src/lib/agentes/guia-cierre";

const AREAS = ["civil", "penal", "coberturas_medicas", "agencia_0km", "marketing"] as const;

test("el cierre de reserva de cada rubro agradece, no pregunta y pasa el validador", () => {
  for (const a of AREAS) {
    for (const nombre of ["persona ficticia", null, "Taller El Ejemplo SRL", "123"]) {
      const t = cierreDeReserva(a, nombre);
      assert.ok(esCierreValido(t), `${a}: ${t}`);
      assert.ok(validarTextoSalida(t).ok, `${a}: ${JSON.stringify(validarTextoSalida(t))}`);
      assert.match(t, /gracias/i);
      assert.match(t, /se va a comunicar con vos/);
      assert.ok(!t.includes("{nombre}"));
    }
  }
});

test("el cierre se adapta al rubro", () => {
  assert.match(cierreDeReserva("civil", "persona ficticia"), /^¡Muchas gracias, Persona!.*abogado del estudio/);
  assert.match(cierreDeReserva("coberturas_medicas"), /asesor.*cobertura/);
  assert.match(cierreDeReserva("agencia_0km"), /asesor comercial.*propuesta por escrito/);
  assert.match(cierreDeReserva("marketing", "Taller Ejemplo"), /^¡Muchas gracias! Ya le pasé los detalles al equipo/);
  assert.match(instruccionCierre("penal"), /abogado del estudio/);
  assert.match(instruccionCierre("agencia_0km"), /asesor comercial/);
  assert.match(instruccionCierre("coberturas_medicas"), /ÚLTIMA respuesta.*Sin preguntas/);
  assert.match(pedidoDeCierre("marketing"), /no sirve como cierre/);
});

test("un texto con pregunta o vacío no sirve como cierre", () => {
  assert.equal(esCierreValido("¿Te queda mejor a la mañana o a la tarde?"), false);
  assert.equal(esCierreValido("Gracias. La cobertura sería solo para vos?"), false);
  assert.equal(esCierreValido(""), false);
  assert.equal(esCierreValido("¡Gracias! Un asesor se va a comunicar con vos. ¡Que tengas buen día!"), true);
});

test("primer nombre presentable", () => {
  assert.equal(primerNombre("PERSONA FICTICIA"), "Persona");
  assert.equal(primerNombre("José Ejemplo"), "José");
  assert.equal(primerNombre("+54 11"), null);
  assert.equal(primerNombre(""), null);
});

test("la guía común pide cerrar sin preguntas después de captar", () => {
  assert.match(GUIA_CAPTACION_Y_CIERRE, /salvo el cierre después de captar/);
  assert.match(GUIA_CAPTACION_Y_CIERRE, /despedite, sin preguntas/);
});
