import test from "node:test";
import assert from "node:assert/strict";
import { etiquetaDeGravedad, gravedadDeFila, prioridadParaPerfil } from "@/lib/bases/gravedad";
import { computeCampaignPriority } from "@/lib/bases/priority";

test("22/11: la gravedad sale de lo que dice la fila, no del nombre de la base", () => {
  assert.equal(gravedadDeFila("Fractura de otro dedo de la mano"), "fractura");
  assert.equal(gravedadDeFila("Amputación traumática de dedo"), "amputacion");
  assert.equal(gravedadDeFila("Fallecimiento del trabajador"), "fallecimiento");
  assert.equal(gravedadDeFila("Contusión de la rodilla", "accidente in itinere"), null);
  assert.equal(gravedadDeFila(null, undefined, ""), null);
});

test("22/11: la etiqueta solo se muestra en Jurídico", () => {
  assert.equal(etiquetaDeGravedad("juridico", "Fractura de muñeca"), "Fractura");
  for (const s of ["coberturas_medicas", "agencia_0km", "marketing"] as const) assert.equal(etiquetaDeGravedad(s, "Fractura de muñeca"), null);
});

test("22/11: la prioridad de Jurídico coincide con la de hoy; fuera de Jurídico es la normal", () => {
  for (const t of ["Fractura de muñeca", "Contusión", "Amputación", ""]) {
    assert.equal(prioridadParaPerfil("juridico", t), computeCampaignPriority(t));
  }
  assert.equal(prioridadParaPerfil("marketing", "Fractura de muñeca"), 1);
  assert.equal(prioridadParaPerfil("agencia_0km", "Amputación"), 1);
});

test("22/11: las tres gravedades quedan al mismo nivel de prioridad", () => {
  const p = ["fractura expuesta", "muerte del trabajador", "amputación de pierna"].map((t) => prioridadParaPerfil("juridico", t));
  assert.deepEqual(p, [0, 0, 0]);
});
