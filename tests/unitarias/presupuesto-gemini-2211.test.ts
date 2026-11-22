import test from "node:test";
import assert from "node:assert/strict";
import {
  calcularGasto,
  CONFIG_PRESUPUESTO_POR_DEFECTO as D,
  costoEstimadoUsd,
  evaluarPresupuesto,
  inicioDeMesArgentina,
  mesAr,
  normalizarConfig,
  textoAvisoPresupuesto,
} from "@/lib/presupuesto/reglas";
import { itemsPresupuestoGemini } from "@/lib/presupuesto/salud";
import { evaluarSalud, type DatosSalud } from "@/lib/salud/reglas";
import { itemsDelPerfil } from "@/lib/salud/por-perfil";
import { RUBRO_IDS } from "@/lib/rubros";

test("valores por defecto: USD 30 por mes, aviso al 80 %, tope diario por perfil", () => {
  assert.equal(D.mensualUsd, 30);
  assert.equal(D.avisoFraccion, 0.8);
  assert.equal(D.topeDiarioPorPerfilUsd, 0.4);
  assert.equal(D.frenar, true);
  // 22/11 (Dirección): el tope diario por perfil es solo aviso por defecto.
  assert.equal(D.frenoDiario, false);
});

test("la configuración guardada se mezcla con los valores por defecto y lo inválido se ignora", () => {
  assert.deepEqual(normalizarConfig(null), D);
  assert.deepEqual(normalizarConfig("basura"), D);
  const c = normalizarConfig({ mensualUsd: 50, topeDiarioPorPerfilUsd: "0.75", avisoFraccion: 5, precioEntradaMillon: -1, frenar: "si" });
  assert.equal(c.mensualUsd, 50);
  assert.equal(c.topeDiarioPorPerfilUsd, 0.75);
  assert.equal(c.avisoFraccion, D.avisoFraccion);
  assert.equal(c.precioEntradaMillon, D.precioEntradaMillon);
  assert.equal(c.frenar, true);
  assert.equal(normalizarConfig({ frenar: false }).frenar, false);
  assert.equal(normalizarConfig({ frenoDiario: true }).frenoDiario, true);
  assert.equal(normalizarConfig({ frenoDiario: "si" }).frenoDiario, false);
});

test("costo estimado: entrada y salida por millón; el razonamiento se cobra como salida", () => {
  const p = { precioEntradaMillon: 0.3, precioSalidaMillon: 2.5 };
  assert.equal(costoEstimadoUsd({ entrada: 1_000_000, salida: 0 }, p), 0.3);
  assert.equal(costoEstimadoUsd({ entrada: 0, salida: 1_000_000 }, p), 2.5);
  assert.equal(costoEstimadoUsd({ entrada: 0, salida: 400_000, razonamiento: 600_000 }, p), 2.5);
  assert.equal(costoEstimadoUsd({ entrada: -5, salida: Number.NaN }, p), 0);
});

test("por debajo de todo el tope no frena ni avisa: el bot sigue igual", () => {
  const d = evaluarPresupuesto({ mesUsd: 5, diaPerfilUsd: 0.1 }, D);
  assert.equal(d.estado, "libre");
  assert.equal(d.bloquea, false);
  assert.equal(d.motivo, "");
});

test("al 80 % del mes avisa pero no frena", () => {
  const justo = evaluarPresupuesto({ mesUsd: 24, diaPerfilUsd: 0.1 }, D);
  assert.equal(justo.estado, "aviso");
  assert.equal(justo.bloquea, false);
  assert.equal(justo.porcentajeMes, 80);
  assert.equal(evaluarPresupuesto({ mesUsd: 23.99, diaPerfilUsd: 0 }, D).estado, "libre");
});

test("por defecto el tope diario es solo aviso: mide y avisa pero NO corta al bot", () => {
  const a = evaluarPresupuesto({ mesUsd: 10, diaPerfilUsd: 0.4 }, D);
  assert.equal(a.estado, "tope_dia");
  assert.equal(a.bloquea, false);
  assert.match(textoAvisoPresupuesto(a, "Marketing").body, /solo un aviso/);
  assert.doesNotMatch(textoAvisoPresupuesto(a, "Marketing").body, /deriva a una persona/);
  // Muy por encima del tope diario, mientras el mes no llegue a USD 30, tampoco corta.
  assert.equal(evaluarPresupuesto({ mesUsd: 29.99, diaPerfilUsd: 25 }, D).bloquea, false);
});

test("con frenoDiario encendido el tope diario frena solo a ese perfil", () => {
  const c = normalizarConfig({ frenoDiario: true });
  const a = evaluarPresupuesto({ mesUsd: 10, diaPerfilUsd: 0.4 }, c);
  assert.equal(a.estado, "tope_dia");
  assert.equal(a.bloquea, true);
  assert.match(textoAvisoPresupuesto(a, "Marketing").body, /deriva a una persona/);
  const otro = evaluarPresupuesto({ mesUsd: 10, diaPerfilUsd: 0.39 }, c);
  assert.equal(otro.bloquea, false);
  // Con el freno general apagado, ni el diario corta.
  assert.equal(evaluarPresupuesto({ mesUsd: 10, diaPerfilUsd: 0.4 }, { ...c, frenar: false }).bloquea, false);
});

test("el tope del mes (USD 30) frena a todos y manda sobre el del día, con frenoDiario apagado", () => {
  const d = evaluarPresupuesto({ mesUsd: 30, diaPerfilUsd: 0 }, D);
  assert.equal(d.estado, "tope_mes");
  assert.equal(d.bloquea, true);
  assert.equal(evaluarPresupuesto({ mesUsd: 30, diaPerfilUsd: 5 }, D).bloquea, true);
  assert.match(d.motivo, /30,00/);
});

