import test from "node:test";
import assert from "node:assert/strict";
import { conexionesOfrecibles, rotuloAreaDeLinea } from "@/lib/definiciones/lineas";

const todas = ["WHATSAPP_AGENCIA_0KM", "WHATSAPP_CIVIL", "WHATSAPP_COBERTURAS_MEDICAS", "WHATSAPP_MARKETING", "WHATSAPP_PENAL", "WHATSAPP_OTRA"];

test("22/11: Penal solo se ofrece para asignar dentro de Jurídico", () => {
  assert.ok(conexionesOfrecibles(todas, "juridico").includes("WHATSAPP_PENAL"));
  for (const s of ["agencia_0km", "coberturas_medicas", "marketing"] as const) {
    assert.ok(!conexionesOfrecibles(todas, s).includes("WHATSAPP_PENAL"), `Penal no se ofrece en ${s}`);
  }
});

test("22/11: una conexión con el nombre de otro perfil no se ofrece en este", () => {
  assert.deepEqual(conexionesOfrecibles(todas, "marketing"), ["WHATSAPP_MARKETING", "WHATSAPP_OTRA"]);
  assert.deepEqual(conexionesOfrecibles(todas, "juridico"), ["WHATSAPP_CIVIL", "WHATSAPP_PENAL", "WHATSAPP_OTRA"]);
  assert.ok(!conexionesOfrecibles(todas, "agencia_0km").includes("WHATSAPP_COBERTURAS_MEDICAS"));
});

test("22/11: la línea Penal se rotula Penal (no «Civil»); el resto, por su área", () => {
  assert.equal(rotuloAreaDeLinea({ area: "civil", label: "PENAL", credential_key: "WHATSAPP_PENAL" }), "Penal");
  assert.equal(rotuloAreaDeLinea({ area: "civil", label: "CIVIL", credential_key: "WHATSAPP_CIVIL" }), "Civil");
  assert.equal(rotuloAreaDeLinea({ area: "marketing", label: "Marketing", credential_key: "WHATSAPP_MARKETING" }), "Marketing");
  assert.equal(rotuloAreaDeLinea({ area: "penal", label: "x", credential_key: "WHATSAPP_X" }), "Penal");
});

test("22/11: «Penal» no figura como rótulo fuera de Jurídico aunque el dato lo traiga", () => {
  assert.equal(rotuloAreaDeLinea({ area: "marketing", label: "PENAL viejo", credential_key: "WHATSAPP_MARKETING" }), "Marketing");
  assert.equal(rotuloAreaDeLinea({ area: "coberturas_medicas", label: "x", credential_key: "WHATSAPP_PENAL" }), "Coberturas médicas");
});
