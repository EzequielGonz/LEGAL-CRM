// Corrección 4 (Inbox) — El polling actualiza los estados de los mensajes
// que ya están en pantalla, además de agregar los nuevos.
import test from "node:test";
import assert from "node:assert/strict";
import { mergeDeliveryUpdates, mergePoll } from "@/lib/inbox/estados";

type M = { id: string; body: string; delivery_status?: string | null; delivery_status_at?: string | null };

const enPantalla: M[] = [
  { id: "a", body: "plantilla de campaña", delivery_status: "enviado", delivery_status_at: "2026-10-10T12:00:00Z" },
  { id: "b", body: "respuesta", delivery_status: null },
];

test("4: sin mensajes nuevos, igual se actualiza el estado de un mensaje existente", () => {
  const out = mergePoll(enPantalla, [], [{ id: "a", delivery_status: "leido", delivery_status_at: "2026-10-10T12:05:00Z" }]);
  assert.equal(out.length, 2);
  assert.equal(out[0].delivery_status, "leido");
  assert.equal(out[0].delivery_status_at, "2026-10-10T12:05:00Z");
  assert.equal(out[1], enPantalla[1], "lo que no cambió se conserva tal cual");
});

test("4: mensajes nuevos se agregan al final, sin duplicar los que ya estaban", () => {
  const nuevos: M[] = [{ id: "b", body: "respuesta" }, { id: "c", body: "nuevo", delivery_status: "enviado" }];
  const out = mergePoll(enPantalla, nuevos, [{ id: "a", delivery_status: "entregado", delivery_status_at: null }]);
  assert.deepEqual(out.map((m) => m.id), ["a", "b", "c"]);
  assert.equal(out[0].delivery_status, "entregado");
});

test("4: si nada cambió, se devuelve la misma lista (no vuelve a dibujar)", () => {
  const same = mergeDeliveryUpdates(enPantalla, [{ id: "a", delivery_status: "enviado", delivery_status_at: "x" }]);
  assert.equal(same.changed, false);
  assert.equal(same.list, enPantalla);
  assert.equal(mergePoll(enPantalla, [], []), enPantalla);
});
