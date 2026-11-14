import { test } from "node:test";
import assert from "node:assert/strict";
import {
  azarConSemilla,
  cortarTanda,
  cupoDelDia,
  elegirTextoAlAzar,
  estadoDelPlan,
  fechaArgentina,
  instanteDelDia,
  minutosArgentina,
  parecido,
  pausaEntreTandas,
  planDelDia,
  rangoDeTanda,
  variantesMuyParecidas,
} from "@/lib/wasender/ritmo-humano";

const HORARIO = { inicio: 8, fin: 21 };

test("azar con semilla: misma semilla, misma secuencia; otra semilla, otra", () => {
  const a = azarConSemilla("x");
  const b = azarConSemilla("x");
  const c = azarConSemilla("y");
  const sa = [a(), a(), a()];
  assert.deepEqual(sa, [b(), b(), b()]);
  assert.notDeepEqual(sa, [c(), c(), c()]);
  for (const v of sa) assert.ok(v >= 0 && v < 1);
});

test("tandas: largo variable dentro del rango, nunca fijo", () => {
  assert.deepEqual(rangoDeTanda(10), { min: 5, max: 16 });
  assert.equal(cortarTanda(4, 10, () => 0), false, "antes del mínimo no corta");
  assert.equal(cortarTanda(16, 10, () => 0.99), true, "en el máximo corta siempre");
  const azar = azarConSemilla("tandas");
  const largos = new Set<number>();
  for (let t = 0; t < 200; t++) {
    let n = 0;
    do n++;
    while (!cortarTanda(n, 10, azar));
    assert.ok(n >= 5 && n <= 16);
    largos.add(n);
  }
  assert.ok(largos.size >= 8, `se vieron ${largos.size} largos distintos`);
});

test("pausa entre tandas: varía, nunca menos de un minuto", () => {
  const azar = azarConSemilla("pausas");
  const valores = Array.from({ length: 100 }, () => pausaEntreTandas(600, azar));
  assert.ok(Math.min(...valores) >= 360);
  assert.ok(Math.max(...valores) <= 600 * 2 * 1.8 + 1);
  assert.ok(new Set(valores).size > 80);
  assert.equal(pausaEntreTandas(0, () => 0), 60);
});

test("plan del día: el mismo para la misma línea y fecha; cambia de un día a otro", () => {
  const p1 = planDelDia("linea-1", "2026-11-16", HORARIO);
  assert.deepEqual(p1, planDelDia("linea-1", "2026-11-16", HORARIO));
  const arranques = new Set<number>();
  const cierres = new Set<number>();
  for (let d = 16; d <= 28; d++) {
    const p = planDelDia("linea-1", `2026-11-${d}`, HORARIO);
    arranques.add(p.arranque);
    cierres.add(p.cierre);
  }
  assert.ok(arranques.size >= 8, "arranca a horas distintas");
  assert.ok(cierres.size >= 8, "cierra a horas distintas");
});

test("plan del día: nunca sale del horario permitido y nunca arranca en punto", () => {
  for (let i = 0; i < 300; i++) {
    const p = planDelDia(`l${i}`, "2026-11-17", HORARIO);
    assert.ok(p.arranque > 8 * 60 && p.arranque <= 8 * 60 + 100);
    assert.ok(p.cierre < 21 * 60 && p.cierre >= 21 * 60 - 85);
    assert.ok(p.factorCupo >= 0.72 && p.factorCupo <= 1);
    assert.ok(p.factorEspera >= 0.8 && p.factorEspera <= 1.35);
    for (const c of p.cortes) {
      assert.ok(c.desde > p.arranque && c.hasta < p.cierre, "las pausas quedan dentro del día");
      assert.ok(c.hasta > c.desde);
    }
    for (let k = 1; k < p.cortes.length; k++) assert.ok(p.cortes[k].desde >= p.cortes[k - 1].hasta, "las pausas no se pisan");
  }
});

test("plan del día: los sábados son más tranquilos y hay días con pausa de mediodía", () => {
  let mediodia = 0;
  for (let i = 0; i < 200; i++) {
    const sab = planDelDia(`l${i}`, "2026-11-21", HORARIO);
    assert.ok(sab.factorCupo >= 0.55 && sab.factorCupo <= 0.85);
    if (planDelDia(`l${i}`, "2026-11-18", HORARIO).cortes.some((c) => c.motivo === "mediodía")) mediodia++;
  }
  assert.ok(mediodia > 100 && mediodia < 190, `mediodía en ${mediodia} de 200`);
});

test("plan del día: una franja corta achica los corrimientos", () => {
  const p = planDelDia("l", "2026-11-17", { inicio: 10, fin: 12 });
  assert.ok(p.arranque >= 600 && p.cierre <= 720 && p.arranque <= p.cierre);
});

