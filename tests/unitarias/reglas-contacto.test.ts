// Etapa 2 · Bloque 2.0 — Reglas de contacto y calendario.
import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_CALENDAR,
  argentinaParts,
  calendarWith,
  channelWindow,
  chooseFollowupSlot,
  decideAtExecution,
  exceptionProblems,
  formatArgentina,
  isContactAllowed,
  messageKindAllowed,
  nextAllowedInstant,
  normalizeTargetHours,
} from "@/lib/contacto/reglas";

/** Instante a partir de una hora de pared argentina (UTC-3). */
const art = (day: string, hh: number, mm = 0) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh + 3, mm));
};
const H = 3600 * 1000;

// Semana de referencia: jueves 15/10/2026, sábado 17, domingo 18, lunes 19.
test("2.0: el 15/10/2026 es jueves y las partes se leen en hora argentina", () => {
  const p = argentinaParts(art("2026-10-15", 20, 15));
  assert.deepEqual(p, { day: "2026-10-15", weekday: 4, hour: 20, minute: 15 });
});

test("2.0: horario general de lunes a sábado de 8 a 21; domingo nunca; feriados no se excluyen", () => {
  assert.equal(isContactAllowed(art("2026-10-17", 8, 0)), true); // sábado 8:00
  assert.equal(isContactAllowed(art("2026-10-17", 20, 59)), true);
  assert.equal(isContactAllowed(art("2026-10-17", 21, 0)), false); // 21 no incluido
  assert.equal(isContactAllowed(art("2026-10-17", 7, 59)), false);
  assert.equal(isContactAllowed(art("2026-10-18", 12, 0)), false); // domingo
  // 12/10 es feriado nacional en Argentina y rige el mismo horario (pregunta 39).
  assert.equal(isContactAllowed(art("2026-10-12", 10, 0)), true);
});

test("2.0 (C08): jueves 20:15 + 60 h cae domingo 8:15 → sábado 20:15 (48 h), nunca domingo ni lunes 8", () => {
  const base = art("2026-10-15", 20, 15);
  const r = chooseFollowupSlot(base);
  assert.ok(r.ok);
  assert.equal(r.offsetHours, 48);
  assert.equal(r.at.toISOString(), art("2026-10-17", 20, 15).toISOString());
  assert.equal(formatArgentina(r.at), "sábado 17/10/2026 20:15");
});

test("2.0: se elige la franja válida más cercana al objetivo, dentro de 48 a 72 h", () => {
  // Lunes 10:00 + 60 h = miércoles 22:00 (fuera de horario) → miércoles 20:00 (58 h).
  const r = chooseFollowupSlot(art("2026-10-19", 10, 0));
  assert.ok(r.ok);
  assert.equal(r.offsetHours, 58);
  assert.equal(formatArgentina(r.at), "miércoles 21/10/2026 20:00");
  // Objetivo editable: 48 h.
  const r48 = chooseFollowupSlot(art("2026-10-19", 10, 0), { targetHours: 48 });
  assert.ok(r48.ok);
  assert.equal(r48.offsetHours, 48);
  // Objetivo fuera de rango: se usa 60.
  assert.equal(normalizeTargetHours(90), 60);
  assert.equal(normalizeTargetHours("50"), 50);
  assert.equal(normalizeTargetHours(55.5), 60);
});

test("2.0: sin franja válida en el plazo, conflicto (no se amplía a lunes)", () => {
  const cal = calendarWith([{ day: "2026-10-17", closed: true, note: "Cierre del estudio" }]);
  const r = chooseFollowupSlot(art("2026-10-15", 20, 15), { calendar: cal });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.conflict, "sin_franja_valida");
    assert.match(r.detail, /no se envía/);
  }
});

