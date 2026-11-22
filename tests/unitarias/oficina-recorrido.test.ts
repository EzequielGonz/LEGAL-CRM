import { test } from "node:test";
import assert from "node:assert/strict";
import { ENTRADA, SALAS, SALAS_ORDEN, asientosDeSala, largoRuta } from "@/lib/oficina/edificio";
import {
  ALTURA_OJOS,
  PUNTOS_CAFE,
  SUGERENCIAS,
  adelante,
  cajasDeParedes,
  cartel,
  enlaceJarvis,
  entradaA,
  estadoDeCartel,
  iniciales,
  lugarEn,
  moverConChoques,
  paseanteDeSala,
  pedidoParaAgente,
  respuestaAgente,
  rutaAlCafe,
  yawHacia,
  type AgenteChat,
} from "@/lib/oficina/recorrido";

const cajas = cajasDeParedes();

function cruzaPared(a: [number, number], b: [number, number]): boolean {
  const pasos = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.05);
  for (let i = 0; i <= pasos; i++) {
    const x = a[0] + ((b[0] - a[0]) * i) / pasos;
    const z = a[1] + ((b[1] - a[1]) * i) / pasos;
    if (cajas.some((c) => x > c[0] + 0.02 && x < c[2] - 0.02 && z > c[1] + 0.02 && z < c[3] - 0.02)) return true;
  }
  return false;
}

test("la ruta al café sale por la puerta, va por los pasillos y no atraviesa paredes", () => {
  for (const a of SALAS_ORDEN) {
    if (a === "direccion") continue;
    for (const asiento of asientosDeSala(a, 7)) {
      const ruta = rutaAlCafe(a, asiento, 1);
      const fin = ruta[ruta.length - 1];
      assert.deepEqual(fin, PUNTOS_CAFE[1]);
      assert.ok(fin[0] > ENTRADA.x0 && fin[0] < ENTRADA.x1 && fin[1] > ENTRADA.z0 && fin[1] < ENTRADA.z1, `${a}: el café queda en el living`);
      assert.ok(largoRuta(ruta) < 60, `${a}: ruta razonable`);
      for (let i = 1; i < ruta.length; i++) assert.ok(!cruzaPared(ruta[i - 1], ruta[i]), `${a}: el tramo ${i} cruza una pared`);
    }
  }
});

test("como mucho un paseante por sala, siempre libre, y el Cerebro no sale", () => {
  assert.equal(paseanteDeSala("direccion", ["libre", "libre"]), null);
  assert.equal(paseanteDeSala("analisis", ["trabajando", "trabajando"]), null);
  const j = paseanteDeSala("analisis", ["trabajando", "libre", "libre"]);
  assert.ok(j === 1 || j === 2);
  let salen = 0;
  for (const a of SALAS_ORDEN) if (paseanteDeSala(a, ["libre", "libre", "libre"]) !== null) salen++;
  assert.ok(salen >= 2 && salen <= 4, "salen algunos, no todos");
});

test("caminar no atraviesa paredes y se desliza por ellas", () => {
  // Desde el pasillo norte hacia la pared de Marketing (fuera de la puerta).
  const [x, z] = moverConChoques(-14, -6.2, 0, -3, cajas);
  assert.ok(z > -7.3, "no entra por la pared");
  const [x2] = moverConChoques(-14, -6.2, 1, -3, cajas);
  assert.ok(x2 > x, "se desliza en x");
  // Por la puerta sí pasa.
  let p: [number, number] = [-10.5, -6.2];
  for (let i = 0; i < 20; i++) p = moverConChoques(p[0], p[1], 0, -0.1, cajas);
  assert.ok(p[1] < -7.5, "entra por la puerta");
});

