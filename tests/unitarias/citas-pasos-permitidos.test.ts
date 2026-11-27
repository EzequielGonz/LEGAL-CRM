import { test } from "node:test";
import assert from "node:assert/strict";
import { motivoCambioDeCitaNoPermitido } from "../../src/lib/agenda-vista";

test("citas: la API acepta los mismos pasos que los botones de la Agenda (27/11)", () => {
  const ok = (status: string, nuevo: string, kind: string | null = "profesional") => motivoCambioDeCitaNoPermitido({ status, kind }, nuevo) === null;
  // Abierta: asistió, no asistió, cancelar, confirmar.
  for (const s of ["pendiente", "confirmada"]) {
    assert.ok(ok(s, "realizada"));
    assert.ok(ok(s, "ausente"));
    assert.ok(ok(s, "cancelada"));
    assert.ok(ok(s, "confirmada"));
  }
  // Realizada o ausente: no se cancela; se puede reabrir.
  assert.equal(ok("realizada", "cancelada"), false);
  assert.match(motivoCambioDeCitaNoPermitido({ status: "realizada" }, "cancelada")!, /no se puede cancelar/);
  assert.equal(ok("ausente", "cancelada"), false);
  assert.ok(ok("realizada", "confirmada"));
  assert.ok(ok("ausente", "pendiente"));
  assert.equal(ok("realizada", "ausente"), false);
  // Cancelada: queda cerrada.
  assert.equal(ok("cancelada", "confirmada"), false);
  assert.equal(ok("cancelada", "realizada"), false);
  // Repetir la misma acción no es un error.
  assert.ok(ok("cancelada", "cancelada"));
  // Estado desconocido: no.
  assert.equal(ok("confirmada", "borrada"), false);
});
