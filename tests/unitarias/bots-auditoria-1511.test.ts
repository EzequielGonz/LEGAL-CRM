import { test } from "node:test";
import assert from "node:assert/strict";
import { esCrisis, esEnojoConNosotros, TEXTO_CRISIS, TEXTO_DISCULPA_AMENAZA, TEXTO_DISCULPA_ENOJO } from "../../src/lib/agentes/crisis-y-enojo";
import { esRespuestaAutomatica, motivoParaNoResponder } from "../../src/lib/agentes/automaticos";
import { validarTextoSalida } from "../../src/lib/agentes/contrato";
import { aceptacionReal } from "../../src/lib/agentes/aceptacion";
import { marcaDeTiempo } from "../../src/lib/agentes/tiempo-historial";
import { conTiempoYReintento, TiempoAgotadoError } from "../../src/lib/ai-agent/reintento";

test("crisis: detecta lo serio y no lo dicho en broma", () => {
  for (const t of ["no quiero vivir más", "me quiero matar", "pienso en suicidarme", "a veces pienso en morir", "me voy a quitar la vida", "sería mejor estar muerto"]) {
    assert.ok(esCrisis(t), t);
  }
  for (const t of ["me muero de risa", "me quiero matar de vergüenza jaja", "hola, quiero info", "la ART me está matando con los trámites"]) {
    assert.ok(!esCrisis(t), t);
  }
});

test("crisis: el texto tiene las líneas de ayuda y pasa el validador", () => {
  assert.match(TEXTO_CRISIS, /135/);
  assert.match(TEXTO_CRISIS, /911/);
  assert.ok(!/[*_#]/.test(TEXTO_CRISIS), "sin markdown");
});

test("enojo: solo cuando es con nosotros", () => {
  for (const t of ["dejen de joder", "basta de mensajes", "no me jodan más", "esto es spam", "me tienen podrido con los mensajes"]) {
    assert.ok(esEnojoConNosotros(t), t);
  }
  for (const t of ["la ART son unos chorros", "estoy podrido del dolor de espalda", "mi jefe me tiene harto", "hola"]) {
    assert.ok(!esEnojoConNosotros(t), t);
  }
  for (const t of [TEXTO_DISCULPA_ENOJO, TEXTO_DISCULPA_AMENAZA]) {
    assert.ok(validarTextoSalida(t).ok, t);
    assert.ok(!t.includes("?"));
  }
});

test("contestadores: en castellano, inglés y portugués; una persona no", () => {
  for (const t of [
    "Gracias por comunicarte. Soy un asistente virtual, escribí MENU para ver las opciones.",
    "Thank you for contacting us. We are closed right now and we'll get back to you soon.",
    "Obrigado por entrar em contato! No momento não podemos atender, responderemos em breve.",
  ]) {
    assert.ok(esRespuestaAutomatica(t), t);
  }
  for (const t of ["hola, quién sos?", "sí, me interesa", "no gracias"]) assert.ok(!esRespuestaAutomatica(t), t);
});

test("una persona que contesta corto y rápido no es un bucle", () => {
  const base = Date.parse("2026-11-15T15:00:00Z");
  const h: any[] = [];
  for (let i = 0; i < 5; i++) {
    h.push({ direction: "saliente", sender_type: "agente_ia", body: "¿Te queda mejor mañana o a la tarde?", created_at: new Date(base + i * 20_000).toISOString() });
    h.push({ direction: "entrante", sender_type: "contacto", body: ["sí", "dale", "ok", "mañana", "gracias"][i], created_at: new Date(base + i * 20_000 + 4_000).toISOString() });
  }
  assert.equal(motivoParaNoResponder(h, new Date(base + 120_000)), null);
});

test("validador: precios con «lucas», «k», en palabras y promesas", () => {
  for (const t of ["Sale 40 lucas por mes.", "El plan arranca en 35k.", "Son cuarenta mil pesos.", "Rondan los 50 mil.", "Tenés muchas chances de cobrar.", "La ART te tiene que pagar."]) {
    assert.ok(!validarTextoSalida(t).ok, t);
  }
  for (const t of ["Atendemos desde las 9 hasta las 18 hs.", "¿Te llamamos mañana o a la tarde?", "En 2 días hábiles te contacta un asesor."]) {
    assert.ok(validarTextoSalida(t).ok, `${t} ${JSON.stringify(validarTextoSalida(t))}`);
  }
});

test("llave de aceptación antes de captar", () => {
  for (const t of ["sí, llamame mañana", "dale", "a la tarde", "¿me pueden llamar mañana?", "ahora no puedo, llamame a la tarde", "Me interesa"]) {
    assert.deepEqual(aceptacionReal(t), { ok: true }, t);
  }
  for (const t of ["no me interesa", "ahora no", "no, gracias", "lo voy a pensar"]) {
    assert.equal((aceptacionReal(t) as any).motivo, "rechazo", t);
  }
  for (const t of ["¿cuánto sale?", "¿de dónde son?"]) {
    assert.equal((aceptacionReal(t) as any).motivo, "pregunta_sin_aceptacion", t);
  }
});

test("fechas en el historial: solo después de más de un día", () => {
  assert.equal(marcaDeTiempo("2026-11-10T12:00:00Z", "2026-11-10T20:00:00Z"), null);
  assert.equal(marcaDeTiempo(null, "2026-11-10T20:00:00Z"), null);
  assert.equal(marcaDeTiempo("2026-11-10T12:00:00Z", "2026-11-13T15:00:00Z"), "[Escribió el 13/11, 3 días después]");
  assert.equal(marcaDeTiempo("2026-11-10T12:00:00Z", "2026-11-11T13:00:00Z"), "[Escribió el 11/11, 1 día después]");
});

test("reintento: corta por tiempo, reintenta una vez y si sale bien devuelve", async () => {
  let n = 0;
  const r = await conTiempoYReintento(
    async () => {
      n++;
      if (n === 1) throw new Error("falla");
      return "ok";
    },
    { esperar: async () => {} }
  );
  assert.equal(r, "ok");
  assert.equal(n, 2);
  n = 0;
  await assert.rejects(
    conTiempoYReintento(() => { n++; return new Promise(() => {}); }, { tiempoMs: 20, esperar: async () => {} }),
    (e: unknown) => e instanceof TiempoAgotadoError
  );
  assert.equal(n, 2);
});