test("2.0: excepciones cargadas a mano: día cerrado u horario más corto; no abren domingos ni amplían el horario", () => {
  const cal = calendarWith([
    { day: "2026-10-16", closed: true },
    { day: "2026-10-17", closed: false, startHour: 9, endHour: 13 },
    { day: "2026-10-18", closed: false, startHour: 8, endHour: 21 }, // domingo: sigue cerrado
  ]);
  assert.equal(isContactAllowed(art("2026-10-16", 10), cal), false);
  assert.equal(isContactAllowed(art("2026-10-17", 8, 30), cal), false);
  assert.equal(isContactAllowed(art("2026-10-17", 12, 59), cal), true);
  assert.equal(isContactAllowed(art("2026-10-17", 13, 0), cal), false);
  assert.equal(isContactAllowed(art("2026-10-18", 10), cal), false);
  assert.deepEqual(exceptionProblems({ day: "2026-10-17", closed: false, startHour: 7, endHour: 22 }), [
    "El horario de una excepción tiene que quedar dentro del general (8 a 21).",
  ]);
  assert.equal(exceptionProblems({ day: "2026-02-30", closed: true }).length, 1);
  assert.equal(exceptionProblems({ day: "2026-10-17", closed: false, startHour: 12, endHour: 12 }).length, 1);
  assert.deepEqual(exceptionProblems({ day: "2026-10-17", closed: true }), []);
});

test("2.0: próximo instante permitido (campañas): sábado 21:30 → lunes 8; con el lunes cerrado → martes 8", () => {
  assert.equal(nextAllowedInstant(art("2026-10-17", 21, 30))?.toISOString(), art("2026-10-19", 8).toISOString());
  const cal = calendarWith([{ day: "2026-10-19", closed: true }]);
  assert.equal(nextAllowedInstant(art("2026-10-17", 21, 30), cal)?.toISOString(), art("2026-10-20", 8).toISOString());
  const dentro = art("2026-10-19", 9, 10);
  assert.equal(nextAllowedInstant(dentro)?.toISOString(), dentro.toISOString());
});

test("2.0: al ejecutar se repite la comprobación y nunca se amplía el plazo", () => {
  const base = art("2026-10-15", 20, 15);
  const scheduledAt = art("2026-10-17", 20, 15);
  const task = { base, scheduledAt };
  assert.equal(decideAtExecution(task, art("2026-10-17", 20, 0)).action, "esperar");
  assert.equal(decideAtExecution(task, art("2026-10-17", 20, 40)).action, "enviar");
  // El proceso se demoró y ya pasaron las 21: no queda ninguna franja del plazo.
  const tarde = decideAtExecution(task, art("2026-10-17", 21, 5));
  assert.equal(tarde.action, "conflicto");
  if (tarde.action === "conflicto") assert.equal(tarde.conflict, "sin_franja_valida");
  // Vencido el plazo de 72 h: conflicto por plazo, aunque el lunes haya horario.
  const vencida = decideAtExecution(task, art("2026-10-19", 9, 0));
  assert.equal(vencida.action, "conflicto");
  if (vencida.action === "conflicto") assert.equal(vencida.conflict, "plazo_vencido");
  // Una excepción cargada después de programar: el sábado ahora cierra a las 13.
  const cal = calendarWith([{ day: "2026-10-17", closed: false, startHour: 8, endHour: 13 }]);
  assert.equal(decideAtExecution(task, art("2026-10-17", 20, 15), cal).action, "conflicto");
});

test("2.0: si la franja programada dejó de valer pero queda otra en el plazo, se reprograma", () => {
  // Lunes 10:00 → miércoles 20:00 (58 h). El miércoles se cierra: queda jueves 8:00 (70 h).
  const base = art("2026-10-19", 10, 0);
  const first = chooseFollowupSlot(base);
  assert.ok(first.ok);
  const cal = calendarWith([{ day: "2026-10-21", closed: true }]);
  const d = decideAtExecution({ base, scheduledAt: first.at }, art("2026-10-21", 20, 0), cal);
  assert.equal(d.action, "reprogramar");
  if (d.action === "reprogramar") {
    assert.equal(d.offsetHours, 70);
    assert.equal(formatArgentina(d.at), "jueves 22/10/2026 08:00");
  }
});

test("2.0: ventana de 24 horas del canal: dentro, texto libre; fuera o sin mensajes, plantilla", () => {
  const last = art("2026-10-15", 10, 0);
  assert.equal(messageKindAllowed(last, new Date(last.getTime() + 23 * H)), "texto_libre");
  assert.equal(messageKindAllowed(last, new Date(last.getTime() + 24 * H)), "plantilla");
  assert.equal(messageKindAllowed(null, last), "plantilla");
  assert.equal(channelWindow(last, last).closesAt?.toISOString(), new Date(last.getTime() + 24 * H).toISOString());
  assert.deepEqual(DEFAULT_CALENDAR.exceptions, []);
});
