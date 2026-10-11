// Corrección 5 — Errores técnicos atribuidos al prospecto.
// Antes: classifyMetaSendError(null) devolvía "contacto" y un error de red o
// un tiempo vencido sin código marcaba al destinatario como fallido. Ahora:
// solo un error confirmado por Meta para ESE destinatario es "contacto"; lo
// técnico no se le atribuye y lo incierto queda para revisión, sin reenvío.
import test from "node:test";
import assert from "node:assert/strict";
import {
  WhatsAppSendError,
  WhatsAppUnconfirmedError,
  classifyMetaErrorCode,
  classifySendFailure,
  failureNote,
  MAX_TRANSIENT_ATTEMPTS,
} from "@/lib/envios/errores";

test("5: sin código de Meta nunca es un problema del contacto", () => {
  assert.equal(classifyMetaErrorCode(null), "desconocido");
  assert.equal(classifyMetaErrorCode(undefined), "desconocido");
  assert.equal(classifyMetaErrorCode(Number.NaN), "desconocido");
});

test("5: errores de red, tiempo vencido o cancelación: inciertos, sin atribuirlos al prospecto", () => {
  const casos: unknown[] = [
    new TypeError("fetch failed"),
    new DOMException("The operation was aborted due to timeout", "TimeoutError"),
    new DOMException("This operation was aborted", "AbortError"),
    Object.assign(new Error("socket hang up"), { code: "ECONNRESET" }),
    null,
    undefined,
    "error sin forma",
  ];
  for (const err of casos) {
    const f = classifySendFailure(err);
    assert.equal(f.kind, "incierto", String(err));
    assert.equal(f.certainNotSent, false, "no se sabe si Meta aceptó el mensaje");
    assert.match(failureNote(f), /No se reenvía solo/);
  }
});

test("5: respuesta de Meta que no se puede confirmar (sin identificador o ilegible): incierta", () => {
  const f = classifySendFailure(new WhatsAppUnconfirmedError("Meta respondió sin el identificador del mensaje"));
  assert.equal(f.kind, "incierto");
  assert.equal(f.certainNotSent, false);
});

test("5: error HTTP sin el formato de Meta: 5xx incierto (pudo haberse aceptado), 4xx no clasificado", () => {
  const e502 = classifySendFailure(new WhatsAppSendError("Bad gateway", 502, null));
  assert.deepEqual([e502.kind, e502.certainNotSent, e502.httpStatus], ["incierto", false, 502]);
  const e400 = classifySendFailure(new WhatsAppSendError("Bad request", 400, null));
  assert.deepEqual([e400.kind, e400.certainNotSent], ["desconocido", true]);
});

test("5: con código de Meta: destinatario, plantilla, cuenta o falla temporal", () => {
  const tabla: [number, string][] = [
    [131026, "contacto"], // no se pudo entregar a ese número
    [131021, "contacto"],
    [131049, "contacto"],
    [131050, "contacto"],
    [132015, "plantilla"], // plantilla pausada
    [132001, "plantilla"],
    [190, "cuenta"], // token
    [131031, "cuenta"], // cuenta bloqueada
    [10, "cuenta"],
    [200, "cuenta"],
    [130429, "transitorio"], // límite de velocidad
    [131000, "transitorio"],
    [131016, "transitorio"],
    [4, "transitorio"],
    [999999, "desconocido"],
  ];
  for (const [code, kind] of tabla) {
    const f = classifySendFailure(new WhatsAppSendError(`Meta (${code})`, 400, code));
    assert.equal(f.kind, kind, `código ${code}`);
    assert.equal(f.certainNotSent, true, "Meta respondió con error: el mensaje no salió");
    assert.equal(f.code, code);
  }
});

test("5: las notas explican qué pasó sin culpar al prospecto por fallas técnicas", () => {
  assert.match(failureNote(classifySendFailure(new WhatsAppSendError("x", 400, 132015))), /plantilla.*pendiente/);
  assert.match(failureNote(classifySendFailure(new WhatsAppSendError("x", 400, 190))), /línea o la cuenta.*pendiente/);
  assert.match(failureNote(classifySendFailure(new WhatsAppSendError("x", 429, 130429))), /Falla temporal/);
  assert.match(failureNote(classifySendFailure(new WhatsAppSendError("x", 400, 131026))), /este destinatario/);
  assert.ok(MAX_TRANSIENT_ATTEMPTS >= 1);
});
