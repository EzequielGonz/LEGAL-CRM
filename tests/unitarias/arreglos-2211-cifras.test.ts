import test from "node:test";
import assert from "node:assert/strict";
import { INDICADORES, indicadorPorClave } from "@/lib/indicadores";
import { coherenciaDeTotales, ESPERAN_A_UNA_PERSONA, esperaAUnaPersona, ROTULO } from "@/lib/definiciones/cifras";
import { estadoDeCampana } from "@/lib/definiciones/campanas";
import { CAPTURE_STATE_LABEL } from "@/lib/opportunities";
import { VISTAS_CARTERA } from "@/lib/cartera";

test("22/11: dos indicadores distintos nunca comparten rótulo", () => {
  const vistos = new Map<string, string>();
  for (const i of INDICADORES) {
    assert.ok(!vistos.has(i.label), `«${i.label}» está en ${vistos.get(i.label)} y en ${i.clave}`);
    vistos.set(i.label, i.clave);
  }
});

test("22/11: «En seguimiento» deja de ser tres cosas", () => {
  assert.equal(CAPTURE_STATE_LABEL.en_seguimiento, ROTULO.estadoConSeguimiento);
  assert.equal(indicadorPorClave("en_seguimiento")!.label, ROTULO.estadoConSeguimiento);
  assert.equal(indicadorPorClave("dejaron_de_responder")!.label, ROTULO.seInsiste);
  const grupo = VISTAS_CARTERA.contactos.grupos.find((g) => g.clave === "seguimiento")!;
  assert.equal(grupo.titulo, ROTULO.seInsiste);
  const rotulos = Object.values(CAPTURE_STATE_LABEL).concat(INDICADORES.map((i) => i.label));
  assert.equal(rotulos.filter((r) => r === "En seguimiento").length, 0);
});

test("22/11: «Perdidos» y «Perdidos por motivo comercial» son dos cifras con dos nombres", () => {
  assert.equal(indicadorPorClave("perdido")!.label, ROTULO.perdidosTodos);
  assert.equal(indicadorPorClave("perdido_comercial")!.label, ROTULO.perdidosComerciales);
});

test("22/11: una sola definición de «Esperan a una persona»", () => {
  assert.deepEqual(indicadorPorClave("requiere_humano")!.conds, ESPERAN_A_UNA_PERSONA);
  assert.equal(esperaAUnaPersona({ attention_state: "requiere_humano", capture_state: "en_conversacion", attention_category: null }), true);
  assert.equal(esperaAUnaPersona({ attention_state: "requiere_humano", capture_state: "perdido" }), false, "un perdido no espera a nadie");
  assert.equal(esperaAUnaPersona({ attention_state: "requiere_humano", capture_state: "nuevo", attention_category: "detencion" }), false, "una detención no es trabajo");
  assert.equal(esperaAUnaPersona({ attention_state: "ia", capture_state: "nuevo" }), false);
});

test("22/11: el total de personas cierra con los estados de contacto, que son excluyentes", () => {
  assert.deepEqual(coherenciaDeTotales({ oportunidades: 10, contacto: { sin_contactar: 4, contactado_sin_respuesta: 3, respondio: 2, error_contacto: 1 } }), { cierra: true, diferencia: 0 });
  const r = coherenciaDeTotales({ oportunidades: 7852, contacto: { sin_contactar: 4000, contactado_sin_respuesta: 3000, respondio: 800, error_contacto: 121 } });
  assert.equal(r.cierra, false);
  assert.equal(r.diferencia, 69);
});

const campana = { status: "en_curso", nombre: "Graves", prospectos: 182, enviados: 0, fallidos: 0, fallidos24h: 0 };

test("22/11: una campaña en curso sin ningún envío y con fallidos no «está enviando»", () => {
  const e = estadoDeCampana({ ...campana, fallidos24h: 17 });
  assert.equal(e.tono, "rojo");
  assert.doesNotMatch(e.texto, /^Campaña enviando/);
  assert.match(e.texto, /0 de 182/);
  assert.match(e.texto, /17/);
});

test("22/11: estados de campaña: enviando, enviando con fallas, pausada y frenada por la línea", () => {
  assert.deepEqual(estadoDeCampana({ ...campana, enviados: 40 }), { tono: "verde", texto: "Campaña enviando · 40 de 182" });
  assert.equal(estadoDeCampana({ ...campana, enviados: 100, fallidos24h: 17 }).tono, "amarillo");
  assert.equal(estadoDeCampana({ ...campana, enviados: 10, fallidos24h: 17 }).tono, "rojo");
  assert.equal(estadoDeCampana({ ...campana, status: "pausada", pauseReason: "calidad baja" }).tono, "amarillo");
  assert.equal(estadoDeCampana({ ...campana, frenadaPorLinea: true }).tono, "rojo");
  assert.equal(estadoDeCampana({ ...campana, enviados: 0 }).tono, "verde", "recién arrancada, sin fallas: bien");
});
