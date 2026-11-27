import test from "node:test";
import assert from "node:assert/strict";
import { alCerrarseOportunidad } from "@/lib/opportunities";

test("22/11: perdido o captado cierran el seguimiento y cancelan las tareas pendientes", () => {
  for (const v of ["perdido", "captado"]) {
    const r = alCerrarseOportunidad("capture_state", v, { followup_state: "activo" });
    assert.equal(r.cancelarTareas, true);
    assert.equal(r.oportunidad.followup_state, "completado");
    assert.equal(r.oportunidad.followup_next_at, null);
    assert.match(String(r.oportunidad.followup_reason), /cerr/i);
  }
});

test("22/11: otros cambios de estado, o un seguimiento ya caído, no se tocan", () => {
  assert.deepEqual(alCerrarseOportunidad("capture_state", "en_seguimiento", { followup_state: "activo" }), { oportunidad: {}, cancelarTareas: false });
  assert.deepEqual(alCerrarseOportunidad("followup_state", "caido", { followup_state: "activo" }), { oportunidad: {}, cancelarTareas: false });
  const r = alCerrarseOportunidad("capture_state", "perdido", { followup_state: "caido" });
  assert.deepEqual(r.oportunidad, {});
  assert.equal(r.cancelarTareas, true, "igual se cancelan tareas que quedaran programadas");
  assert.equal(alCerrarseOportunidad("capture_state", "perdido", null).cancelarTareas, true);
});
