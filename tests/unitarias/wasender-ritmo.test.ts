import { test } from "node:test";
import assert from "node:assert/strict";
import {
  desfaseEnElMinuto,
  diaDeCalentamiento,
  esperaIrregular,
  limiteDiarioEfectivo,
  motivoDeFreno,
  primerNombre,
  textosDistintos,
  topeDeCalentamiento,
} from "@/lib/wasender/ritmo";

const AHORA = new Date("2026-11-12T15:00:00Z");

test("calentamiento: el día se cuenta desde 1 y sin fecha vale el primero", () => {
  assert.equal(diaDeCalentamiento("2026-11-12T10:00:00Z", AHORA), 1);
  assert.equal(diaDeCalentamiento("2026-11-09T15:00:00Z", AHORA), 4);
  assert.equal(diaDeCalentamiento(null, AHORA), 1);
  assert.equal(diaDeCalentamiento("no es fecha", AHORA), 1);
});

test("calentamiento: sube de a escalones", () => {
  assert.equal(topeDeCalentamiento(1), 20);
  assert.equal(topeDeCalentamiento(3), 20);
  assert.equal(topeDeCalentamiento(4), 40);
  assert.equal(topeDeCalentamiento(8), 80);
  assert.equal(topeDeCalentamiento(15), 150);
  assert.equal(topeDeCalentamiento(60), 250);
});

test("límite efectivo: gana el menor y el calentamiento nunca sube el elegido", () => {
  const nueva = limiteDiarioEfectivo({ limiteDiario: 60, calentamientoDesde: "2026-11-12T10:00:00Z" }, AHORA);
  assert.deepEqual(nueva, { limite: 20, dia: 1, porCalentamiento: true });
  const madura = limiteDiarioEfectivo({ limiteDiario: 60, calentamientoDesde: "2026-10-01T10:00:00Z" }, AHORA);
  assert.equal(madura.limite, 60);
  assert.equal(madura.porCalentamiento, false);
  const sinLimite = limiteDiarioEfectivo({ limiteDiario: null, calentamientoDesde: "2026-10-01T10:00:00Z" }, AHORA);
  assert.equal(sinLimite.limite, 250);
});

test("variantes: cuenta textos distintos sin mayúsculas ni espacios de más", () => {
  assert.equal(textosDistintos("Hola", ["hola ", "HOLA", "Buenas"]), 2);
  assert.equal(textosDistintos("A", ["B", "C", "D"]), 4);
  assert.equal(textosDistintos("A", []), 1);
});

test("primer nombre: uno solo, con mayúscula, y vacío si no parece un nombre", () => {
  assert.equal(primerNombre("JUAN CARLOS PEREZ"), "Juan");
  assert.equal(primerNombre("  maría del carmen"), "María");
  assert.equal(primerNombre("Pérez, Juan"), "Juan");
  assert.equal(primerNombre("Taller Mecánico Sur"), "");
  assert.equal(primerNombre("5491100000000"), "");
  assert.equal(primerNombre("J"), "");
  assert.equal(primerNombre(null), "");
});

test("espera irregular: dentro del rango y, a veces, una pausa larga", () => {
  const fijo = (valores: number[]) => {
    let i = 0;
    return () => valores[i++ % valores.length];
  };
  assert.equal(esperaIrregular(50, 200, fijo([0, 0.5])), 50);
  assert.equal(esperaIrregular(50, 200, fijo([0.999, 0.5])), 200);
  // Pausa larga: base 50, multiplicador 2 + 0.5 * 2 = 3.
  assert.equal(esperaIrregular(50, 200, fijo([0, 0.05, 0.5])), 150);
  // Rango invertido o inválido no rompe.
  assert.equal(esperaIrregular(200, 50, fijo([0, 0.5])), 50);
  assert.ok(esperaIrregular(0, 0, fijo([0, 0.5])) >= 1);
});

test("desfase en el minuto: entre 0 y el máximo", () => {
  assert.equal(desfaseEnElMinuto(() => 0), 0);
  assert.equal(desfaseEnElMinuto(() => 0.999), 35);
});

test("freno: necesita muestra y salta con muchos fallos o sin entregar", () => {
  assert.equal(motivoDeFreno({ enviados: 5, fallidos: 5, sinEntregar: 0 }), null);
  assert.equal(motivoDeFreno({ enviados: 20, fallidos: 2, sinEntregar: 3 }), null);
  assert.match(motivoDeFreno({ enviados: 20, fallidos: 6, sinEntregar: 0 }) ?? "", /fallaron/);
  assert.match(motivoDeFreno({ enviados: 20, fallidos: 2, sinEntregar: 9 }) ?? "", /no se entregaron/);
});
