import { test } from "node:test";
import assert from "node:assert/strict";
import { agruparErrores, esProblemaDeCuenta, explicarError, leerErrorGuardado, lineaError } from "../../src/lib/envios/explicacion";

const pago = JSON.stringify([{ code: 131042, title: "Business eligibility payment issue" }]);

test("lee el código del JSON que guarda el webhook", () => {
  assert.equal(leerErrorGuardado(pago).codigo, 131042);
  assert.equal(leerErrorGuardado([{ code: 131026 }]).codigo, 131026);
});

test("lee el código de un JSON cortado y de textos", () => {
  assert.equal(leerErrorGuardado('[{"code":131049,"title":"This message was not deliv').codigo, 131049);
  assert.equal(leerErrorGuardado("Meta rechazó el envío por la línea o la cuenta (código 131042).").codigo, 131042);
  assert.equal(leerErrorGuardado("Pendiente: Error 131042 · Problema de pago").codigo, 131042);
  assert.equal(leerErrorGuardado(null).codigo, null);
});

test("131042 es de la cuenta y explica el pago", () => {
  const x = explicarError(pago);
  assert.equal(x.origen, "cuenta");
  assert.match(x.porque, /pago/i);
  assert.match(x.queHacer, /Pagos|Facturación/);
  assert.equal(esProblemaDeCuenta(pago), true);
  assert.equal(lineaError(pago).startsWith("Error 131042 · "), true);
});

test("errores del destinatario no pausan", () => {
  assert.equal(esProblemaDeCuenta([{ code: 131026 }]), false);
  assert.equal(esProblemaDeCuenta([{ code: 131049 }]), false);
  assert.equal(esProblemaDeCuenta([{ code: 130472 }]), false);
});

test("código desconocido muestra el número igual", () => {
  const x = explicarError([{ code: 999999, title: "Algo raro" }]);
  assert.equal(x.codigo, 999999);
  assert.match(x.queHacer, /999999/);
});

test("agrupa por código, de más a menos", () => {
  const g = agruparErrores([pago, pago, JSON.stringify([{ code: 131026 }])]);
  assert.equal(g[0].codigo, 131042);
  assert.equal(g[0].cantidad, 2);
  assert.equal(g[1].cantidad, 1);
});
