import { test } from "node:test";
import assert from "node:assert/strict";
import { accionesRapidasDe, type PantallaId } from "../../src/lib/jarvis/pantallas";
import { agregarHecho, diaArgentina, hechosDeHoy, hechosValidos, horaCorta, type HechoJarvis } from "../../src/lib/jarvis/historial";

const TODAS: PantallaId[] = ["hoy", "chats", "contactos", "campanas", "bases", "agenda", "agentes", "configuracion", "estadisticas", "redes", "seguimiento", "salud", "lineas", "cerebro", "perfiles", "bandeja", "asistente", "otra"];

test("cada pantalla tiene entre 3 y 4 acciones rápidas, cortas y sin jerga", () => {
  const jerga = /\b(lead|leads|pipeline|kpi|api|json|webhook)\b/i;
  for (const p of TODAS) {
    const a = accionesRapidasDe(p);
    assert.ok(a.length >= 3 && a.length <= 4, `${p}: ${a.length}`);
    assert.equal(new Set(a.map((x) => x.etiqueta)).size, a.length, `${p}: etiquetas repetidas`);
    for (const x of a) {
      assert.ok(x.etiqueta.length > 0 && x.etiqueta.length <= 40, `${p}: ${x.etiqueta}`);
      assert.ok(x.pedido.length > 10, `${p}: pedido corto`);
      assert.ok(!jerga.test(x.etiqueta + x.pedido), `${p}: jerga`);
    }
  }
});

test("las acciones pedidas por el dueño están en su pantalla", () => {
  assert.ok(accionesRapidasDe("chats").some((a) => a.etiqueta === "Responder a los que esperan"));
  assert.ok(accionesRapidasDe("campanas").some((a) => a.etiqueta === "Armar campaña con la última base"));
  assert.ok(accionesRapidasDe("hoy").some((a) => a.etiqueta === "Derivar captados"));
});

test("derivar nunca se pide como automático", () => {
  const d = accionesRapidasDe("hoy").find((a) => a.etiqueta === "Derivar captados")!;
  assert.match(d.pedido, /listo el paso/);
});

const h = (id: string, hora: string, estado: HechoJarvis["estado"] = "ejecutada"): HechoJarvis => ({ id, titulo: `T${id}`, detalle: "Listo.", estado, hora });

test("el historial pone lo más nuevo primero, no repite y se topa en 40", () => {
  let l: HechoJarvis[] = [];
  l = agregarHecho(l, h("a", "2026-11-22T15:00:00Z"));
  l = agregarHecho(l, h("b", "2026-11-22T16:00:00Z"));
  l = agregarHecho(l, h("a", "2026-11-22T17:00:00Z", "error"));
  assert.deepEqual(l.map((x) => x.id), ["a", "b"]);
  assert.equal(l[0].estado, "error");
  for (let i = 0; i < 60; i++) l = agregarHecho(l, h(`x${i}`, `2026-11-22T${String(10 + (i % 10)).padStart(2, "0")}:00:00Z`));
  assert.equal(l.length, 40);
});

test("solo cuenta lo de hoy en hora de Argentina (a las 02:30 UTC todavía es el día anterior)", () => {
  const ahora = new Date("2026-11-22T20:00:00Z");
  assert.equal(diaArgentina(new Date("2026-11-23T02:30:00Z")), "2026-11-22");
  const l = [h("hoy", "2026-11-23T02:30:00Z"), h("ayer", "2026-11-21T20:00:00Z"), h("rota", "no-es-fecha")];
  assert.deepEqual(hechosDeHoy(l, ahora).map((x) => x.id), ["hoy"]);
  assert.equal(horaCorta("2026-11-22T17:35:00Z"), "14:35");
});

test("lo leído del navegador se valida", () => {
  assert.deepEqual(hechosValidos("x"), []);
  assert.deepEqual(hechosValidos([{ id: 1 }, null, h("ok", "2026-11-22T10:00:00Z")]).map((x) => x.id), ["ok"]);
});
