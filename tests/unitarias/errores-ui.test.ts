import test from "node:test";
import assert from "node:assert/strict";
import { mensajeDeError, MENSAJE_SIN_CONEXION } from "@/lib/errores-ui";

test("errores de red típicos se traducen", () => {
  assert.equal(mensajeDeError(new TypeError("Failed to fetch")), MENSAJE_SIN_CONEXION);
  assert.equal(mensajeDeError(new TypeError("NetworkError when attempting to fetch resource.")), MENSAJE_SIN_CONEXION);
  assert.equal(mensajeDeError(new TypeError("Load failed")), MENSAJE_SIN_CONEXION);
  assert.equal(mensajeDeError("Network request failed"), MENSAJE_SIN_CONEXION);
});

test("errores técnicos usan el respaldo y no se muestran crudos", () => {
  assert.equal(mensajeDeError(new SyntaxError("Unexpected token < in JSON at position 0"), "No se pudo."), "No se pudo.");
  assert.equal(mensajeDeError(undefined, "No se pudo."), "No se pudo.");
  assert.equal(mensajeDeError(null), MENSAJE_SIN_CONEXION);
  assert.equal(mensajeDeError({}), MENSAJE_SIN_CONEXION);
});

test("un mensaje ya escrito en castellano se conserva", () => {
  assert.equal(mensajeDeError(new Error("La campaña ya no existe.")), "La campaña ya no existe.");
});