test("al entrar a cada lugar la persona aparece adentro, sin chocar y mirando la sala", () => {
  for (const a of [...SALAS_ORDEN, "entrada" as const]) {
    const v = entradaA(a);
    assert.equal(lugarEn(v.x, v.z), a, `${a}: aparece adentro`);
    const [nx, nz] = moverConChoques(v.x, v.z, 0, 0, cajas);
    assert.ok(nx === v.x && nz === v.z, `${a}: no queda dentro de una pared`);
    const centro = a === "entrada" ? [(ENTRADA.x0 + ENTRADA.x1) / 2, (ENTRADA.z0 + ENTRADA.z1) / 2] : [SALAS[a].cx, SALAS[a].cz];
    const [fx, fz] = adelante(v.yaw);
    const haciaCentro = (centro[0] - v.x) * fx + (centro[1] - v.z) * fz;
    assert.ok(haciaCentro > 0, `${a}: mira hacia adentro`);
  }
  assert.ok(ALTURA_OJOS > 1.4 && ALTURA_OJOS < 1.8);
  const y = yawHacia(0, 0, 0, -5);
  assert.ok(Math.abs(y) < 1e-9);
});

test("carteles «Nombre · estado» en castellano", () => {
  assert.equal(cartel("Guionista", "trabajando"), "Guionista · Trabajando");
  assert.equal(cartel("Guionista", "libre"), "Guionista · Libre");
  assert.equal(estadoDeCartel("trabajando", "llevando"), "Llevando al Cerebro");
  assert.equal(estadoDeCartel("libre", "cafe"), "Tomando un café");
  assert.equal(estadoDeCartel("listo"), "Listo para tu OK");
});

test("el chat responde con lo que el panel sabe, sin inventar", () => {
  const a: AgenteChat = { nombre: "Guionista", rol: "Escribe guiones de reels", estado: "trabajando", tarea: "Reels de la semana", progreso: 0.42, area: "redes", motor: "Claude" };
  assert.match(respuestaAgente(a, "que"), /Reels de la semana/);
  assert.match(respuestaAgente(a, "cuanto"), /42 %/);
  const libre = { ...a, estado: "libre" as const, tarea: null };
  assert.match(respuestaAgente(libre, "que"), /libre/);
  for (const s of SUGERENCIAS) assert.ok(respuestaAgente(libre, s.id).length > 5);
});

test("el pedido del chat va al sector del agente y Jarvis lo recibe precargado", () => {
  assert.equal(pedidoParaAgente("redes", "Guionista", "  "), "");
  const p = pedidoParaAgente("redes", "Guionista", "Tres reels para VITA");
  assert.match(p, /Redes y contenido/);
  assert.match(p, /Guionista/);
  assert.match(pedidoParaAgente("direccion", "Orquestador", "x"), /Cerebro/);
  const j = enlaceJarvis("redes", "Guionista", "Hola");
  assert.ok(j.startsWith("/asistente?pedido="));
  assert.match(decodeURIComponent(j), /No ejecutes nada/);
  assert.equal(iniciales("Analista de datos"), "AD");
  assert.equal(iniciales("Guionista"), "G");
});

test("el canal del equipo usa los pasos reales y, si no hay, el estado de ahora", async () => {
  const { mensajesDelEquipo } = await import("@/lib/oficina/recorrido");
  const salas = { direccion: { puestos: [], mensajeros: [] }, analisis: { puestos: [{ nombre: "Analista", estado: "trabajando" as const, tarea: "Informe" }], mensajeros: [0] }, redes: { puestos: [{ nombre: "Guionista", estado: "libre" as const, tarea: null }], mensajeros: [] }, diseno: { puestos: [], mensajeros: [] }, seo: { puestos: [], mensajeros: [] }, bots: { puestos: [], mensajeros: [] }, ingenieria: { puestos: [], mensajeros: [] }, asistente: { puestos: [], mensajeros: [] } };
  const conPasos = mensajesDelEquipo([{ id: "t1", titulo: "Reels", recorrido: [{ area: "redes", agente: "Guionista", nota: "", at: "2026-11-22T10:00:00Z" }, { area: "duenos", agente: "x", nota: "y", at: "2026-11-22T11:00:00Z" }] }], salas);
  assert.equal(conPasos[0].quien, "Guionista");
  assert.match(conPasos[0].texto, /Reels/);
  assert.ok(conPasos.some((m) => /al Cerebro/.test(m.texto)), "el mensajero avisa que lleva la carpeta");
  const sinNada = mensajesDelEquipo([], { ...salas, analisis: { puestos: [{ nombre: "Analista", estado: "libre" as const, tarea: null }], mensajeros: [] } });
  assert.ok(sinNada.every((m) => /café/.test(m.texto)));
});
