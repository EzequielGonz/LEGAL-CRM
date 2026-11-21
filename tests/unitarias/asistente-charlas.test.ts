import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ambitoDe,
  esIdCharla,
  idsDePropuestas,
  MAX_BYTES_PROPUESTAS,
  MAX_MENSAJES_POR_ENVIO,
  MAX_TEXTO_MENSAJE,
  refrescarPropuestas,
  sanearMensajes,
  tituloDeCharla,
} from "../../src/lib/asistente/charlas";

// 20/11: charlas guardadas del asistente (pedido de la Bandeja). Datos ficticios.
const ID1 = "11111111-1111-4111-8111-111111111111";
const ID2 = "22222222-2222-4222-8222-222222222222";

test("ambitoDe: sin perfil es la general; con perfil válido, el Laboratorio; otro, error", () => {
  assert.deepEqual(ambitoDe(undefined), { ambito: "general", perfil: null });
  assert.deepEqual(ambitoDe(null), { ambito: "general", perfil: null });
  assert.deepEqual(ambitoDe(""), { ambito: "general", perfil: null });
  assert.deepEqual(ambitoDe("juridico"), { ambito: "laboratorio", perfil: "juridico" });
  assert.deepEqual(ambitoDe("coberturas_medicas"), { ambito: "laboratorio", perfil: "coberturas_medicas" });
  assert.ok("error" in ambitoDe("otro"));
  assert.ok("error" in ambitoDe("juridico' or 1=1"));
  assert.ok("error" in ambitoDe(42));
});

test("esIdCharla: solo uuid", () => {
  assert.equal(esIdCharla(ID1), true);
  assert.equal(esIdCharla("no-es"), false);
  assert.equal(esIdCharla(`${ID1}x`), false);
  assert.equal(esIdCharla(undefined), false);
});

test("sanearMensajes: descarta errores y vacíos, recorta texto y no guarda propuestas del usuario", () => {
  const r = sanearMensajes([
    { rol: "usuario", texto: "  armá una campaña  ", propuestas: [{ id: ID1, tipo: "x" }] },
    { rol: "asistente", texto: "No pude responder.", error: true },
    { rol: "asistente", texto: "   " },
    { rol: "sistema", texto: "ignorar" },
    { rol: "asistente", texto: "x".repeat(MAX_TEXTO_MENSAJE + 50), propuestas: [{ id: ID1, tipo: "plan_campanas", titulo: "Plan" }, { id: "malo", tipo: "x" }] },
  ]);
  assert.ok("mensajes" in r);
  assert.equal(r.mensajes.length, 2);
  assert.deepEqual(r.mensajes[0], { rol: "usuario", texto: "armá una campaña", propuestas: [], enlaces: [] });
  assert.equal(r.mensajes[1].texto.length, MAX_TEXTO_MENSAJE);
  assert.deepEqual(r.mensajes[1].propuestas, [{ id: ID1, tipo: "plan_campanas", titulo: "Plan" }]);
});

test("sanearMensajes: nada válido, vacío o demasiados devuelve error", () => {
  assert.ok("error" in sanearMensajes([]));
  assert.ok("error" in sanearMensajes("hola"));
  assert.ok("error" in sanearMensajes([{ rol: "asistente", texto: "x", error: true }]));
  assert.ok("error" in sanearMensajes(Array.from({ length: MAX_MENSAJES_POR_ENVIO + 1 }, () => ({ rol: "usuario", texto: "a" }))));
});

test("sanearMensajes: solo enlaces internos del panel", () => {
  const r = sanearMensajes([
    {
      rol: "asistente",
      texto: "Mirá",
      enlaces: [
        { href: "/campanas?perfil=marketing", texto: "Campañas" },
        { href: "https://otro.sitio", texto: "Afuera" },
        { href: "//otro.sitio", texto: "Afuera 2" },
        { href: "javascript:alert(1)", texto: "Malo" },
        { href: "/\\otro.sitio", texto: "Malo 2" },
        { href: "/bandeja", texto: "" },
      ],
    },
  ]);
  assert.ok("mensajes" in r);
  assert.deepEqual(r.mensajes[0].enlaces, [{ href: "/campanas?perfil=marketing", texto: "Campañas" }]);
});

test("sanearMensajes: propuestas que no entran en el tope se guardan sin detalle", () => {
  const grande = "x".repeat(MAX_BYTES_PROPUESTAS);
  const r = sanearMensajes([{ rol: "asistente", texto: "Listo", propuestas: [{ id: ID1, tipo: "publicaciones", titulo: "T", resumen: "R", estado: "propuesta", detalle: { piezas: grande } }] }]);
  assert.ok("mensajes" in r);
  assert.deepEqual(r.mensajes[0].propuestas, [{ id: ID1, tipo: "publicaciones", titulo: "T", resumen: "R", estado: "propuesta" }]);
});

test("tituloDeCharla: primer pedido en una línea y recortado", () => {
  assert.equal(tituloDeCharla([{ rol: "usuario", texto: "hola\n\n  ¿cómo  va?" }]), "hola ¿cómo va?");
  const t = tituloDeCharla([{ rol: "asistente", texto: "a" }, { rol: "usuario", texto: "y".repeat(200) }]);
  assert.equal(t.length, 80);
  assert.ok(t.endsWith("…"));
  assert.equal(tituloDeCharla([]), "Charla sin título");
});

test("refrescarPropuestas: toma el estado actual; el plan de campañas toma el detalle vigente", () => {
  const actuales = new Map<string, any>([
    [ID1, { tipo: "plan_campanas", estado: "hecha", titulo: "Plan nuevo", resumen: "R2", resultado: { ok: true }, payload: { campana: 1 } }],
    [ID2, { tipo: "cambio_agente", estado: "descartada", payload: { anterior: "interno" } }],
  ]);
  const r = refrescarPropuestas(
    [
      { id: ID1, tipo: "plan_campanas", estado: "propuesta", titulo: "Plan", resumen: "R", detalle: { campana: 0 } },
      { id: ID2, tipo: "cambio_agente", estado: "propuesta", titulo: "Cambio", detalle: { area: "civil" } },
      { id: "33333333-3333-4333-8333-333333333333", tipo: "x", estado: "propuesta" },
    ],
    actuales
  );
  assert.deepEqual(r[0], { id: ID1, tipo: "plan_campanas", estado: "hecha", titulo: "Plan nuevo", resumen: "R2", resultado: { ok: true }, detalle: { campana: 1 } });
  // El detalle de otras propuestas no se reemplaza por el payload interno.
  assert.deepEqual(r[1], { id: ID2, tipo: "cambio_agente", estado: "descartada", titulo: "Cambio", resumen: undefined, detalle: { area: "civil" } });
  assert.equal(r[2].estado, "propuesta");
});

test("idsDePropuestas: sin repetir y solo uuid", () => {
  assert.deepEqual(idsDePropuestas([{ propuestas: [{ id: ID1 }, { id: "malo" }] }, { propuestas: [{ id: ID1 }, { id: ID2 }] }, {}]), [ID1, ID2]);
});
