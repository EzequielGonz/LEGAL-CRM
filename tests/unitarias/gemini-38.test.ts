import test from "node:test";
import assert from "node:assert/strict";
import { identificadorModelo, informeModeloActivo, MODELO_POR_DEFECTO } from "@/lib/agentes/modelo";
import { normalizarSalida } from "@/lib/agentes/contrato";

test("Gemini 3.8: valor por defecto y variable GEMINI_MODEL", () => {
  assert.equal(MODELO_POR_DEFECTO, "gemini-3.8-flash");
  assert.equal(identificadorModelo({}), "gemini-3.8-flash");
  assert.equal(identificadorModelo({ GEMINI_MODEL: "  gemini-3.8-flash " }), "gemini-3.8-flash");
  assert.equal(identificadorModelo({ GEMINI_MODEL: "otro-modelo" }), "otro-modelo");
  const info = informeModeloActivo({ GEMINI_MODEL: "gemini-3.8-flash", GEMINI_API_KEY: "x" });
  assert.equal(info.identificador, "gemini-3.8-flash");
  assert.equal(info.origen, "variable");
});

test("Gemini 3.8: la acción conserva el id de la llamada para la FunctionResponse", () => {
  const s = normalizarSalida([{ functionCall: { id: "call_1", name: "escalar_a_humano", args: { motivo: "pide persona" } } }]);
  assert.equal(s.acciones[0].id, "call_1");
  const sinId = normalizarSalida([{ functionCall: { name: "escalar_a_humano", args: {} } }]);
  assert.equal("id" in sinId.acciones[0], false);
});
