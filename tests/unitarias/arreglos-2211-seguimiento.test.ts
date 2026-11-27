import test from "node:test";
import assert from "node:assert/strict";
import { chooseFollowupSlot, decideAtExecution } from "@/lib/contacto/reglas";

/** Instante a partir de una hora de pared argentina (UTC-3). */
const art = (day: string, hh: number, mm = 0) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh + 3, mm));
};
const H = 3600 * 1000;

// Arreglo 22/11 (15 §3 ítem 1): con objetivo 72 h (= tope) la franja se programa justo en el tope y el
// latido corre unos minutos después: antes siempre caía en «plazo vencido» y no salía ningún contacto 2.
test("22/11: objetivo 72 h: la tarea programada en el tope sale aunque el latido llegue unos minutos tarde", () => {
  const base = art("2026-11-16", 10, 0); // lunes
  const slot = chooseFollowupSlot(base, { targetHours: 72, notBefore: art("2026-11-16", 10, 5) });
  assert.ok(slot.ok);
  assert.equal(slot.offsetHours, 72);
  const task = { base, scheduledAt: slot.at, targetHours: 72 };
  assert.equal(decideAtExecution(task, new Date(slot.at.getTime() + 4 * 60 * 1000)).action, "enviar", "4 minutos de demora no vencen el plazo");
  assert.equal(decideAtExecution(task, new Date(slot.at.getTime() + 2 * H)).action, "enviar");
});

test("22/11: la tolerancia es corta: pasadas unas horas del tope sigue siendo plazo vencido", () => {
  const base = art("2026-11-16", 10, 0);
  const slot = chooseFollowupSlot(base, { targetHours: 72 });
  assert.ok(slot.ok);
  const d = decideAtExecution({ base, scheduledAt: slot.at, targetHours: 72 }, new Date(slot.at.getTime() + 6 * H));
  assert.equal(d.action, "conflicto");
  if (d.action === "conflicto") assert.equal(d.conflict, "plazo_vencido");
});

test("22/11: la tolerancia no abre domingos ni la noche", () => {
  // Jueves 20:15 + 72 h = domingo 20:15: el tope cae en domingo, no hay envío.
  const base = art("2026-11-12", 20, 15);
  const d = decideAtExecution({ base, scheduledAt: art("2026-11-14", 20, 15), targetHours: 72 }, art("2026-11-15", 20, 30));
  assert.notEqual(d.action, "enviar");
});
