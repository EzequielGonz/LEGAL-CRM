import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COLOR_AREA,
  DURACION_DESTELLO,
  DURACION_FESTEJO,
  GLIFOS,
  anuncioDeEntrega,
  brazosFestejo,
  brazosTecleo,
  camaraDe,
  derivaCamara,
  descripcionAccesible,
  escritorioQueEntrego,
  intensidadDestello,
  posicionPuesto,
  progresoDeTarea,
  puestosConGlifo,
  puestosVisuales,
  vecino,
} from "../../src/lib/oficina/escena";
import { AREAS, ESCRITORIOS, type TareaOficina } from "../../src/lib/oficina/reglas";

const tarea = (x: Partial<TareaOficina>): TareaOficina => ({
  id: "t1",
  estado: "pendiente",
  area: "redes",
  ruta: ["analisis", "redes", "direccion"],
  recorrido: [],
  titulo: "Estrategia de la semana",
  pedido: "Armá la estrategia",
  decision: null,
  resultado: null,
  updated_at: "2026-11-22T10:00:00Z",
  ...x,
});
const paso = (area: any, at = "2026-11-22T10:05:00Z") => ({ area, agente: "Agente", nota: "listo", at });

test("sin tareas: los 8 puestos están libres, en gris y sin progreso", () => {
  const p = puestosVisuales([]);
  assert.equal(p.length, 8);
  for (const x of p) {
    assert.equal(x.estado, "libre");
    assert.equal(x.progreso, 0);
    assert.equal(x.chip, "Libre");
    assert.equal(x.listas.length, 0);
  }
  assert.deepEqual(p.map((x) => x.area), [...AREAS]);
});

test("una tarea en curso pone a trabajar al escritorio que le toca, con su progreso", () => {
  const t = tarea({ estado: "en_curso", recorrido: [paso("analisis")] });
  const p = puestosVisuales([t]);
  const redes = p.find((x) => x.area === "redes")!;
  assert.equal(redes.estado, "trabajando");
  assert.ok(redes.progreso > 0.3 && redes.progreso < 0.95);
  assert.match(redes.chip, /^Trabajando \d+ %$/);
  assert.match(redes.queHace, /Estrategia de la semana/);
  assert.equal(p.find((x) => x.area === "analisis")!.estado, "libre");
});

test("una tarea pendiente espera su turno: en cola, sin barra", () => {
  const p = puestosVisuales([tarea({ estado: "pendiente" })]);
  const a = p.find((x) => x.area === "analisis")!;
  assert.equal(a.estado, "en_cola");
  assert.equal(a.progreso, 0);
  assert.equal(a.chip, "En cola");
});

test("lista sin decisión: el escritorio que entregó festeja y queda en verde al 100 %", () => {
  const t = tarea({ estado: "lista", recorrido: [paso("analisis"), paso("redes"), paso("direccion")] });
  const p = puestosVisuales([t]);
  const d = p.find((x) => x.area === "direccion")!;
  assert.equal(d.estado, "listo");
  assert.equal(d.progreso, 1);
  assert.equal(d.chip, "Listo para tu OK");
  assert.deepEqual(d.listas, ["t1"]);
  assert.equal(p.filter((x) => x.estado === "listo").length, 1);
});

test("una tarea aprobada ya no ocupa ningún puesto", () => {
  const t = tarea({ estado: "lista", decision: "aprobada", recorrido: [paso("direccion")] });
  assert.ok(puestosVisuales([t]).every((x) => x.estado === "libre"));
});

test("trabajando gana sobre listo y sobre en cola; varias listas suman al chip", () => {
  const trabaja = tarea({ id: "a", estado: "en_curso", ruta: ["direccion"] });
  const lista = tarea({ id: "b", estado: "lista", recorrido: [paso("direccion")] });
  const d = puestosVisuales([trabaja, lista]).find((x) => x.area === "direccion")!;
  assert.equal(d.estado, "trabajando");
  assert.deepEqual(d.listas, ["b"]);
  const dos = puestosVisuales([lista, tarea({ id: "c", estado: "lista", recorrido: [paso("direccion")] })]).find((x) => x.area === "direccion")!;
  assert.equal(dos.chip, "Listo para tu OK (2)");
});

