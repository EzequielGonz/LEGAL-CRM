import test from "node:test";
import assert from "node:assert/strict";
import {
  cambiosDePrioridad,
  grupoDePrioridad,
  nivelDeGravedad,
  ordenarCola,
  ORDEN_DE_GRAVEDAD,
  PRIORIDAD_POR_NIVEL,
  prioridadDeEnvio,
  repartoDelCupo,
  resumenPorGravedad,
} from "@/lib/bases/gravedad";
import { computeCampaignPriority } from "@/lib/bases/priority";

// Diagnósticos de ejemplo (inventados, del estilo de las planillas de ART; sin datos de personas).
const EJ = {
  muerte: "Fallecimiento del trabajador",
  amputacion: "Amputación traumática de dedo de la mano",
  fractura: "Fractura de otro dedo de la mano",
  luxacion: "Luxación, esguince y torcedura de articulaciones del hombro",
  quemadura: "Quemadura de la muñeca y de la mano",
  traumatismo: "Traumatismo intracraneal",
  superficial: "Traumatismo superficial de la cabeza",
  contusion: "Contusión de la rodilla",
  esguince: "Esguinces y torceduras del tobillo",
};

test("22/11: el nivel de gravedad sale de lo que dice el diagnóstico", () => {
  assert.equal(nivelDeGravedad(EJ.muerte), "fallecimiento");
  assert.equal(nivelDeGravedad(EJ.amputacion), "amputacion");
  assert.equal(nivelDeGravedad(EJ.fractura), "fractura");
  assert.equal(nivelDeGravedad(EJ.luxacion), "lesion");
  assert.equal(nivelDeGravedad(EJ.quemadura), "lesion");
  assert.equal(nivelDeGravedad(EJ.traumatismo), "lesion");
  assert.equal(nivelDeGravedad(EJ.superficial), "lesion_leve");
  assert.equal(nivelDeGravedad(EJ.contusion), "lesion_leve");
  assert.equal(nivelDeGravedad(EJ.esguince), "lesion_leve");
  assert.equal(nivelDeGravedad(""), "sin_lesion");
  assert.equal(nivelDeGravedad(null, null), "sin_lesion");
  // El tipo de consulta solo no cuenta como lesión; si nombra una grave, sí sube.
  assert.equal(nivelDeGravedad(null, "accidente in itinere"), "sin_lesion");
  assert.equal(nivelDeGravedad(null, "consulta por fractura"), "fractura");
});

test("22/11: Jurídico ordena por gravedad: fallecimiento, amputación, fractura, otras lesiones, leves y el resto", () => {
  const p = [EJ.muerte, EJ.amputacion, EJ.fractura, EJ.luxacion, EJ.contusion, ""].map((t) => prioridadDeEnvio("juridico", t));
  for (let i = 1; i < p.length; i++) assert.ok(p[i - 1] < p[i], `nivel ${i - 1} antes que ${i}`);
  assert.deepEqual(
    ORDEN_DE_GRAVEDAD.map((n) => PRIORIDAD_POR_NIVEL[n]),
    [...ORDEN_DE_GRAVEDAD.map((n) => PRIORIDAD_POR_NIVEL[n])].sort((a, b) => a - b)
  );
});

test("22/11: Coberturas, Autos y Marketing quedan exactamente igual que antes", () => {
  for (const slug of ["coberturas_medicas", "agencia_0km", "marketing"] as const) {
    for (const t of [EJ.muerte, EJ.fractura, EJ.contusion, "", null]) {
      assert.equal(prioridadDeEnvio(slug, t, "tipo"), computeCampaignPriority(t, "tipo"), `${slug}: ${t}`);
    }
  }
});

