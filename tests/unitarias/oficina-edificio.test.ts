import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BANDEJA_CEREBRO,
  SALAS,
  SALAS_ORDEN,
  asientosDeSala,
  camaraEdificio,
  cicloMensajero,
  faseMensajero,
  largoRuta,
  mensajerosDeSala,
  murosDeSala,
  puntoEnRuta,
  puntosDeRastro,
  rutaAlCerebro,
} from "@/lib/oficina/edificio";
import { actividadReciente, entregasParaOk, hojasParaOk, pedidoParaSector, salasVisuales } from "@/lib/oficina/panel";
import type { TareaOficina } from "@/lib/oficina/reglas";

const t = (id: string, estado: TareaOficina["estado"], area: TareaOficina["area"], decision: TareaOficina["decision"] = null, min = 0): TareaOficina => ({
  id,
  estado,
  area,
  ruta: area ? [area] : [],
  recorrido: [],
  titulo: `Tarea ${id}`,
  pedido: "x",
  decision,
  resultado: null,
  updated_at: new Date(Date.UTC(2026, 10, 22, 12, 0) - min * 60000).toISOString(),
});

test("el edificio tiene una sala por sector y ninguna se pisa", () => {
  assert.equal(SALAS_ORDEN.length, 8);
  for (let i = 0; i < SALAS_ORDEN.length; i++) {
    for (let j = i + 1; j < SALAS_ORDEN.length; j++) {
      const a = SALAS[SALAS_ORDEN[i]];
      const b = SALAS[SALAS_ORDEN[j]];
      const separadas = a.x1 <= b.x0 || b.x1 <= a.x0 || a.z1 <= b.z0 || b.z1 <= a.z0;
      assert.ok(separadas, `${a.area} y ${b.area} se pisan`);
    }
  }
  const c = SALAS.direccion;
  assert.ok(c.x1 - c.x0 > SALAS.redes.x1 - SALAS.redes.x0 - 0.1, "el Cerebro es la sala grande");
  assert.ok(Math.abs(c.cx) < 0.01 && Math.abs(c.cz) < 0.01, "el Cerebro está en el centro");
});

test("los puestos quedan dentro de su sala y no se tocan", () => {
  for (const a of SALAS_ORDEN) {
    const s = SALAS[a];
    const asientos = asientosDeSala(a, a === "direccion" ? 6 : 7);
    for (const p of asientos) {
      assert.ok(p.x > s.x0 + 0.8 && p.x < s.x1 - 0.8, `${a}: x fuera`);
      assert.ok(p.z > s.z0 && p.z < s.z1 - 0.3, `${a}: z fuera`);
    }
    for (let i = 0; i < asientos.length; i++)
      for (let j = i + 1; j < asientos.length; j++) assert.ok(Math.hypot(asientos[i].x - asientos[j].x, asientos[i].z - asientos[j].z) > 1.2, `${a}: ${i} y ${j} muy juntos`);
  }
});

test("la ruta de cada mensajero sale de su asiento y termina junto a la bandeja del Cerebro", () => {
  for (const a of SALAS_ORDEN.filter((x) => x !== "direccion")) {
    const as = asientosDeSala(a, 7)[0];
    const r = rutaAlCerebro(a, as);
    assert.deepEqual(r[0], [as.x, as.z]);
    const fin = r[r.length - 1];
    assert.ok(Math.hypot(fin[0] - BANDEJA_CEREBRO[0], fin[1] - BANDEJA_CEREBRO[1]) < 2.5, `${a}: termina lejos de la bandeja`);
    assert.ok(largoRuta(r) > 5);
  }
});

test("la ruta de un mensajero no atraviesa paredes de su sala", () => {
  // Tramo interior: de asiento hasta la puerta, muestreado cada 0,25 m, no entra en ningún muro de la sala.
  for (const a of SALAS_ORDEN.filter((x) => x !== "direccion")) {
    const s = SALAS[a];
    const muros = murosDeSala(a);
    for (let j = 0; j < 7; j++) {
      const r = rutaAlCerebro(a, asientosDeSala(a, 7)[j]);
      const iPuerta = r.findIndex((p) => p[0] === s.puerta[0] && p[1] === s.puerta[1]);
      const dentro = r.slice(0, iPuerta + 1);
      const largo = largoRuta(dentro);
      for (let d = 0; d < largo - 0.3; d += 0.25) {
        const p = puntoEnRuta(dentro, d);
        for (const m of muros) {
          const choca = Math.abs(p.x - m.p[0]) < m.s[0] / 2 && Math.abs(p.z - m.p[2]) < m.s[2] / 2;
          assert.ok(!choca, `${a} puesto ${j}: la ruta cruza un muro en (${p.x.toFixed(1)}, ${p.z.toFixed(1)})`);
        }
      }
    }
  }
});

