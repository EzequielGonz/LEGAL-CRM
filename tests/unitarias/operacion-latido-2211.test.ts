import test from "node:test";
import assert from "node:assert/strict";
import { mapConTope } from "@/lib/concurrencia";
import { agruparPorLinea } from "@/lib/campaigns";
import {
  destinoTrasFallaDelModelo,
  MAX_INTENTOS_RECONTACTO,
  TIEMPO_ENVIO_RECONTACTO_MS,
  TIEMPO_MODELO_RECONTACTO_MS,
} from "@/lib/recontacto/reglas";
import { conTiempoYReintento, esFallaTransitoria, TiempoAgotadoError } from "@/lib/ai-agent/reintento";
import { huecoEntreLatidos, huecoParaAvisar, huecoParaRegistrar, itemAtrasoLatido } from "@/lib/salud/latido-atraso";
import { evaluarSalud, type DatosSalud } from "@/lib/salud/reglas";

const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

test("una tarea colgada no atrasa a las demás: se corta por tiempo y el resto sigue", async () => {
  const t0 = Date.now();
  const r = await mapConTope(
    ["a", "colgada", "c"],
    async (x) => {
      if (x === "colgada") await esperar(5_000);
      return `ok:${x}`;
    },
    { concurrencia: 3, tiempoMs: 60, sinTiempo: (x, m) => `sin:${x}:${m}` }
  );
  assert.deepEqual(r, ["ok:a", "sin:colgada:tiempo_agotado", "ok:c"]);
  assert.ok(Date.now() - t0 < 1_000, "no esperó a la tarea colgada");
});

test("con concurrencia 1 y varias tareas lentas, el total no se multiplica por tareas (concurrencia 3)", async () => {
  const t0 = Date.now();
  const r = await mapConTope([1, 2, 3], async (n) => (await esperar(80), n), { concurrencia: 3, tiempoMs: 1_000, sinTiempo: () => -1 });
  assert.deepEqual(r, [1, 2, 3]);
  assert.ok(Date.now() - t0 < 220, "corrieron a la vez, no en serie");
});

test("no se pasa de la concurrencia pedida", async () => {
  let activas = 0;
  let maxima = 0;
  await mapConTope(
    [1, 2, 3, 4, 5, 6],
    async () => {
      activas++;
      maxima = Math.max(maxima, activas);
      await esperar(15);
      activas--;
    },
    { concurrencia: 2, tiempoMs: 1_000, sinTiempo: () => undefined }
  );
  assert.equal(maxima, 2);
});

test("pasado el presupuesto de tiempo no se empiezan tareas nuevas", async () => {
  let ahora = 0;
  const empezadas: number[] = [];
  const r = await mapConTope(
    [1, 2, 3],
    async (n) => {
      empezadas.push(n);
      ahora += 40;
      return n;
    },
    { concurrencia: 1, tiempoMs: 1_000, presupuestoMs: 50, ahora: () => ahora, sinTiempo: (n, m) => -n * 10 - (m === "no_empezo" ? 0 : 1) }
  );
  assert.deepEqual(empezadas, [1, 2]);
  assert.deepEqual(r, [1, 2, -30]);
});

test("el error de una tarea no rompe a las demás", async () => {
  const fallas: unknown[] = [];
  const r = await mapConTope(
    ["x", "mala", "z"],
    async (x) => {
      if (x === "mala") throw new Error("boom");
      return x;
    },
    { tiempoMs: 500, sinTiempo: (x, m) => `${x}:${m}`, alFallar: (_x, e) => fallas.push(e) }
  );
  assert.deepEqual(r, ["x", "mala:error", "z"]);
  assert.equal(fallas.length, 1);
});

test("lista vacía no se cuelga", async () => {
  assert.deepEqual(await mapConTope([], async () => 1, { tiempoMs: 10, sinTiempo: () => 0 }), []);
});

test("las campañas de una misma línea van juntas (en serie) y las demás por su lado", () => {
  const g = agruparPorLinea([
    { id: "c1", wasender_line_id: "w1" },
    { id: "c2", wasender_line_id: "w1" },
    { id: "c3", line_id: "m1" },
    { id: "c4", line_id: "m1" },
    { id: "c5" },
    { id: "c6", wasender_line_id: "w2" },
  ]);
  assert.deepEqual(g, [["c1", "c2"], ["c3", "c4"], ["c5"], ["c6"]]);
  assert.deepEqual(agruparPorLinea([]), []);
});