test("estado del plan: antes, durante una pausa, después y en horario", () => {
  const plan = { arranque: 500, cierre: 1200, factorCupo: 1, factorEspera: 1, cortes: [{ desde: 760, hasta: 820, motivo: "mediodía" as const }] };
  assert.deepEqual(estadoDelPlan(plan, 600), { puede: true });
  const antes = estadoDelPlan(plan, 490);
  assert.equal(antes.puede, false);
  if (!antes.puede) assert.equal(antes.reanuda, 500);
  const corte = estadoDelPlan(plan, 770);
  assert.equal(corte.puede, false);
  if (!corte.puede) {
    assert.equal(corte.motivo, "corte");
    assert.equal(corte.reanuda, 820);
    assert.match(corte.detalle, /mediodía hasta las 13:40/);
  }
  const despues = estadoDelPlan(plan, 1200);
  assert.equal(despues.puede, false);
  if (!despues.puede) assert.equal(despues.reanuda, null);
});

test("hora argentina: fecha, minutos e instante del día", () => {
  const ahora = new Date("2026-11-17T02:30:00Z"); // 16/11 23:30 en Argentina
  assert.equal(fechaArgentina(ahora), "2026-11-16");
  assert.equal(minutosArgentina(ahora), 23 * 60 + 30);
  assert.equal(instanteDelDia(new Date("2026-11-17T15:00:00Z"), 8 * 60 + 47).toISOString(), "2026-11-17T11:47:00.000Z");
});

test("cupo del día: parte del límite, nunca más ni menos de uno", () => {
  assert.equal(cupoDelDia(100, 0.73), 73);
  assert.equal(cupoDelDia(20, 1), 20);
  assert.equal(cupoDelDia(1, 0.5), 1);
});

test("parecido: iguales 1, distintos cerca de 0, ignora mayúsculas, acentos y variables", () => {
  assert.equal(parecido("Hola, ¿cómo estás?", "hola como estas"), 1);
  assert.equal(parecido("Hola {{nombre}}, te escribo por tu consulta", "Hola, te escribo por tu consulta"), 1);
  assert.ok(parecido("Hola {{nombre}}, te escribo por tu consulta", "Hola Ana, te escribo por tu consulta") > 0.7);
  assert.ok(parecido("Buen día, quería saber si seguís buscando auto", "Te escribo por el seguro médico de tu familia") < 0.2);
});

test("variantes muy parecidas: marca los pares casi iguales", () => {
  const pares = variantesMuyParecidas([
    "Hola, te escribo para contarte algo sobre tu consulta del otro día",
    "Hola, te escribo para contarte algo sobre tu consulta del otro día!",
    "Buenas, ¿pudiste resolver lo del choque?",
  ]);
  assert.equal(pares.length, 1);
  assert.deepEqual([pares[0].a, pares[0].b], [0, 1]);
});

const PLANTILLAS = ["a", "b", "c", "d", "e"].map((id) => ({
  id,
  nombre: `plantilla ${id}`,
  cuerpo: `Texto principal de la plantilla ${id} con palabras propias ${id}${id}`,
  variantes: [1, 2, 3].map((n) => `Variante ${n} distinta de ${id} sobre otro tema ${id}${n} y algo más ${n}${id}`),
}));

test("elección al azar: no repite las últimas plantillas de la línea", () => {
  const recientes = [
    { plantillaId: "a", texto: "x" },
    { plantillaId: "b", texto: "y" },
    { plantillaId: "c", texto: "z" },
  ];
  const azar = azarConSemilla("eleccion");
  for (let i = 0; i < 100; i++) {
    const e = elegirTextoAlAzar(PLANTILLAS, recientes, azar)!;
    assert.ok(["d", "e"].includes(e.plantilla.id), `salió ${e.plantilla.id}`);
  }
});

test("elección al azar: no repite un texto parecido a lo enviado hace poco", () => {
  const unaSola = [PLANTILLAS[0]];
  const recientes = [{ plantillaId: "a", texto: PLANTILLAS[0].cuerpo }];
  const azar = azarConSemilla("texto");
  for (let i = 0; i < 50; i++) assert.notEqual(elegirTextoAlAzar(unaSola, recientes, azar)!.texto, PLANTILLAS[0].cuerpo);
});

test("elección al azar: reparte entre plantillas y textos, y nunca deja de elegir", () => {
  const azar = azarConSemilla("reparto");
  const vistas = new Set<string>();
  const textos = new Set<string>();
  for (let i = 0; i < 300; i++) {
    const e = elegirTextoAlAzar(PLANTILLAS, [], azar)!;
    vistas.add(e.plantilla.id);
    textos.add(e.texto);
  }
  assert.equal(vistas.size, 5);
  assert.equal(textos.size, 20);
  // Todo lo disponible ya se mandó hace poco: igual elige.
  const todo = PLANTILLAS.flatMap((p) => [p.cuerpo, ...p.variantes].map((t) => ({ plantillaId: p.id, texto: t })));
  assert.ok(elegirTextoAlAzar(PLANTILLAS, todo, azar));
  assert.equal(elegirTextoAlAzar([], [], azar), null);
});
