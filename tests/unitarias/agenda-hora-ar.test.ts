import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularTurnos, type ReglaTurnos } from "../../src/lib/agenda";

// Lunes a viernes, 9 a 13 y 14 a 18 (hora argentina), turnos de 30 minutos.
const reglas: ReglaTurnos[] = [1, 2, 3, 4, 5].flatMap((weekday) => [
  { weekday, start_time: "09:00", end_time: "13:00", slot_duration_minutes: 30 },
  { weekday, start_time: "14:00", end_time: "18:00", slot_duration_minutes: 30 },
]);

/** Hora y día de la semana en Argentina (UTC−3) de un instante ISO. */
function enAR(iso: string) {
  const d = new Date(Date.parse(iso) - 3 * 3_600_000);
  return { dia: d.getUTCDay(), minutos: d.getUTCHours() * 60 + d.getUTCMinutes(), fecha: d.toISOString().slice(0, 10) };
}

function dentroDeHorario(iso: string) {
  const { minutos } = enAR(iso);
  return (minutos >= 9 * 60 && minutos < 13 * 60) || (minutos >= 14 * 60 && minutos < 18 * 60);
}

test("agenda: viernes 22:30 AR → el próximo turno es el lunes a las 9 de Argentina", () => {
  const ahora = new Date("2026-11-28T01:30:00Z"); // viernes 27/11 22:30 AR (ya sábado en UTC)
  const turnos = calcularTurnos({ reglas, bloqueos: [], citas: [], ahora, limit: 20 });
  assert.equal(turnos.length, 20);
  assert.equal(turnos[0].starts_at, "2026-11-30T12:00:00.000Z"); // lunes 30/11 09:00 AR
  for (const t of turnos) {
    assert.ok(dentroDeHorario(t.starts_at), `fuera de horario: ${t.starts_at}`);
    const { dia } = enAR(t.starts_at);
    assert.ok(dia >= 1 && dia <= 5, `cae en fin de semana: ${t.starts_at}`);
  }
  // 8 turnos a la mañana y 8 a la tarde del lunes; el 17.º ya es el martes a las 9.
  assert.equal(turnos[8].starts_at, "2026-11-30T17:00:00.000Z"); // lunes 14:00 AR
  assert.equal(turnos[16].starts_at, "2026-12-01T12:00:00.000Z"); // martes 09:00 AR
});

test("agenda: lunes 08:00 AR → los turnos arrancan ese mismo lunes a las 9", () => {
  const ahora = new Date("2026-11-30T11:00:00Z"); // lunes 30/11 08:00 AR
  const turnos = calcularTurnos({ reglas, bloqueos: [], citas: [], ahora, limit: 10 });
  assert.equal(turnos[0].starts_at, "2026-11-30T12:00:00.000Z");
  assert.ok(turnos.every((t) => dentroDeHorario(t.starts_at) && enAR(t.starts_at).fecha === "2026-11-30"));
});

test("agenda: respeta citas tomadas, bloqueos y no ofrece horarios pasados", () => {
  const ahora = new Date("2026-11-30T13:10:00Z"); // lunes 10:10 AR
  const turnos = calcularTurnos({
    reglas,
    bloqueos: [{ starts_at: "2026-11-30T14:00:00Z", ends_at: "2026-11-30T15:00:00Z" }], // 11 a 12 AR
    citas: [
      { starts_at: "2026-11-30T13:30:00Z", ends_at: "2026-11-30T14:00:00Z" }, // 10:30 AR tomada
      { starts_at: "2026-11-30T15:00:00Z", ends_at: "2026-11-30T15:30:00Z", kind: "ia" }, // la IA no ocupa
    ],
    ahora,
    limit: 3,
  });
  assert.deepEqual(
    turnos.map((t) => t.starts_at),
    ["2026-11-30T15:00:00.000Z", "2026-11-30T15:30:00.000Z", "2026-11-30T17:00:00.000Z"],
  );
});
