import { test } from "node:test";
import assert from "node:assert/strict";
import { decidirCaida, ESPERA_RESPUESTA_HORAS, SILENCIO_SIN_SEGUIMIENTO_HORAS, TOPE_SIN_ENVIAR_DIAS, type DatosCaida } from "../../src/lib/seguimiento/caidos";
import { decideCircuit } from "../../src/lib/seguimiento/circuito";
import { FOLLOWUP_RANGE } from "../../src/lib/contacto/reglas";

// 13/11 · «que pasen 3 días y otro mensaje, si no responde en 24 hs, a caídos».

const AHORA = new Date("2026-11-20T15:00:00Z");
const hace = (horas: number) => new Date(AHORA.getTime() - horas * 3_600_000);

function caso(cambios: Partial<DatosCaida> = {}): DatosCaida {
  return {
    ahora: AHORA,
    contacto: "respondio",
    captacion: "en_conversacion",
    atencion: "ia",
    seguimiento: "ninguno",
    ultimaPalabra: "nosotros",
    ultimoEntranteAt: hace(200),
    ultimoSalienteAt: hace(199),
    detenido: false,
    tareaAbierta: null,
    seguimientoEnviadoAt: null,
    ...cambios,
  };
}

test("caídos: los plazos son los que pidió la responsable", () => {
  assert.equal(ESPERA_RESPUESTA_HORAS, 24);
  assert.equal(SILENCIO_SIN_SEGUIMIENTO_HORAS, 96);
  assert.equal(TOPE_SIN_ENVIAR_DIAS, 7);
  assert.equal(FOLLOWUP_RANGE.defaultTargetHours, 72, "el mensaje sale a los 3 días");
});

test("caídos: recibió el seguimiento y no contestó en 24 horas", () => {
  const base = { ultimoEntranteAt: hace(100), ultimoSalienteAt: hace(23.99), seguimiento: "activo" };
  const antes = decidirCaida(caso({ ...base, seguimientoEnviadoAt: hace(23.99) }));
  assert.equal(antes.caer, false, "23 h 59 min: todavía se espera");
  const justo = decidirCaida(caso({ ...base, ultimoSalienteAt: hace(24), seguimientoEnviadoAt: hace(24) }));
  assert.deepEqual(justo, { caer: true, regla: "sin_respuesta_al_seguimiento", motivo: "No respondió al seguimiento" });
});

test("caídos: si contestó al seguimiento, no cae", () => {
  // Contestó y la última palabra es suya.
  assert.equal(decidirCaida(caso({ seguimientoEnviadoAt: hace(30), ultimoEntranteAt: hace(10), ultimaPalabra: "persona" })).caer, false);
  // Contestó, el bot le respondió y volvió a callar hace poco: empieza otra vez el plazo.
  const d = decidirCaida(caso({ seguimientoEnviadoAt: hace(60), ultimoEntranteAt: hace(40), ultimoSalienteAt: hace(39.9), ultimaPalabra: "nosotros" }));
  assert.equal(d.caer, false);
});

test("caídos: lo viejo va directo, sin otro mensaje", () => {
  assert.equal(decidirCaida(caso({ ultimoSalienteAt: hace(95.9) })).caer, false, "dentro de las 96 horas no cae");
  assert.deepEqual(decidirCaida(caso({ ultimoSalienteAt: hace(96) })), { caer: true, regla: "dejo_de_responder", motivo: "Dejó de responder" });
  assert.equal(decidirCaida(caso({ ultimoSalienteAt: hace(15 * 24) })).caer, true, "los de hace 15 días");
});

test("caídos: un seguimiento que no pudo salir en 7 días", () => {
  const tarea = (dias: number, estado = "programada") => ({ estado, baseAt: hace(dias * 24) });
  assert.equal(decidirCaida(caso({ seguimiento: "activo", tareaAbierta: tarea(5) })).caer, false, "una pausa general no lo hace caer antes");
  assert.equal(decidirCaida(caso({ seguimiento: "activo", tareaAbierta: tarea(6.9, "conflicto") })).caer, false);
  const d = decidirCaida(caso({ seguimiento: "activo", tareaAbierta: tarea(7, "pendiente") }));
  assert.deepEqual(d, { caer: true, regla: "no_se_pudo_enviar", motivo: "No se pudo enviar el seguimiento" });
  assert.equal(decidirCaida(caso({ seguimiento: "activo", tareaAbierta: tarea(9, "enviando") })).caer, false, "si está saliendo, se espera");
});

test("caídos: quién no cae nunca solo", () => {
  const viejo = { ultimoSalienteAt: hace(400) };
  assert.equal(decidirCaida(caso({ ...viejo, contacto: "contactado_sin_respuesta", ultimoEntranteAt: null })).caer, false, "nunca respondió");
  assert.equal(decidirCaida(caso({ ...viejo, captacion: "captado" })).caer, false, "captado");
  assert.equal(decidirCaida(caso({ ...viejo, captacion: "perdido" })).caer, false, "perdido");
  assert.equal(decidirCaida(caso({ ...viejo, detenido: true })).caer, false, "detenido");
  assert.equal(decidirCaida(caso({ ...viejo, seguimiento: "caido" })).caer, false, "ya cayó");
  assert.equal(decidirCaida(caso({ ...viejo, atencion: "requiere_humano" })).caer, false, "espera a una persona del equipo");
  assert.equal(decidirCaida(caso({ ...viejo, ultimaPalabra: "persona" })).caer, false, "le debemos una respuesta");
  assert.equal(decidirCaida(caso({ ...viejo, atencion: "humano_en_curso" })).caer, true, "lo atendió una persona y dejó de contestar: cae igual");
});

test("circuito: después del seguimiento se esperan 24 horas y pasa a Caídos", () => {
  const habilitado = new Date("2026-11-01T00:00:00Z");
  const snap = (horasDesdeEnvio: number, paso: 2 | 3 = 2) => ({
    lastMessage: { direction: "saliente" as const, senderType: "agente_ia", at: hace(horasDesdeEnvio), id: "m1" },
    lastInboundAt: hace(horasDesdeEnvio + 80),
    sent: paso === 2 ? [{ step: 2 as const, sentAt: hace(horasDesdeEnvio) }] : [{ step: 2 as const, sentAt: hace(horasDesdeEnvio + 200) }, { step: 3 as const, sentAt: hace(horasDesdeEnvio) }],
  });
  assert.equal(decideCircuit(snap(23), { enabledSince: habilitado, now: AHORA }).action, "nada");
  const d = decideCircuit(snap(25), { enabledSince: habilitado, now: AHORA });
  assert.deepEqual(d, { action: "detener", state: "caido", reason: "No respondió al seguimiento", repesca: false });
  const d3 = decideCircuit(snap(25, 3), { enabledSince: habilitado, now: AHORA });
  assert.equal(d3.action, "detener");
  assert.equal((d3 as any).state, "caido");
  assert.equal((d3 as any).repesca, true, "después del último seguimiento queda también en la base para campaña manual");
});
