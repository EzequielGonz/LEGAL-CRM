import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PROVINCIAS_AR,
  avanzarEtapa,
  cantidadParaZona,
  consultaZona,
  esAceptacion,
  fusionarDatosVenta,
  guiaVenta,
  nombreBaseSugerido,
  textoEnvioPresupuesto,
  validarExtraccion,
  ventanaAbierta,
  zonasDeExtraccion,
} from "@/lib/marketing/venta";

test("zonas: Toda Argentina se reparte en 24 jurisdicciones; sin repetidos", () => {
  assert.equal(zonasDeExtraccion(["Toda Argentina"]).length, 24);
  assert.equal(PROVINCIAS_AR.length, 24);
  assert.deepEqual(zonasDeExtraccion(["Córdoba", " córdoba ", "Rosario"]), ["Córdoba", "Rosario"]);
  assert.equal(consultaZona("pizzerías", "Rosario"), "pizzerías en Rosario, Argentina");
});

test("cantidad por zona: reparte el tope y nunca se pasa", () => {
  assert.equal(cantidadParaZona({ maxTotal: 100, encontrados: 0, zonasRestantes: 24 }), 5);
  assert.equal(cantidadParaZona({ maxTotal: 500, encontrados: 0, zonasRestantes: 2 }), 60);
  assert.equal(cantidadParaZona({ maxTotal: 100, encontrados: 100, zonasRestantes: 3 }), 0);
  assert.equal(cantidadParaZona({ maxTotal: 10, encontrados: 9, zonasRestantes: 5 }), 1);
});

test("nombre de base sugerido y topes de gasto", () => {
  const f = new Date(2026, 9, 16);
  assert.equal(nombreBaseSugerido("pizzerías", ["Toda Argentina"], f), "Pizzerías · Toda Argentina · 16/10/2026");
  assert.equal(nombreBaseSugerido("gimnasios", ["Córdoba", "Rosario", "Salta"], f), "Gimnasios · Córdoba y 2 zonas más · 16/10/2026");
  const lim = { por_extraccion: 500, por_dia: 1000 };
  assert.deepEqual(validarExtraccion({ tipo: "bares", zonas: ["Córdoba"], cantidad: 100, nombre: "Bares" }, lim, 0), []);
  assert.ok(validarExtraccion({ tipo: "bares", zonas: ["Córdoba"], cantidad: 600, nombre: "Bares" }, lim, 0).some((e) => e.includes("por extracción")));
  assert.ok(validarExtraccion({ tipo: "bares", zonas: ["Córdoba"], cantidad: 300, nombre: "Bares" }, lim, 800).some((e) => e.includes("Hoy quedan 200")));
});

test("aceptación de la apertura: sí / dale / contame; no, ahora no, más tarde → no", () => {
  for (const t of ["Sí, contame", "si", "Dale", "contame", "ok", "Bueno, dale", "Sí claro", "me interesa"]) assert.ok(esAceptacion(t), t);
  for (const t of ["No", "ahora no", "No me interesa", "más tarde", "sí pero ahora no puedo", "quién sos?", "", "No me escriban más"]) assert.ok(!esAceptacion(t), t);
});

test("etapas: solo avanzan; no interesado en cualquier momento salvo después del cierre", () => {
  assert.equal(avanzarEtapa("apertura", "acepto"), "acepto");
  assert.equal(avanzarEtapa("propuesta", "acepto"), "propuesta");
  assert.equal(avanzarEtapa("propuesta", "no_interesado"), "no_interesado");
  assert.equal(avanzarEtapa("cerrado", "no_interesado"), "cerrado");
  assert.equal(avanzarEtapa("no_interesado", "presupuesto_pedido"), "presupuesto_pedido");
  assert.equal(avanzarEtapa(null, "presupuesto_enviado"), "presupuesto_enviado");
});

test("datos de venta: se suman sin perder ni repetir", () => {
  const a = fusionarDatosVenta({ servicios_conversados: ["Sitio web"], objeciones: ["precio"] }, { servicios_conversados: ["sitio web", "Google Maps"], necesidad: "más clientes" });
  assert.deepEqual(a.servicios_conversados, ["Sitio web", "Google Maps"]);
  assert.deepEqual(a.objeciones, ["precio"]);
  assert.equal(a.necesidad, "más clientes");
});

test("ventana de 24 h y texto del envío", () => {
  const ahora = new Date("2026-10-16T12:00:00Z");
  assert.ok(ventanaAbierta("2026-10-16T01:00:00Z", ahora));
  assert.ok(!ventanaAbierta("2026-10-15T11:00:00Z", ahora));
  assert.ok(!ventanaAbierta(null, ahora));
  const t = textoEnvioPresupuesto({ nombre: "Laura Pérez", monto: 350000, moneda: "ARS", plazo: "15 días" });
  assert.match(t, /^Laura, te paso el presupuesto/);
  assert.match(t, /ARS 350\.000/);
});

test("guía de venta: la apertura no afirma investigación; el cierre siempre pregunta por el presupuesto", () => {
  const g = guiaVenta({ etapa: "apertura", origen: "scraper", presentacion: "Leonardo Gonzalez", marca: "Kocos Marketing", analisisListo: false });
  assert.ok(g.some((x) => x.includes("NO digas que ya analizaste")));
  assert.ok(g.some((x) => x.includes("preguntá SIEMPRE si quiere que le preparemos un presupuesto")));
  assert.ok(g.some((x) => x.includes("menos de 24 horas")));
  const e = guiaVenta({ etapa: "presupuesto_enviado", origen: "scraper", presentacion: "", marca: "", analisisListo: true, presupuesto: { estado: "enviado", monto: 100, moneda: "USD", plazo: "10 días" } });
  assert.ok(e.some((x) => x.includes("presupuesto_aprobado")));
});
