import test from "node:test";
import assert from "node:assert/strict";
import { entornoPuedeRecibirMensajes, esUuid, leerTelefonoPrincipal, validarReglasDeAgenda } from "@/lib/rutas/comprobar";

test("rutas: un identificador mal formado no llega a la base", () => {
  assert.equal(esUuid("11111111-1111-4111-8111-111111111111"), true);
  for (const malo of ["", "1", "undefined", null, undefined, 7, "11111111-1111-4111-8111-11111111111g"]) assert.equal(esUuid(malo), false);
});

test("agenda: horarios válidos pasan y cualquier dato malo frena todo el guardado", () => {
  const bien = validarReglasDeAgenda([{ weekday: 1, start_time: "09:00", end_time: "13:00" }, { weekday: 3, start_time: "14:00:00", end_time: "18:00:00", slot_duration_minutes: 45 }]);
  assert.ok(bien.ok);
  if (bien.ok) assert.deepEqual(bien.reglas.map((r) => r.slot_duration_minutes), [30, 45]);
  assert.deepEqual(validarReglasDeAgenda([]), { ok: true, reglas: [] });
  for (const malo of [null, "x", [{ weekday: 7, start_time: "09:00", end_time: "10:00" }], [{ weekday: 1, start_time: "9", end_time: "10:00" }], [{ weekday: 1, start_time: "12:00", end_time: "10:00" }], [{ weekday: 1, start_time: "09:00", end_time: "10:00", slot_duration_minutes: 0 }]]) {
    assert.equal(validarReglasDeAgenda(malo).ok, false, JSON.stringify(malo));
  }
});

test("teléfono principal: un pedido mal formado no lo borra; solo se quita a propósito", () => {
  assert.equal(leerTelefonoPrincipal(undefined).ok, false);
  assert.equal(leerTelefonoPrincipal({}).ok, false);
  assert.equal(leerTelefonoPrincipal([]).ok, false);
  assert.equal(leerTelefonoPrincipal({ phone: 5 }).ok, false);
  assert.equal(leerTelefonoPrincipal({ phone: "hola" }).ok, false);
  assert.deepEqual(leerTelefonoPrincipal({ phone: null }), { ok: true, telefono: null });
  assert.deepEqual(leerTelefonoPrincipal({ phone: "  " }), { ok: true, telefono: null });
  assert.deepEqual(leerTelefonoPrincipal({ phone: " +54 9 11 5555-0000 " }), { ok: true, telefono: "+54 9 11 5555-0000" });
});

test("wasender: desde una vista previa no se cambia a dónde llegan los mensajes", () => {
  assert.equal(entornoPuedeRecibirMensajes("preview"), false);
  assert.equal(entornoPuedeRecibirMensajes("production"), true);
  assert.equal(entornoPuedeRecibirMensajes(undefined), true);
});