test("recontacto: tiempos máximos acotados y una falla pasajera del modelo se libera dos veces como mucho", () => {
  assert.ok(TIEMPO_MODELO_RECONTACTO_MS <= 15_000);
  assert.ok(TIEMPO_ENVIO_RECONTACTO_MS <= 20_000);
  assert.equal(MAX_INTENTOS_RECONTACTO, 2);
  assert.equal(destinoTrasFallaDelModelo(true, 0), "liberar");
  assert.equal(destinoTrasFallaDelModelo(true, 1), "error");
  assert.equal(destinoTrasFallaDelModelo(false, 0), "error");
});

test("recontacto: una llamada colgada al modelo se corta por tiempo y cuenta como falla pasajera", async () => {
  const t0 = Date.now();
  let err: unknown;
  try {
    await conTiempoYReintento(() => esperar(5_000), { tiempoMs: 40, reintentos: 0 });
  } catch (e) {
    err = e;
  }
  assert.ok(err instanceof TiempoAgotadoError);
  assert.equal(esFallaTransitoria(err), true);
  assert.ok(Date.now() - t0 < 1_000);
});

const ahora = new Date("2026-11-22T15:00:00Z");
const iso = (minAtras: number) => new Date(ahora.getTime() - minAtras * 60_000).toISOString();

test("el hueco entre latidos se mide y solo avisa desde 10 minutos", () => {
  assert.equal(huecoEntreLatidos(null, ahora), null);
  assert.equal(huecoEntreLatidos("no es fecha", ahora), null);
  assert.equal(huecoEntreLatidos(iso(1), ahora), 60_000);
  assert.equal(huecoParaAvisar(null), false);
  assert.equal(huecoParaAvisar(9 * 60_000), false);
  assert.equal(huecoParaAvisar(10 * 60_000), true);
});

test("un hueco largo queda anotado una hora; uno corto no pisa al anterior", () => {
  const largo = huecoParaRegistrar({ at: iso(7) }, ahora);
  assert.equal(largo?.ms, 7 * 60_000);
  assert.equal(largo?.at, ahora.toISOString());
  // Latido normal (1 min) después de uno largo reciente: se conserva el recuerdo.
  const conserva = huecoParaRegistrar({ at: iso(1), hueco: { ms: 8 * 60_000, at: iso(20) } }, ahora);
  assert.equal(conserva?.ms, 8 * 60_000);
  // Pasada la hora se olvida.
  assert.equal(huecoParaRegistrar({ at: iso(1), hueco: { ms: 8 * 60_000, at: iso(61) } }, ahora), null);
  assert.equal(huecoParaRegistrar(null, ahora), null);
});

test("Salud: amarillo entre 3 y 5 minutos sin latido, y recuerdo de un corte reciente", () => {
  assert.equal(itemAtrasoLatido({ ahora, ultimoLatido: iso(1) }), null);
  assert.equal(itemAtrasoLatido({ ahora, ultimoLatido: null }), null);
  const atrasado = itemAtrasoLatido({ ahora, ultimoLatido: iso(4) });
  assert.equal(atrasado?.estado, "amarillo");
  assert.match(atrasado!.detalle, /4 min/);
  // Más de 5 minutos: lo cubre el rojo del control del latido; no se duplica.
  assert.equal(itemAtrasoLatido({ ahora, ultimoLatido: iso(6) }), null);
  const recuerdo = itemAtrasoLatido({ ahora, ultimoLatido: iso(1), hueco: { ms: 12 * 60_000, at: iso(30) } });
  assert.equal(recuerdo?.estado, "amarillo");
  assert.match(recuerdo!.detalle, /12 min/);
  assert.equal(itemAtrasoLatido({ ahora, ultimoLatido: iso(1), hueco: { ms: 12 * 60_000, at: iso(90) } }), null);
});

test("evaluarSalud conserva el rojo del latido detenido y suma el amarillo del atraso sin reemplazarlo", () => {
  const base: DatosSalud = {
    ahora,
    ultimoLatido: iso(1),
    pausa: { ia: false, envios: false },
    cuarentena24h: { cantidad: 0, motivo: null },
    secretoMeta: true,
    ultimoEntrante: iso(30),
    perfiles: [],
    turnos24h: { errores: 0, total: 0 },
    presupuestosAtrasados: 0,
  };
  const normal = evaluarSalud(base);
  assert.equal(normal.find((i) => i.clave === "latido")?.estado, "verde");
  assert.equal(normal.some((i) => i.clave === "latido_atraso"), false);
  const atrasado = evaluarSalud({ ...base, ultimoLatido: iso(4) });
  assert.equal(atrasado.find((i) => i.clave === "latido")?.estado, "verde");
  assert.equal(atrasado.find((i) => i.clave === "latido_atraso")?.estado, "amarillo");
  const detenido = evaluarSalud({ ...base, ultimoLatido: iso(9) });
  assert.equal(detenido.find((i) => i.clave === "latido")?.estado, "rojo");
  assert.equal(detenido.some((i) => i.clave === "latido_atraso"), false);
});
