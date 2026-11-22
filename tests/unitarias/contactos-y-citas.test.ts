import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ACCIONES, armarConsulta, armarCsv, armarOrBusqueda, celdaCsv, cuerpoDeAccion, enlaceContactos, etapaDe, faltaTexto, fechaValida, idsValidos, inicioDiaAR, parsearFiltros, planDeLote, puedeHacer, TOPE_LOTE,
} from "@/lib/contactos/consulta";
import { accionesDeCita, agruparPorDia, instanteDesdeCampo, lunesDe, rangoDeVista, sePisan, textoRecordatorio, validarHorario } from "@/lib/agenda-vista";

test("filtros: lo desconocido se descarta y las fechas se ordenan", () => {
  const f = parsearFiltros({ etapa: "inventada", origen: "x", orden: "zzz", pagina: "-4", desde: "2026-11-20", hasta: "2026-11-01", q: "  Ana,(x) %  " });
  assert.equal(f.etapa, null);
  assert.equal(f.origen, null);
  assert.equal(f.orden, "reciente");
  assert.equal(f.pagina, 1);
  assert.equal(f.desde, "2026-11-01");
  assert.equal(f.hasta, "2026-11-20");
  assert.equal(f.q, "Ana x");
  assert.equal(fechaValida("2026-02-31"), null);
});

test("filtros: el área solo vale en perfiles con varias áreas", () => {
  assert.equal(parsearFiltros({ area: "penal" }, ["civil", "penal"]).area, "penal");
  assert.equal(parsearFiltros({ area: "penal" }, ["marketing"]).area, null);
  assert.equal(parsearFiltros({ area: "otra" }, ["civil", "penal"]).area, null);
});

test("consulta: etapa usa las condiciones del indicador, origen, fechas en hora argentina y paginación", () => {
  const f = parsearFiltros({ etapa: "captado", origen: "landing", desde: "2026-11-10", hasta: "2026-11-10", orden: "interes", pagina: "3" });
  const c = armarConsulta(f, 25);
  assert.deepEqual(c.conds.slice(0, 1), [{ col: "capture_state", op: "eq", value: "captado" }]);
  assert.ok(c.conds.some((x) => x.col === "first_source" && (x as any).value === "landing"));
  assert.equal(c.fecha.desde, "2026-11-10T03:00:00.000Z");
  assert.equal(c.fecha.hastaExclusivo, "2026-11-11T03:00:00.000Z");
  assert.deepEqual(c.orden, { col: "interest_score", asc: false });
  assert.deepEqual(c.desplazamiento, { from: 50, to: 74 });
  assert.equal(inicioDiaAR("2026-11-10"), "2026-11-10T03:00:00.000Z");
});

test("búsqueda: nombre o teléfono, sin separadores peligrosos", () => {
  assert.equal(armarOrBusqueda(""), null);
  assert.equal(armarOrBusqueda("%_,()"), null);
  assert.equal(armarOrBusqueda("Ana"), "full_name.ilike.%Ana%,phone.ilike.%Ana%");
  assert.equal(armarOrBusqueda("11 5555-1234"), "full_name.ilike.%11 5555-1234%,phone.ilike.%1155551234%");
});

test("enlaces: cambiar un filtro vuelve a la página 1 y conserva el resto", () => {
  const f = parsearFiltros({ q: "ana", etapa: "perdido", pagina: "4" });
  const e = enlaceContactos("/contactos", "juridico", f, { origen: "landing" });
  assert.match(e, /perfil=juridico/);
  assert.match(e, /q=ana/);
  assert.match(e, /origen=landing/);
  assert.doesNotMatch(e, /pagina=/);
  assert.match(enlaceContactos("/contactos", "juridico", f, { pagina: "5" }), /pagina=5/);
});

test("etapa mostrada: detenido > perdido > derivado > captado > charla > respuesta", () => {
  assert.equal(etapaDe({ attention_category: "detencion", capture_state: "captado" }), "no_contactar");
  assert.equal(etapaDe({ capture_state: "perdido", contact_state: "respondio" }), "perdido");
  assert.equal(etapaDe({ capture_state: "captado", derivation_state: "derivado" }), "derivado");
  assert.equal(etapaDe({ capture_state: "captado", derivation_state: "no_derivado" }), "captado");
  assert.equal(etapaDe({ capture_state: "en_seguimiento" }), "en_conversacion");
  assert.equal(etapaDe({ contact_state: "contactado_sin_respuesta", capture_state: "nuevo" }), "sin_respuesta");
  assert.equal(etapaDe({}), "sin_contactar");
});

test("acciones: solo lo que la regla permite y con el cuerpo de la ruta existente", () => {
  const nuevo = { capture_state: "nuevo", derivation_state: "no_derivado" };
  const captado = { capture_state: "captado", derivation_state: "no_derivado" };
  const derivado = { capture_state: "captado", derivation_state: "derivado" };
  assert.equal(puedeHacer("derivar", nuevo).ok, false);
  assert.equal(puedeHacer("derivar", captado).ok, true);
  assert.equal(puedeHacer("derivar", derivado).ok, false);
  assert.equal(puedeHacer("no_derivar", derivado).ok, true);
  assert.equal(puedeHacer("captar", { capture_state: "perdido", derivation_state: "no_derivado" }).ok, false);
  assert.equal(puedeHacer("perder", { capture_state: "perdido", derivation_state: "no_derivado" }).ok, false);
  assert.equal(puedeHacer("no_contactar", { ...nuevo, detenido: true }).ok, false);
  assert.deepEqual(cuerpoDeAccion("perder", " sin interés "), { accion: "perder", motivo: "sin interés" });
  assert.deepEqual(cuerpoDeAccion("derivar", ""), { accion: "derivar" });
  assert.deepEqual(cuerpoDeAccion("no_contactar", ""), { accion: "atencion_motivo", motivo: "no_quiere_mensajes" });
  assert.ok(faltaTexto("perder", "  "));
  assert.equal(faltaTexto("derivar", ""), null);
  assert.equal(ACCIONES.captar.obligatorio, true);
});

