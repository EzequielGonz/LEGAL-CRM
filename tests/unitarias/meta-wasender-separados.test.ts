import test from "node:test";
import assert from "node:assert/strict";
import { textoEntroPor } from "@/lib/inbox/entro-por";

// 17/11 · Meta y Wasender separados: cada chat dice por dónde entró, con datos ficticios.
test("un chat de Wasender dice Wasender y su línea, aunque también tenga línea de Meta", () => {
  assert.equal(textoEntroPor({ canal: "whatsapp", wasenderLineId: "w1", lineaMeta: "CIVIL", lineaWasender: "Chip ficticio" }), "WhatsApp por QR (Wasender) · Chip ficticio");
});
test("un chat de WhatsApp sin Wasender es de Meta", () => {
  assert.equal(textoEntroPor({ canal: "whatsapp", wasenderLineId: null, lineaMeta: "CIVIL", lineaWasender: null }), "WhatsApp oficial (Meta) · CIVIL");
  assert.equal(textoEntroPor({ canal: null, wasenderLineId: null, lineaMeta: null, lineaWasender: null }), "WhatsApp oficial (Meta)");
});
test("Instagram, Facebook o la landing no muestran línea de WhatsApp", () => {
  assert.equal(textoEntroPor({ canal: "instagram", wasenderLineId: null, lineaMeta: null, lineaWasender: null }), null);
});
