import test from "node:test";
import assert from "node:assert/strict";
import { evidenciaDeCaptacion, textoDeEvidencia } from "@/lib/captacion/evidencia";

const m = (id: string | null, direction: string, body: string | null) => ({ id, direction, body, sender_type: direction === "entrante" ? "prospecto" : "agente_ia", created_at: "2026-11-20T12:00:00Z" });

test("22/11: una aceptación real guarda el id del mensaje y su frase", () => {
  const r = evidenciaDeCaptacion([m("a1", "saliente", "¿Te llamamos mañana?"), m("a2", "entrante", "Sí, dale, llamame mañana a la tarde")], "Aceptó la llamada");
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.messageId, "a2");
    assert.match(r.evidencia, /a2/);
    assert.match(r.evidencia, /llamame mañana/);
  }
});

test("22/11: un mensaje automático al final no capta aunque el modelo diga que aceptó", () => {
  const auto = "Gracias por comunicarte con Estudio Pérez. En breve te respondemos, estamos fuera de horario.";
  const r = evidenciaDeCaptacion([m("a1", "saliente", "¿Te llamamos?"), m("a2", "entrante", "sí"), m("a3", "entrante", auto)], "Aceptó");
  assert.deepEqual(r, { ok: false, motivo: "respuesta_automatica" });
});

test("22/11: «que no me contacte nadie» no capta", () => {
  const r = evidenciaDeCaptacion([m("a1", "saliente", "¿Te llamamos?"), m("a2", "entrante", "No quiero nada, que no me contacte nadie")], "Aceptó");
  assert.deepEqual(r, { ok: false, motivo: "rechazo" });
});

test("22/11: sin mensaje de la persona, sin texto o sin id, no hay evidencia (antes «vacío» pasaba)", () => {
  assert.deepEqual(evidenciaDeCaptacion([m("a1", "saliente", "hola")], "x"), { ok: false, motivo: "sin_mensaje_de_la_persona" });
  assert.deepEqual(evidenciaDeCaptacion([m("a1", "entrante", "   ")], "x"), { ok: false, motivo: "vacio" });
  assert.deepEqual(evidenciaDeCaptacion([m(null, "entrante", "sí, dale")], "x"), { ok: false, motivo: "sin_id" });
});

test("22/11: una pregunta sin aceptación no capta, pero sí vale cuando solo se exige que sea una persona (presupuesto pedido)", () => {
  const h = [m("a1", "saliente", "¿Querés un presupuesto?"), m("a2", "entrante", "¿Cuánto sale más o menos?")];
  assert.deepEqual(evidenciaDeCaptacion(h, "x"), { ok: false, motivo: "pregunta_sin_aceptacion" });
  assert.equal(evidenciaDeCaptacion(h, "Pidió presupuesto", { exigirAceptacion: false }).ok, true);
  // Un rechazo claro nunca vale.
  assert.equal(evidenciaDeCaptacion([m("a2", "entrante", "no gracias, no me interesa")], "x", { exigirAceptacion: false }).ok, false);
});

test("22/11: el texto de evidencia queda acotado", () => {
  const t = textoDeEvidencia("id1", "a".repeat(5000), "b".repeat(5000));
  assert.ok(t.length <= 2000);
  assert.match(t, /^Mensaje de la persona \(id1\)/);
});