test("22/11: las colas viejas siguen teniendo sentido (0 = grave, 1 = sin saber)", () => {
  // Graves nuevos antes que el 0 viejo; el 0 viejo antes que cualquier no grave; el 1 viejo junto a «otra lesión».
  assert.ok(PRIORIDAD_POR_NIVEL.fractura < 0);
  assert.ok(0 < PRIORIDAD_POR_NIVEL.lesion);
  assert.equal(PRIORIDAD_POR_NIVEL.lesion, 1);
  assert.equal(grupoDePrioridad(0), "grave");
  assert.equal(grupoDePrioridad(1), "lesionado");
  assert.equal(grupoDePrioridad(PRIORIDAD_POR_NIVEL.sin_lesion), "resto");
});

test("22/11: la cola sale primero por gravedad y, dentro de cada nivel, por orden de carga", () => {
  const cola = [
    { id: "a", prioridad: prioridadDeEnvio("juridico", EJ.contusion), encolada: 1 },
    { id: "b", prioridad: prioridadDeEnvio("juridico", ""), encolada: 2 },
    { id: "c", prioridad: prioridadDeEnvio("juridico", EJ.fractura), encolada: 3 },
    { id: "d", prioridad: prioridadDeEnvio("juridico", EJ.muerte), encolada: 4 },
    { id: "e", prioridad: prioridadDeEnvio("juridico", EJ.fractura), encolada: 0 },
    { id: "f", prioridad: prioridadDeEnvio("juridico", EJ.luxacion), encolada: 5 },
  ];
  assert.deepEqual(
    ordenarCola(cola).map((f) => f.id),
    ["d", "e", "c", "f", "a", "b"]
  );
  // No modifica la lista original.
  assert.equal(cola[0].id, "a");
});

test("22/11: cupo del día: la mayor parte va a los lesionados y, cubiertos, sigue el resto", () => {
  const graves = Array(3).fill(PRIORIDAD_POR_NIVEL.fractura);
  const lesionados = [...Array(4).fill(PRIORIDAD_POR_NIVEL.lesion), ...Array(3).fill(PRIORIDAD_POR_NIVEL.lesion_leve)];
  const resto = Array(40).fill(PRIORIDAD_POR_NIVEL.sin_lesion);
  const pendientes = [...resto, ...lesionados, ...graves];
  // Con cupo de 8: todo a graves y lesionados.
  assert.deepEqual(repartoDelCupo(pendientes, 8), { grave: 3, lesionado: 5, resto: 0 });
  // Con cupo de 20: graves y lesionados completos, el resto no queda afuera.
  assert.deepEqual(repartoDelCupo(pendientes, 20), { grave: 3, lesionado: 7, resto: 10 });
  // Sin lesionados en la cola, el cupo entero va al resto.
  assert.deepEqual(repartoDelCupo(resto, 15), { grave: 0, lesionado: 0, resto: 15 });
  assert.deepEqual(repartoDelCupo(pendientes, 0), { grave: 0, lesionado: 0, resto: 0 });
  assert.deepEqual(resumenPorGravedad(pendientes), { grave: 3, lesionado: 7, resto: 40 });
});

test("22/11: reordenar lo que falta enviar toca solo pendientes y solo lo que cambia (nunca un reenvío)", () => {
  const cambios = cambiosDePrioridad([
    { id: "1", status: "pendiente", prioridad: 1, diagnostico: EJ.fractura },
    { id: "2", status: "pendiente", prioridad: 1, diagnostico: "" },
    { id: "3", status: "pendiente", prioridad: PRIORIDAD_POR_NIVEL.lesion, diagnostico: EJ.quemadura },
    { id: "4", status: "entregado", prioridad: 1, diagnostico: EJ.muerte },
    { id: "5", status: "enviando", prioridad: 1, diagnostico: EJ.muerte },
    { id: "6", status: "revisar", prioridad: 1, diagnostico: EJ.amputacion },
    { id: "7", status: "pendiente", prioridad: 0, diagnostico: EJ.amputacion },
  ]);
  assert.deepEqual(Object.fromEntries(cambios), {
    [PRIORIDAD_POR_NIVEL.fractura]: ["1"],
    [PRIORIDAD_POR_NIVEL.sin_lesion]: ["2"],
    [PRIORIDAD_POR_NIVEL.amputacion]: ["7"],
  });
});
