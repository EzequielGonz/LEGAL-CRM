import { test } from "node:test";
import assert from "node:assert/strict";
import { nivelDeAccion, faltaParaConfirmar, TIPOS_ACCION } from "@/lib/asistente/permisos";
import { DECLARACIONES_CHATS, NOMBRES_CHATS } from "@/lib/asistente/chats-declaraciones";

test("asistente · chats: responder le escribe a una persona y pide la confirmación reforzada", () => {
  assert.equal(nivelDeAccion("responder_chat"), "contacto");
  assert.ok(faltaParaConfirmar("contacto", {}));
  for (const t of ["tomar_chat", "soltar_chat", "marcar_captado", "marcar_derivado"]) assert.equal(nivelDeAccion(t), "cambio", t);
});

test("asistente · chats: cada herramienta está declarada y cada tipo está permitido", () => {
  const nombres = DECLARACIONES_CHATS.map((d) => d.name);
  for (const n of NOMBRES_CHATS) assert.ok(nombres.includes(n), n);
  for (const t of ["responder_chat", "tomar_chat", "soltar_chat", "marcar_captado", "marcar_derivado"]) assert.ok((TIPOS_ACCION as readonly string[]).includes(t), t);
  // Ninguna herramienta de chats gasta plata.
  assert.ok(!nombres.some((n) => /pago|pagar|gasto/.test(n)));
});
