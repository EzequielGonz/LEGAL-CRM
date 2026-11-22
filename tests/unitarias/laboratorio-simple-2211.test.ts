import test from "node:test";
import assert from "node:assert/strict";
import { SLUGS_PERFIL } from "@/lib/marca";
import { validarRol } from "@/lib/agentes/roles-reglas";
import {
  PLANTILLAS_ROL,
  FORMULARIO_VACIO,
  cifrasDelBot,
  compararEnPalabras,
  cuerpoArchivarRol,
  cuerpoCrearRol,
  cuerpoPedirMejora,
  cuerpoRolACampana,
  deCada10,
  fichaCambio,
  formularioDePlantilla,
  metaDeAtendidas,
  validarFormularioRol,
} from "@/lib/laboratorio/vista-simple";

test("22/11 laboratorio: cifras simples y tope del anillo", () => {
  const c = cifrasDelBot({ conversaciones: 80, tasa_captacion: 25, tasa_escalado: 10 });
  assert.deepEqual(c, { atendidas: 80, captados: 20, derivados: 8, tasaCaptacion: 25, tasaDerivados: 10 });
  assert.equal(cifrasDelBot(null).atendidas, 0);
  assert.equal(metaDeAtendidas(0), 20);
  assert.equal(metaDeAtendidas(80), 100);
  assert.equal(metaDeAtendidas(5400), 6000);
});

test("22/11 laboratorio: la comparación se lee sin jerga", () => {
  assert.equal(deCada10(30), "3 de cada 10");
  assert.equal(deCada10(25), "2,5 de cada 10");
  const r = compararEnPalabras({ conversaciones: 100, tasa_captacion: 40 }, { conversaciones: 100, tasa_captacion: 20 });
  assert.equal(r.veredicto, "mejor");
  assert.match(r.frase, /nueva capta 4 de cada 10; la anterior, 2 de cada 10/);
  assert.doesNotMatch(r.frase, /v1|v2/);
  assert.equal(compararEnPalabras({ conversaciones: 5, tasa_captacion: 40 }, { conversaciones: 100, tasa_captacion: 20 }).veredicto, "pocos_datos");
  assert.equal(compararEnPalabras({ conversaciones: 50, tasa_captacion: 21 }, { conversaciones: 50, tasa_captacion: 20 }).veredicto, "igual");
  assert.equal(compararEnPalabras({ conversaciones: 50, tasa_captacion: 10 }, { conversaciones: 50, tasa_captacion: 30 }).veredicto, "peor");
});

test("22/11 laboratorio: cada rubro tiene plantillas propias y válidas para la API", () => {
  for (const r of SLUGS_PERFIL) {
    assert.ok(PLANTILLAS_ROL[r].length >= 2, r);
    for (const p of PLANTILLAS_ROL[r]) {
      const f = formularioDePlantilla(p);
      assert.deepEqual(validarFormularioRol(f), { ok: true }, p.nombre);
      const cuerpo = cuerpoCrearRol(r, f);
      assert.equal(validarRol(cuerpo).ok, true, p.nombre);
      assert.match(cuerpo.instrucciones, /No debe prometer/);
    }
  }
  const nombres = (r: (typeof SLUGS_PERFIL)[number]) => PLANTILLAS_ROL[r].map((p) => p.nombre);
  assert.ok(nombres("juridico").includes("Recepción de consultas civiles") && nombres("juridico").includes("Penal urgente") && nombres("juridico").includes("Seguimiento de documentación"));
  assert.ok(nombres("coberturas_medicas").includes("Cotizador de planes") && nombres("coberturas_medicas").includes("Afiliaciones"));
  assert.ok(nombres("agencia_0km").includes("Turno de prueba de manejo") && nombres("agencia_0km").includes("Plan de ahorro"));
  assert.ok(nombres("marketing").includes("Prospección de negocios") && nombres("marketing").includes("Agenda de reuniones"));
  const todas = new Set(SLUGS_PERFIL.flatMap(nombres));
  assert.equal(todas.size, SLUGS_PERFIL.flatMap(nombres).length, "no se repiten roles entre rubros");
});

test("22/11 laboratorio: el formulario rechaza vacío, teléfonos y correos", () => {
  assert.equal(validarFormularioRol(FORMULARIO_VACIO).ok, false);
  assert.equal(validarFormularioRol({ nombre: "Rol", paraQue: "Atender consultas sobre planes", tono: "", noPrometer: "llamar al 1122334455" }).ok, false);
  assert.equal(validarFormularioRol({ nombre: "Rol", paraQue: "Atender consultas sobre planes", tono: "", noPrometer: "" }).ok, true);
});

test("22/11 laboratorio: los cuerpos coinciden con las rutas existentes y nunca borran", () => {
  assert.deepEqual(cuerpoArchivarRol("juridico", "r1"), { perfil: "juridico", accion: "archivar", id: "r1" });
  assert.deepEqual(cuerpoRolACampana("marketing", "c1", null), { perfil: "marketing", accion: "asignar_campana", campaign_id: "c1", rol_id: "" });
  const p = cuerpoPedirMejora("Jurídico", "Penal urgente", "  que sea más corto ");
  assert.equal(p.clave, "principal");
  assert.equal(p.pedido, "[Jurídico · rol «Penal urgente»] que sea más corto");
});

test("22/11 laboratorio: detecta si la ficha cambió", () => {
  assert.equal(fichaCambio("Hola  \n\n\n\nChau", "Hola\n\nChau"), false);
  assert.equal(fichaCambio("Hola", "Hola y más"), true);
});
