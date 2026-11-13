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

import { saludDeLineas } from "@/lib/wasender/salud";

test("salud: una línea caída frena la operación; apagada es para revisar; conectada muestra su tope", () => {
  const base = { rubro_id: "11111111-1111-1111-1111-111111111111", limite_diario: 60, calentamiento_desde: "2026-11-12T10:00:00Z", estado_at: "2026-11-11T17:29:00Z" };
  const items = saludDeLineas(
    [
      { ...base, id: "a", nombre: "Chip A", estado: "logged_out", habilitada: false },
      { ...base, id: "b", nombre: "Chip B", estado: "connected", habilitada: false },
      { ...base, id: "c", nombre: "Chip C", estado: "connected", habilitada: true },
    ],
    { a: 1 },
    AHORA
  );
  assert.deepEqual(items.map((i) => i.estado), ["rojo", "amarillo", "verde"]);
  assert.match(items[0].detalle, /1 campaña\(s\) quedaron en pausa/);
  assert.equal(items[0].href, "/wasender?perfil=juridico");
  assert.match(items[2].detalle, /Día 1 de calentamiento: hasta 20/);
});

import { elegirPlantillaDeInicio, plantillasDeInicioUsables, textoDeCampana } from "@/lib/wasender/campanas";

test("rotación: solo plantillas activas, sin archivar, sin «[revisar]» y con textos suficientes", () => {
  const base = { id: "x", rubro_id: "r", activa: true, archivada_at: null };
  const cuatro = ["B", "C", "D"];
  const usables = plantillasDeInicioUsables([
    { ...base, nombre: "b_ok", cuerpo: "A", variantes: cuatro },
    { ...base, nombre: "a_ok", cuerpo: "A", variantes: cuatro },
    { ...base, nombre: "inactiva", cuerpo: "A", variantes: cuatro, activa: false },
    { ...base, nombre: "archivada", cuerpo: "A", variantes: cuatro, archivada_at: "2026-11-01" },
    { ...base, nombre: "pocos", cuerpo: "A", variantes: ["B"] },
    { ...base, nombre: "revisar", cuerpo: "Hola [revisar 1]", variantes: cuatro },
  ]);
  assert.deepEqual(usables.map((p) => p.nombre), ["a_ok", "b_ok"]);
});

test("rotación: cada persona recibe siempre la misma plantilla y se reparten entre todas", () => {
  const rotacion = Array.from({ length: 10 }, (_, i) => ({ nombre: `p${i}` }));
  assert.equal(elegirPlantillaDeInicio([], "x"), null);
  assert.equal(elegirPlantillaDeInicio(rotacion, "contacto-1")?.nombre, elegirPlantillaDeInicio(rotacion, "contacto-1")?.nombre);
  const usadas = new Set<string>();
  const cuenta = new Map<string, number>();
  for (let i = 0; i < 2000; i++) {
    const n = elegirPlantillaDeInicio(rotacion, `c0ffee00-0000-4000-8000-${String(i).padStart(12, "0")}`)!.nombre;
    usadas.add(n);
    cuenta.set(n, (cuenta.get(n) ?? 0) + 1);
  }
  assert.equal(usadas.size, 10);
  for (const [, n] of cuenta) assert.ok(n > 120 && n < 290, `reparto desparejo: ${n}`);
});

test("rotación: con 10 plantillas de 41 textos, 400 personas reciben más de 200 mensajes distintos", () => {
  const rotacion = Array.from({ length: 10 }, (_, p) => ({ nombre: `p${p}`, cuerpo: `P${p} base {{nombre}}`, variantes: Array.from({ length: 40 }, (_, v) => `P${p} v${v} {{nombre}}`) }));
  const textos = new Set<string>();
  for (let i = 0; i < 400; i++) {
    const id = `c0ffee00-0000-4000-8000-${String(i * 7919).padStart(12, "0")}`;
    const p = elegirPlantillaDeInicio(rotacion, id)!;
    textos.add(textoDeCampana(p, { nombre: "", asesor: "", marca: "" }, id));
  }
  assert.ok(textos.size > 200, `solo ${textos.size} textos distintos`);
});
