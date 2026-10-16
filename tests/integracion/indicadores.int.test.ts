// Etapa 2 · Bloque 2 — Cada indicador abre la lista exacta que cuenta (A03).
// La cifra, la lista y el cálculo único del perfil coinciden.
import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { RedSimulada, crearContacto, crearConversacion, esperarApi, prepararSesionDePrueba, sql } from "./soporte/entorno";
import { INDICADORES, contarIndicador, listarIndicador, TAMANO_PAGINA } from "@/lib/indicadores";
import { getProfileMetrics } from "@/lib/metrics";
import { ensureOpportunity } from "@/lib/opportunities";

const COBERTURAS = "33333333-3333-3333-3333-333333333333";
let red: RedSimulada;
before(async () => {
  red = new RedSimulada();
  await esperarApi();
  await prepararSesionDePrueba();
  // Datos inventados con estados variados (incluye más de una página).
  const estados = [
    "contact_state = 'respondio', capture_state = 'captado', derivation_state = 'derivado'",
    "contact_state = 'respondio', capture_state = 'captado', location_zone = 'fuera'",
    "contact_state = 'contactado_sin_respuesta', capture_state = 'en_conversacion'",
    "contact_state = 'error_contacto', capture_state = 'perdido', capture_reason = 'prueba'",
    "attention_state = 'requiere_humano', attention_category = 'comercial'",
    "attention_category = 'detencion'",
    "followup_state = 'caido', review_required = true",
  ];
  for (let i = 0; i < 60; i++) {
    const c = await crearContacto({ area: "coberturas_medicas", rubroId: COBERTURAS });
    const conv = await crearConversacion(c.id, { area: "coberturas_medicas" });
    const o = await ensureOpportunity({ contactId: c.id, conversationId: conv });
    sql(`update public.opportunities set ${estados[i % estados.length]} where id = '${o.id}'`);
  }
});
after(() => red.restaurar());

test("A03: cada cifra coincide con su lista y con el cálculo único del perfil", async () => {
  const m = await getProfileMetrics(COBERTURAS);
  assert.ok(m);
  for (const ind of INDICADORES) {
    const { count, error } = await contarIndicador(COBERTURAS, ind);
    assert.equal(error, null, ind.clave);
    const l1 = await listarIndicador(COBERTURAS, ind, { pagina: 1 });
    assert.equal(l1.error, null, ind.clave);
    assert.equal(l1.total, count, `${ind.clave}: la lista y la cifra son la misma consulta`);
    if (ind.metrica) assert.equal(count, ind.metrica(m!), `${ind.clave}: coincide con el cálculo único`);
    // Recorrer todas las páginas trae exactamente esa cantidad, sin repetidos.
    const ids = new Set<string>(l1.filas.map((f) => f.id));
    let pagina = 2;
    while (ids.size < (count ?? 0) && pagina < 10) {
      const lp = await listarIndicador(COBERTURAS, ind, { pagina });
      for (const f of lp.filas) ids.add(f.id);
      pagina++;
    }
    assert.equal(ids.size, count, `${ind.clave}: todas las páginas`);
  }
  const todas = INDICADORES.find((i) => i.clave === "oportunidades")!;
  assert.ok(((await contarIndicador(COBERTURAS, todas)).count ?? 0) > TAMANO_PAGINA, "hay más de una página");
});

test("los indicadores no mezclan perfiles", async () => {
  const captado = INDICADORES.find((i) => i.clave === "captado")!;
  const l = await listarIndicador(COBERTURAS, captado);
  const ids = l.filas.map((f) => `'${f.id}'`).join(",");
  assert.equal(sql(`select count(distinct rubro_id) from public.opportunities where id in (${ids})`), "1");
});