test("con el freno apagado se mide y se avisa pero no se bloquea", () => {
  const c = { ...D, frenar: false };
  assert.equal(evaluarPresupuesto({ mesUsd: 99, diaPerfilUsd: 9 }, c).bloquea, false);
  assert.equal(evaluarPresupuesto({ mesUsd: 99, diaPerfilUsd: 9 }, c).estado, "tope_mes");
});

test("el gasto se arma por rubro; lo sin rubro suma al mes pero a ningún día de perfil", () => {
  const filas = [
    { rubro_id: RUBRO_IDS.juridico, tokens_entrada_dia: 1_000_000, tokens_salida_dia: 100_000, tokens_entrada_mes: 2_000_000, tokens_salida_mes: 200_000, turnos_topeados_dia: 2 },
    { rubro_id: null, tokens_entrada_dia: 0, tokens_salida_dia: 0, tokens_entrada_mes: 1_000_000, tokens_salida_mes: 0 },
  ];
  const g = calcularGasto(filas, D);
  assert.equal(g.porRubro[RUBRO_IDS.juridico].diaUsd, 0.3 + 0.25);
  assert.equal(g.porRubro[RUBRO_IDS.juridico].topeadosDia, 2);
  assert.equal(g.mesUsd, 1.4);
  assert.equal(Object.keys(g.porRubro).length, 1);
});

test("el mes y el aviso se cuentan en hora de Argentina", () => {
  // 1/12 02:00 UTC todavía es 30/11 en Argentina.
  const ahora = new Date("2026-12-01T02:00:00Z");
  assert.equal(mesAr(ahora), "2026-11");
  assert.equal(inicioDeMesArgentina(ahora).toISOString(), "2026-11-01T03:00:00.000Z");
});

test("los avisos no llevan datos de personas y dicen qué pasa", () => {
  const mes = evaluarPresupuesto({ mesUsd: 25, diaPerfilUsd: 0 }, D);
  assert.match(textoAvisoPresupuesto(mes).title, /80 %/);
  const dia = evaluarPresupuesto({ mesUsd: 1, diaPerfilUsd: 0.5 }, D);
  assert.match(textoAvisoPresupuesto(dia, "Marketing").title, /Marketing/);
  const tope = evaluarPresupuesto({ mesUsd: 31, diaPerfilUsd: 0 }, D);
  assert.match(textoAvisoPresupuesto(tope).body, /derivan a una persona/);
});

const resumen = (mesUsd: number, perfiles: { slug: string; diaUsd: number; turnosFrenadosHoy?: number }[] = []) => ({
  config: D,
  mesUsd,
  perfiles: perfiles.map((p) => ({ slug: p.slug, nombre: p.slug, diaUsd: p.diaUsd, topeDiaUsd: D.topeDiarioPorPerfilUsd, turnosFrenadosHoy: p.turnosFrenadosHoy ?? 0 })),
});

test("Salud: verde por debajo del 80 %, amarillo al 80 %, rojo al 100 %", () => {
  assert.equal(itemsPresupuestoGemini(resumen(3))[0].estado, "verde");
  assert.equal(itemsPresupuestoGemini(resumen(24))[0].estado, "amarillo");
  assert.equal(itemsPresupuestoGemini(resumen(30))[0].estado, "rojo");
  assert.deepEqual(itemsPresupuestoGemini(null), []);
});

test("Salud: un perfil con tope del día aparece solo en su perfil", () => {
  const items = itemsPresupuestoGemini(resumen(3, [{ slug: "marketing", diaUsd: 0.5, turnosFrenadosHoy: 3 }, { slug: "juridico", diaUsd: 0.1 }]));
  const propios = items.filter((i) => i.clave.startsWith("presupuesto_dia_"));
  assert.equal(propios.length, 1);
  assert.equal(propios[0].perfil, "marketing");
  // Por defecto es solo aviso: no dice que pasaron a una persona.
  assert.match(propios[0].detalle, /solo un aviso/);
  const conFreno = itemsPresupuestoGemini({ ...resumen(3, [{ slug: "marketing", diaUsd: 0.5, turnosFrenadosHoy: 3 }]), config: { ...D, frenoDiario: true } });
  assert.match(conFreno.find((i) => i.clave === "presupuesto_dia_marketing")!.detalle, /3 conversaciones pasaron a una persona/);
  assert.equal(itemsDelPerfil(items, "marketing").some((i) => i.clave === "presupuesto_dia_marketing"), true);
  assert.equal(itemsDelPerfil(items, "juridico").some((i) => i.clave === "presupuesto_dia_marketing"), false);
  // El del mes es de todo el sistema: se ve en los cuatro perfiles.
  assert.equal(itemsDelPerfil(items, "juridico").some((i) => i.clave === "presupuesto_gemini"), true);
});

test("evaluarSalud suma el gasto sin cambiar lo que ya mostraba", () => {
  const base: DatosSalud = {
    ahora: new Date("2026-11-22T12:00:00Z"),
    ultimoLatido: "2026-11-22T11:59:30Z",
    pausa: { ia: false, envios: false },
    cuarentena24h: { cantidad: 0, motivo: null },
    secretoMeta: true,
    ultimoEntrante: "2026-11-22T11:00:00Z",
    perfiles: [],
    turnos24h: { errores: 0, total: 0 },
    presupuestosAtrasados: 0,
  };
  const sin = evaluarSalud(base);
  const con = evaluarSalud({ ...base, presupuestoGemini: resumen(31) });
  assert.equal(con.length, sin.length + 1);
  assert.equal(con[0].clave, "presupuesto_gemini");
  assert.equal(con[0].estado, "rojo");
  for (const i of sin) assert.ok(con.some((x) => x.clave === i.clave && x.estado === i.estado));
});
