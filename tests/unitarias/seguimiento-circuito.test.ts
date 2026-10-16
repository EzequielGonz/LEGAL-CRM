// Etapa 2 · Bloque 2.3 — Circuito de seguimiento general (decisiones puras).
import test from "node:test";
import assert from "node:assert/strict";
import { decideCircuit, type ConversationSnapshot } from "@/lib/seguimiento/circuito";

const H = 3600 * 1000;
const t0 = new Date("2026-10-15T23:15:00Z"); // jueves 20:15 en Argentina
const at = (hours: number) => new Date(t0.getTime() + hours * H);
const enabledSince = new Date("2026-10-01T00:00:00Z");

function snap(p: Partial<ConversationSnapshot> & { lastAt?: number; lastDir?: "entrante" | "saliente"; sender?: string }): ConversationSnapshot {
  return {
    lastMessage: { direction: p.lastDir ?? "saliente", senderType: p.sender ?? "agente_ia", at: at(p.lastAt ?? 0), id: "m-ultimo" },
    lastInboundAt: p.lastInboundAt === undefined ? at(-1) : p.lastInboundAt,
    sent: p.sent ?? [],
  };
}

test("2.3: quien nunca respondió no recibe seguimiento (C09 y regla general)", () => {
  const d = decideCircuit(snap({ lastInboundAt: null }), { enabledSince, now: at(1) });
  assert.equal(d.action, "nada");
});

test("2.3: si la persona escribió último, la conversación está activa: nada", () => {
  const d = decideCircuit(snap({ lastDir: "entrante" }), { enabledSince, now: at(1) });
  assert.equal(d.action, "nada");
});

test("2.3: respondió y se interrumpió: se programa el contacto 2 desde nuestro último mensaje", () => {
  const d = decideCircuit(snap({}), { enabledSince, now: at(1) });
  assert.deepEqual(d, { action: "programar", step: 2, baseAt: t0, baseMessageId: "m-ultimo" });
});

test("2.3: las interrupciones anteriores a la activación no entran solas", () => {
  const d = decideCircuit(snap({}), { enabledSince: at(1), now: at(2) });
  assert.equal(d.action, "nada");
  if (d.action === "nada") assert.match(d.reason, /anterior a la activación/);
});

test("2.3: más de 72 h desde la interrupción sin tarea: queda para decisión manual", () => {
  assert.equal(decideCircuit(snap({}), { enabledSince, now: at(73) }).action, "nada");
});

test("2.3: el último mensaje lo mandó una persona del equipo: no es automático", () => {
  assert.equal(decideCircuit(snap({ sender: "admin" }), { enabledSince, now: at(1) }).action, "nada");
});

test("2.3: sin respuesta al contacto 2 se espera el plazo y se detiene, sin repesca", () => {
  const sent = [{ step: 2 as const, sentAt: at(48) }];
  const s = snap({ lastAt: 48, sent });
  assert.equal(decideCircuit(s, { enabledSince, now: at(100) }).action, "nada", "todavía dentro de las 72 h");
  const d = decideCircuit(s, { enabledSince, now: at(48 + 72) });
  assert.equal(d.action, "detener");
  if (d.action === "detener") {
    assert.equal(d.state, "caido");
    assert.equal(d.repesca, false);
  }
});

test("2.3: respondió al 2 y se volvió a interrumpir: contacto 3", () => {
  const sent = [{ step: 2 as const, sentAt: at(48) }];
  const s: ConversationSnapshot = {
    lastMessage: { direction: "saliente", senderType: "agente_ia", at: at(51), id: "m-respuesta-ia" },
    lastInboundAt: at(50),
    sent,
  };
  const d = decideCircuit(s, { enabledSince, now: at(52) });
  assert.deepEqual(d, { action: "programar", step: 3, baseAt: at(51), baseMessageId: "m-respuesta-ia" });
});

test("2.3: después del contacto 3, sin respuesta o sin avanzar: base para campaña manual (agotamiento, no baja)", () => {
  const sent = [
    { step: 2 as const, sentAt: at(48) },
    { step: 3 as const, sentAt: at(110) },
  ];
  // Sin respuesta al 3.
  const sin = snap({ lastAt: 110, lastInboundAt: at(50), sent });
  assert.equal(decideCircuit(sin, { enabledSince, now: at(150) }).action, "nada");
  const d1 = decideCircuit(sin, { enabledSince, now: at(110 + 72) });
  assert.equal(d1.action, "detener");
  if (d1.action === "detener") {
    assert.equal(d1.state, "completado");
    assert.equal(d1.repesca, true);
  }
  // Respondió al 3, siguió un poco y volvió a interrumpirse: no hay contacto 4.
  const con: ConversationSnapshot = {
    lastMessage: { direction: "saliente", senderType: "agente_ia", at: at(113), id: "m" },
    lastInboundAt: at(112),
    sent,
  };
  assert.equal(decideCircuit(con, { enabledSince, now: at(120) }).action, "nada");
  const d2 = decideCircuit(con, { enabledSince, now: at(113 + 72) });
  assert.equal(d2.action, "detener");
  if (d2.action === "detener") assert.equal(d2.repesca, true);
});

test("2.3: los mensajes de una conversación activa no cuentan como intentos", () => {
  // Muchos mensajes de la IA y de la persona, ningún contacto del circuito enviado: sigue siendo el contacto 2.
  const d = decideCircuit(snap({ lastAt: 30, lastInboundAt: at(29) }), { enabledSince, now: at(31) });
  assert.equal(d.action, "programar");
  if (d.action === "programar") assert.equal(d.step, 2);
});
