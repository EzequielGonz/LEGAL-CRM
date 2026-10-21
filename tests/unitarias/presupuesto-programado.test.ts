import test from "node:test";
import assert from "node:assert/strict";
import { describirProgramacion, horaArgentinaAInstante, instanteAHoraArgentina, tocaEnviarProgramado, validarProgramacion } from "@/lib/marketing/programacion";
import { calendarWith } from "@/lib/contacto/reglas";

// Miércoles 21/10/2026 20:43 en Buenos Aires = 23:43 UTC.
const AHORA = new Date("2026-10-21T23:43:00Z");

test("presupuesto programado: la hora de Buenos Aires se convierte a UTC (UTC-3)", () => {
  assert.equal(horaArgentinaAInstante("2026-10-22T10:30")?.toISOString(), "2026-10-22T13:30:00.000Z");
  assert.equal(instanteAHoraArgentina(AHORA), "2026-10-21T20:43");
  assert.equal(horaArgentinaAInstante("2026-02-30T10:00"), null);
  assert.equal(horaArgentinaAInstante("2026-10-22 10:30"), null);
  assert.equal(horaArgentinaAInstante("2026-10-22T24:00"), null);
  assert.match(describirProgramacion(new Date("2026-10-22T13:30:00Z")), /jueves 22\/10 a las 10:30/);
});

test("presupuesto programado: solo lunes a sábado de 8 a 21, en el futuro y hasta 60 días", () => {
  assert.equal(validarProgramacion("2026-10-22T10:30", AHORA).ok, true);
  assert.equal(validarProgramacion("2026-10-22T07:59", AHORA).ok, false); // antes de las 8
  assert.equal(validarProgramacion("2026-10-22T21:00", AHORA).ok, false); // las 21 ya no valen
  assert.equal(validarProgramacion("2026-10-25T10:00", AHORA).ok, false); // domingo
  assert.equal(validarProgramacion("2026-10-24T20:59", AHORA).ok, true); // sábado
  assert.equal(validarProgramacion("2026-10-21T20:44", AHORA).ok, false); // menos de 2 min
  assert.equal(validarProgramacion("2027-01-10T10:00", AHORA).ok, false); // más de 60 días
  assert.equal(validarProgramacion("", AHORA).ok, false);
  const cerrado = calendarWith([{ day: "2026-10-22", closed: true }]);
  assert.equal(validarProgramacion("2026-10-22T10:30", AHORA, cerrado).ok, false); // día cerrado
});

test("presupuesto programado: sale una sola vez y recién a su hora", () => {
  assert.equal(tocaEnviarProgramado({ envio_programado_at: "2026-10-21T23:40:00Z", programado_procesado_at: null }, AHORA), true);
  assert.equal(tocaEnviarProgramado({ envio_programado_at: "2026-10-22T13:30:00Z", programado_procesado_at: null }, AHORA), false);
  assert.equal(tocaEnviarProgramado({ envio_programado_at: "2026-10-21T23:40:00Z", programado_procesado_at: "2026-10-21T23:41:00Z" }, AHORA), false);
  assert.equal(tocaEnviarProgramado({ envio_programado_at: null, programado_procesado_at: null }, AHORA), false);
});