test("lote: aplica a quienes corresponde, saltea al resto con motivo y respeta el tope", () => {
  const filas = [
    { id: "a", nombre: "A", estado: { capture_state: "captado", derivation_state: "no_derivado" } },
    { id: "b", nombre: "B", estado: { capture_state: "nuevo", derivation_state: "no_derivado" } },
    { id: "c", nombre: "C", estado: { capture_state: "captado", derivation_state: "derivado" } },
  ];
  const p = planDeLote("derivar", filas);
  assert.deepEqual(p.aplicables, ["a"]);
  assert.equal(p.omitidas.length, 2);
  assert.match(p.omitidas[0].porque, /captado/);
  const muchas = Array.from({ length: TOPE_LOTE + 5 }, (_, i) => ({ id: String(i), nombre: "x", estado: { capture_state: "nuevo", derivation_state: "no_derivado" } }));
  const q = planDeLote("perder", muchas);
  assert.equal(q.aplicables.length, TOPE_LOTE);
  assert.equal(q.excedeTope, true);
});

test("ids: solo UUID válidos, sin repetir", () => {
  const u = "123e4567-e89b-12d3-a456-426614174000";
  assert.deepEqual(idsValidos(`${u},${u.toUpperCase()},nada,1;drop`), [u]);
  assert.deepEqual(idsValidos(undefined), []);
});

test("CSV: neutraliza fórmulas, escapa comillas, lleva BOM y solo las columnas previstas", () => {
  assert.equal(celdaCsv("=1+1"), `"'=1+1"`);
  assert.equal(celdaCsv('Dijo "hola", chau'), '"Dijo ""hola"", chau"');
  assert.equal(celdaCsv(null), "");
  const csv = armarCsv([{ nombre: "Persona de prueba", telefono: "+540000", etapa: "Captados", estado: "Captado", area: "civil", origen: "Landing", actividad: null, alta: null }]);
  assert.ok(csv.startsWith("﻿Nombre,Teléfono,Etapa,Estado,Área,Origen,Última actividad,Alta\r\n"));
  assert.equal(csv.trim().split("\r\n").length, 2);
});

test("citas: semana de lunes a domingo en hora argentina", () => {
  assert.equal(lunesDe("2026-11-22"), "2026-11-16"); // domingo
  const r = rangoDeVista("semana", "2026-11-18");
  assert.equal(r.dias.length, 7);
  assert.equal(r.dias[0], "2026-11-16");
  assert.equal(r.dias[6], "2026-11-22");
  assert.equal(r.desde, "2026-11-16T03:00:00.000Z");
  assert.equal(r.hastaExclusivo, "2026-11-23T03:00:00.000Z");
  assert.equal(rangoDeVista("dia", "2026-11-18").dias.length, 1);
});

test("citas: agrupa por día argentino (22:30 locales cae en su día, no en el siguiente UTC)", () => {
  const g = agruparPorDia([{ starts_at: "2026-11-19T01:30:00.000Z" }, { starts_at: "2026-11-18T15:00:00.000Z" }], ["2026-11-18", "2026-11-19"]);
  assert.equal(g[0].citas.length, 2);
  assert.equal(g[1].citas.length, 0);
  assert.ok(g[0].citas[0].starts_at < g[0].citas[1].starts_at);
});

test("citas: horario válido, futuro y con duración razonable", () => {
  const ahora = new Date("2026-11-22T12:00:00Z");
  assert.equal(instanteDesdeCampo("2026-11-23T10:00"), "2026-11-23T13:00:00.000Z");
  assert.equal(instanteDesdeCampo("mañana"), null);
  assert.ok(validarHorario(null, 30, ahora));
  assert.ok(validarHorario("2026-11-20T10:00:00.000Z", 30, ahora));
  assert.ok(validarHorario("2026-11-23T10:00:00.000Z", 5, ahora));
  assert.equal(validarHorario("2026-11-23T10:00:00.000Z", 30, ahora), null);
});

test("citas: superposición y acciones según estado", () => {
  const a = { starts_at: "2026-11-23T10:00:00Z", ends_at: "2026-11-23T10:30:00Z" };
  assert.equal(sePisan(a, { starts_at: "2026-11-23T10:15:00Z", ends_at: "2026-11-23T10:45:00Z" }), true);
  assert.equal(sePisan(a, { starts_at: "2026-11-23T10:30:00Z", ends_at: "2026-11-23T11:00:00Z" }), false);
  assert.equal(accionesDeCita({ status: "confirmada", kind: "profesional" }).mover, true);
  assert.equal(accionesDeCita({ status: "confirmada", kind: "ia" }).mover, false);
  assert.equal(accionesDeCita({ status: "cancelada" }).asistio, false);
  assert.equal(accionesDeCita({ status: "ausente" }).reabrir, true);
});

test("recordatorio: usa el primer nombre, el día y la hora argentina", () => {
  const t = textoRecordatorio("Persona Ejemplo", "2026-11-23T13:00:00.000Z", "Consulta");
  assert.match(t, /^Hola Persona,/);
  assert.match(t, /10:00/);
  assert.match(t, /\(Consulta\)/);
  assert.match(textoRecordatorio(null, "2026-11-23T13:00:00.000Z"), /^Hola, te recordamos/);
});
