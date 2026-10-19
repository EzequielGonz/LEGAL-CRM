import { test } from "node:test";
import assert from "node:assert/strict";
import {
  estadoVisible,
  filaATarea,
  HORAS_SIN_AVANCE,
  ordenarTareas,
  pareceDatoPersonal,
  perfilDeRubroId,
  puedeDescartar,
  resumenBandeja,
  rubroIdDePerfil,
  validarEnlaces,
  validarMotivo,
  validarPedido,
  MAX_PEDIDO,
} from "@/lib/bandeja-claude";

const AHORA = new Date("2026-10-19T15:00:00Z");
const hace = (h: number) => new Date(AHORA.getTime() - h * 3600 * 1000).toISOString();

test("bandeja: el pedido se recorta y no puede quedar vacío ni pasarse de largo", () => {
  assert.deepEqual(validarPedido("  Armá 10 posts para Coberturas  "), { ok: true, valor: "Armá 10 posts para Coberturas" });
  assert.equal(validarPedido("   ").ok, false);
  assert.equal(validarPedido(undefined).ok, false);
  assert.equal(validarPedido("a".repeat(MAX_PEDIDO + 1)).ok, false);
});

test("bandeja: rechaza correos, teléfonos y documentos (datos de prospectos)", () => {
  for (const t of [
    "Escribile a juan.perez@ejemplo.com",
    "Llamá al 11 5555-5555",
    "El número es +54 9 11 5555 5555",
    "Tel 4444-5555 de la clienta",
    "DNI 30.123.456",
    "Probá con 1155555555",
  ]) {
    assert.equal(validarPedido(t).ok, false, t);
    assert.ok(pareceDatoPersonal(t), t);
  }
});

test("bandeja: fechas, rangos de años, precios y cantidades no son datos personales", () => {
  for (const t of [
    "Calendario del 2026-11-01 al 2026-11-30",
    "Temporada 2025-2026",
    "Presupuesto de $ 15.000.000 para la campaña",
    "Generá 30 publicaciones y 4 historias destacadas",
    "Mejorá la landing de 0 km (versión 1.2.3)",
  ]) {
    assert.equal(pareceDatoPersonal(t), null, t);
    assert.equal(validarPedido(t).ok, true, t);
  }
});

test("bandeja: enlaces de referencia, hasta 5, solo web y sin contacto directo", () => {
  assert.deepEqual(validarEnlaces(undefined), { ok: true, valor: [] });
  assert.deepEqual(validarEnlaces("https://a.com/x  https://a.com/x\nhttps://b.com"), { ok: true, valor: ["https://a.com/x", "https://b.com"] });
  assert.equal(validarEnlaces(["https://1.com", "https://2.com", "https://3.com", "https://4.com", "https://5.com", "https://6.com"]).ok, false);
  assert.equal(validarEnlaces(["ftp://a.com"]).ok, false);
  assert.equal(validarEnlaces(["javascript:alert(1)"]).ok, false);
  assert.equal(validarEnlaces(["no es un enlace"]).ok, false);
  assert.equal(validarEnlaces(["https://wa.me/5491155555555"]).ok, false);
  assert.equal(validarEnlaces(["https://usuario:clave@a.com"]).ok, false);
  assert.equal(validarEnlaces(["https://a.com/?mail=juan%40ejemplo.com"]).ok, false);
  assert.equal(validarEnlaces(["https://" + "a".repeat(600) + ".com"]).ok, false);
});

test("bandeja: descartar pide motivo y solo vale para pendientes o en espera", () => {
  assert.equal(validarMotivo("").ok, false);
  assert.equal(validarMotivo("ya no").ok, true);
  assert.equal(validarMotivo("Lo hizo otra persona, tel 11 5555-5555").ok, false);
  assert.equal(puedeDescartar("pendiente"), true);
  assert.equal(puedeDescartar("en_espera"), true);
  assert.equal(puedeDescartar("en_curso"), false);
  assert.equal(puedeDescartar("lista"), false);
  assert.equal(puedeDescartar("descartada"), false);
});

test("bandeja: una tarea en curso sin avance se muestra en espera; la que dejó Claude en espera conserva su motivo", () => {
  const fresca = estadoVisible({ estado: "en_curso", motivo_espera: null, updated_at: hace(1) }, AHORA);
  assert.deepEqual(fresca, { estado: "en_curso", aviso: null, deducido: false });
  const trabada = estadoVisible({ estado: "en_curso", motivo_espera: null, updated_at: hace(HORAS_SIN_AVANCE + 0.5) }, AHORA);
  assert.equal(trabada.estado, "en_espera");
  assert.equal(trabada.deducido, true);
  assert.match(trabada.aviso ?? "", /uso del plan/);
  const espera = estadoVisible({ estado: "en_espera", motivo_espera: "Falta que elijas el tono", updated_at: hace(1) }, AHORA);
  assert.deepEqual(espera, { estado: "en_espera", aviso: "Falta que elijas el tono", deducido: false });
  assert.equal(estadoVisible({ estado: "pendiente", motivo_espera: null, updated_at: hace(100) }, AHORA).estado, "pendiente");
});

test("bandeja: orden y resumen ponen arriba lo que necesita atención", () => {
  const t = (id: string, estado: any, creada: number, tocada = creada) => ({ id, estado, motivo_espera: null, created_at: hace(creada), updated_at: hace(tocada) });
  const lista = [t("l1", "lista", 50), t("p2", "pendiente", 2), t("c1", "en_curso", 3, 1), t("p1", "pendiente", 5), t("c0", "en_curso", 20, 10), t("d1", "descartada", 1), t("l2", "lista", 10)];
  assert.deepEqual(ordenarTareas(lista, AHORA).map((x) => x.id), ["c0", "c1", "p1", "p2", "l2", "l1", "d1"]);
  assert.deepEqual(resumenBandeja(lista, AHORA), { en_espera: 1, en_curso: 1, pendiente: 2, lista: 2, descartada: 1 });
});

test("bandeja: perfil ↔ rubro y normalización de filas", () => {
  for (const slug of ["juridico", "coberturas_medicas", "agencia_0km", "marketing"] as const) {
    const id = rubroIdDePerfil(slug);
    assert.ok(id);
    assert.equal(perfilDeRubroId(id), slug);
  }
  assert.equal(rubroIdDePerfil("otro"), null);
  assert.equal(perfilDeRubroId("x"), null);
  assert.equal(filaATarea({ id: "a", estado: "rara" }), null);
  const f = filaATarea({ id: "a", rubro_id: "r", pedido: "p", estado: "lista", enlaces: ["https://a.com", 3, "javascript:alert(1)", "data:text/html,x"], resultado_enlaces: null, created_at: "2026-10-19T00:00:00Z" });
  assert.deepEqual(f?.enlaces, ["https://a.com"]);
  assert.deepEqual(f?.resultado_enlaces, []);
  assert.equal(f?.updated_at, "2026-10-19T00:00:00Z");
});