test("el escritorio que entregó es el del último paso del recorrido (ignora a los dueños)", () => {
  assert.equal(escritorioQueEntrego({ recorrido: [paso("redes"), paso("duenos")] }), "redes");
  assert.equal(escritorioQueEntrego({ recorrido: [] }), "direccion");
});

test("progreso: nunca baja de 0 estando en curso y llega a 1 cuando espera el OK", () => {
  assert.ok(progresoDeTarea(tarea({ estado: "en_curso" })) >= 0.08);
  assert.equal(progresoDeTarea(tarea({ estado: "lista" })), 1);
  assert.equal(progresoDeTarea(tarea({ estado: "en_curso", ruta: [] })), 0.1);
  const a = progresoDeTarea(tarea({ estado: "en_curso", recorrido: [paso("analisis")] }));
  const b = progresoDeTarea(tarea({ estado: "en_curso", recorrido: [paso("analisis"), paso("redes")] }));
  assert.ok(b > a && b < 1);
});

test("posiciones: dos filas de cuatro, sin superponerse, simétricas y deterministas", () => {
  const pos = ESCRITORIOS.map((_, i) => posicionPuesto(i));
  assert.equal(new Set(pos.map((p) => `${p.x},${p.z}`)).size, 8);
  assert.equal(pos[0].x, -pos[3].x);
  assert.equal(pos[0].z, pos[3].z);
  assert.ok(pos[4].z > pos[0].z);
  assert.deepEqual(posicionPuesto(5), posicionPuesto(5));
});

test("cada escritorio tiene color propio y tres glifos de su rol", () => {
  assert.equal(new Set(Object.values(COLOR_AREA)).size, 8);
  for (const a of AREAS) assert.equal(GLIFOS[a].length, 3);
});

test("vecino da la vuelta en ambos sentidos", () => {
  assert.equal(vecino("direccion", -1), "asistente");
  assert.equal(vecino("asistente", 1), "direccion");
  assert.equal(vecino("redes", 1), "diseno");
});

test("cámara: la cenital mira desde arriba; el puesto enfoca su escritorio y se corre con el panel", () => {
  const c = camaraDe("cenital");
  assert.ok(c.pos[1] > 15 && Math.abs(c.pos[2]) < 3);
  const sala = camaraDe("sala");
  assert.ok(sala.pos[1] > 5 && sala.pos[2] > 8);
  const p = posicionPuesto(2);
  const sin = camaraDe("redes", false);
  const con = camaraDe("redes", true);
  assert.equal(sin.mira[0], p.x);
  assert.ok(con.mira[0] > sin.mira[0]);
  assert.equal(camaraDe("redes", true, false).mira[0], p.x);
});

test("festejo: sube, se sostiene, baja y termina; el destello pica y se apaga", () => {
  assert.equal(brazosFestejo(-1), 0);
  assert.ok(brazosFestejo(0.1) > 0 && brazosFestejo(0.1) < 1);
  assert.equal(brazosFestejo(0.8), 1);
  assert.equal(brazosFestejo(DURACION_FESTEJO), 0);
  assert.ok(Math.abs(intensidadDestello(0.15) - 1) < 1e-9);
  assert.equal(intensidadDestello(DURACION_DESTELLO), 0);
  assert.ok(intensidadDestello(0.5) < 1);
});

test("teclear: los brazos se alternan y cada puesto tiene su desfase", () => {
  const [a, b] = brazosTecleo(0.3, 0);
  assert.notEqual(a, b);
  assert.notEqual(brazosTecleo(0.3, 0)[0], brazosTecleo(0.3, 1)[0]);
  assert.deepEqual(brazosTecleo(0.3, 2), brazosTecleo(0.3, 2));
});

test("deriva de cámara: dentro de ±0,5°", () => {
  for (let t = 0; t < 20; t += 0.7) assert.ok(Math.abs(derivaCamara(t)) <= (0.5 * Math.PI) / 180 + 1e-12);
});