test("puntoEnRuta recorre los tramos y se queda en los extremos", () => {
  const r: [number, number][] = [[0, 0], [4, 0], [4, 3]];
  assert.equal(largoRuta(r), 7);
  assert.deepEqual([puntoEnRuta(r, 2).x, puntoEnRuta(r, 2).z], [2, 0]);
  assert.deepEqual([puntoEnRuta(r, 5).x, puntoEnRuta(r, 5).z], [4, 1]);
  assert.deepEqual([puntoEnRuta(r, 99).x, puntoEnRuta(r, 99).z], [4, 3]);
  assert.deepEqual([puntoEnRuta(r, -3).x, puntoEnRuta(r, -3).z], [0, 0]);
  assert.ok(Math.abs(puntoEnRuta(r, 1).rumbo - Math.PI / 2) < 1e-9);
});

test("el mensajero se sienta, va, deja la carpeta, vuelve y se sienta", () => {
  const largo = 14;
  const ciclo = cicloMensajero(largo);
  assert.equal(faseMensajero(0, largo).fase, "sentado");
  const fases = new Set<string>();
  let maxD = 0;
  for (let x = 0; x < ciclo; x += 0.1) {
    const f = faseMensajero(x, largo);
    fases.add(f.fase);
    maxD = Math.max(maxD, f.d);
    assert.ok(f.d >= 0 && f.d <= largo + 1e-9);
  }
  assert.deepEqual([...fases].sort(), ["dejando", "sentado", "volviendo", "yendo"]);
  assert.ok(Math.abs(maxD - largo) < 0.3);
  // es periódico
  assert.equal(faseMensajero(3, largo).fase, faseMensajero(3 + ciclo, largo).fase);
  assert.equal(faseMensajero(3, largo, 0).d, faseMensajero(3 - ciclo, largo, 0).d);
});

test("salen a pasear los últimos puestos que trabajan, hasta dos", () => {
  assert.deepEqual(mensajerosDeSala(0, 0), []);
  assert.deepEqual(mensajerosDeSala(1, 2), [1]);
  assert.deepEqual(mensajerosDeSala(3, 6), [5, 4]);
});

test("el rastro de luz reparte puntos a lo largo de la ruta", () => {
  const p = puntosDeRastro([[0, 0], [10, 0]], 2);
  assert.ok(p.length >= 4 && p.length <= 6);
  assert.ok(p.every((q) => q[1] === 0 && q[0] > 0 && q[0] < 10));
});

test("la cámara: edificio entero, o cada sala mirada de frente y desde arriba", () => {
  const e = camaraEdificio(null, false, true);
  assert.ok(e.pos[1] > 30 && e.fov < 40);
  for (const a of SALAS_ORDEN) {
    const c = camaraEdificio(a, false, true);
    assert.ok(Math.abs(c.mira[0] - SALAS[a].cx) < 0.01);
    assert.ok(c.pos[2] > c.mira[2] && c.pos[1] > 6, `${a}: cámara mal ubicada`);
    // con panel, la escena se corre a la derecha (la mira va a la izquierda)
    assert.ok(camaraEdificio(a, true, true).mira[0] < c.mira[0]);
  }
});

test("las salas visuales reflejan las tareas: trabajando, hojas para el OK y mensajeros", () => {
  const tareas = [t("1", "en_curso", "redes"), t("2", "lista", "seo"), t("3", "lista", "diseno"), t("4", "lista", "diseno", "aprobada")];
  const v = salasVisuales(tareas);
  assert.equal(v.redes.trabajando, 2);
  assert.deepEqual(v.redes.mensajeros, [1]);
  assert.equal(v.analisis.mensajeros.length, 0);
  assert.equal(v.direccion.mensajeros.length, 0);
  assert.equal(hojasParaOk(tareas), 2);
  assert.deepEqual(entregasParaOk(tareas).map((x) => x.id), ["2", "3"]);
});

test("la actividad va de la más nueva a la más vieja y se corta en el máximo", () => {
  const tareas = [t("a", "lista", "seo", null, 30), t("b", "en_curso", "redes", null, 2), t("c", "pendiente", null, null, 90)];
  const a = actividadReciente(tareas, 2);
  assert.deepEqual(a.map((x) => x.id), ["b", "a"]);
  assert.equal(a[0].etapa, "Trabajando");
  assert.equal(actividadReciente(tareas)[2].sector, "Mesa de entrada");
});

test("la tarea dejada desde una sala nombra el sector; desde el edificio o el Cerebro no cambia", () => {
  assert.equal(pedidoParaSector(null, " hola "), "hola");
  assert.equal(pedidoParaSector("direccion", "hola"), "hola");
  assert.match(pedidoParaSector("redes", "armá 3 reels"), /^Para el sector «Redes y contenido»: armá 3 reels$/);
});