test("glifos: como máximo dos a la vez, solo en puestos que trabajan, rotan con el tiempo", () => {
  const todos = AREAS.map((area) => ({ area, estado: "trabajando" as const }));
  assert.equal(puestosConGlifo(todos, 0).length, 2);
  assert.notDeepEqual(puestosConGlifo(todos, 0), puestosConGlifo(todos, 2.5));
  assert.deepEqual(puestosConGlifo(AREAS.map((area) => ({ area, estado: "libre" as const })), 0), []);
  assert.deepEqual(puestosConGlifo([{ area: "seo", estado: "trabajando" }, { area: "bots", estado: "libre" }], 5), ["seo"]);
});

test("aviso de entrega: solo cuando un puesto pasa a listo", () => {
  const antes = puestosVisuales([tarea({ estado: "en_curso", ruta: ["direccion"] })]);
  const ahora = puestosVisuales([tarea({ estado: "lista", recorrido: [paso("direccion")] })]);
  assert.equal(anuncioDeEntrega(null, ahora), null);
  assert.equal(anuncioDeEntrega(ahora, ahora), null);
  assert.match(anuncioDeEntrega(antes, ahora)!, /Dirección terminó y espera tu OK/);
});

test("descripción accesible: nombre, estado y qué hace, sin datos de prospectos", () => {
  const p = puestosVisuales([tarea({ estado: "en_curso", recorrido: [paso("analisis")] })]).find((x) => x.area === "redes")!;
  const d = descripcionAccesible(p);
  assert.match(d, /^Redes y contenido: Trabajando, \d+ por ciento\./);
});

test("determinismo: la misma entrada da exactamente la misma salida (hidratación)", () => {
  const t = [tarea({ estado: "en_curso", recorrido: [paso("analisis")] }), tarea({ id: "z", estado: "lista", recorrido: [paso("direccion")] })];
  assert.deepEqual(puestosVisuales(t), puestosVisuales(t));
});

test("diorama: el puesto de la izquierda cae a la izquierda del centro y el zoom se calcula sin azar", async () => {
  const { proyeccionDiorama, centroPuestoDiorama } = await import("../../src/lib/oficina/escena");
  const izq = proyeccionDiorama(0);
  const der = proyeccionDiorama(3);
  assert.ok(izq.sx < der.sx);
  assert.deepEqual(proyeccionDiorama(6), proyeccionDiorama(6));
  assert.ok(centroPuestoDiorama(4).y > centroPuestoDiorama(0).y);
});

test("festejo: festeja el escritorio que terminó su parte, no siempre Dirección", async () => {
  const { areasQueTerminaron } = await import("../../src/lib/oficina/escena");
  const antes = puestosVisuales([tarea({ estado: "en_curso", ruta: ["analisis", "redes", "direccion"] })]);
  // Análisis deja su parte y la tarea pasa a Redes: festeja Análisis (y nadie más).
  const ahora = puestosVisuales([tarea({ estado: "en_curso", ruta: ["analisis", "redes", "direccion"], recorrido: [paso("analisis")] })]);
  assert.deepEqual(areasQueTerminaron(antes, ahora), ["analisis"]);
  assert.equal(ahora.find((x) => x.area === "analisis")!.partesHechas, 1);
  assert.match(ahora.find((x) => x.area === "analisis")!.queHace, /Ya dejó su parte/);
  // Después Redes termina: festeja Redes.
  const luego = puestosVisuales([tarea({ estado: "en_curso", ruta: ["analisis", "redes", "direccion"], recorrido: [paso("analisis"), paso("redes")] })]);
  assert.deepEqual(areasQueTerminaron(ahora, luego), ["redes"]);
});

test("festejo: sin foto anterior o sin cambios no festeja nadie; al aprobar no hay festejo falso", async () => {
  const { areasQueTerminaron } = await import("../../src/lib/oficina/escena");
  const t1 = puestosVisuales([tarea({ estado: "en_curso", recorrido: [paso("analisis")] })]);
  assert.deepEqual(areasQueTerminaron(null, t1), []);
  assert.deepEqual(areasQueTerminaron(t1, t1), []);
  const aprobada = puestosVisuales([tarea({ estado: "lista", decision: "aprobada", recorrido: [paso("analisis")] })]);
  assert.deepEqual(areasQueTerminaron(t1, aprobada), []);
  assert.equal(aprobada.find((x) => x.area === "analisis")!.partesHechas, 0);
});
