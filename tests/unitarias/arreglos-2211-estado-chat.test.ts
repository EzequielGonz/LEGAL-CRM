import test from "node:test";
import assert from "node:assert/strict";
import { estadoCorto } from "@/lib/inicio";
import { atencionVisible, estadoVisibleDelChat } from "@/lib/definiciones/estado-chat";

test("22/11: un captado sin pedido propio de una persona dice «falta derivar», no «Requiere atención humana»", () => {
  assert.equal(estadoCorto({ capture_state: "captado", derivation_state: "no_derivado" }).texto, "Captado: falta derivar");
  assert.equal(estadoCorto({ capture_state: "captado", derivation_state: "derivado" }).texto, "Derivado");
  // Con un pedido real (escribió de nuevo) sigue esperando a una persona.
  assert.equal(estadoCorto({ capture_state: "captado", attention_state: "requiere_humano" }).texto, "Espera a una persona");
});

test("22/11: un perdido nunca espera a una persona, aunque quede el dato viejo", () => {
  assert.equal(estadoCorto({ capture_state: "perdido", attention_state: "requiere_humano" }).texto, "Perdido");
});

test("22/11: sin captación ni pérdida, el pedido de una persona se sigue mostrando", () => {
  assert.equal(estadoCorto({ capture_state: "en_conversacion", attention_state: "requiere_humano" }).texto, "Espera a una persona");
  assert.equal(estadoCorto({ capture_state: "en_conversacion", attention_state: "humano_en_curso" }).texto, "Lo atiende una persona");
  assert.equal(estadoCorto({ detenido: true, capture_state: "captado", attention_state: "requiere_humano" }).texto, "Detenido");
});

test("22/11: detalle del chat: «Cerrado (ganado)» y «Requiere atención humana» no se muestran juntos", () => {
  const v = estadoVisibleDelChat({ contactStatus: "cerrado_ganado", conversationStatus: "requiere_atencion_humana", captureState: "captado", attentionState: "requiere_humano", derivationState: "no_derivado" });
  assert.equal(v.principal, "Captado: falta derivar");
  assert.equal(v.atencion, null);
  // Si la persona escribió de nuevo (hay un motivo propio), el pedido real sí se muestra.
  const posterior = estadoVisibleDelChat({ contactStatus: "cerrado_ganado", captureState: "captado", attentionState: "requiere_humano", attentionReason: "mensaje_posterior_captado", derivationState: "no_derivado" });
  assert.equal(posterior.atencion, "Requiere atención humana");
  const perdido = estadoVisibleDelChat({ contactStatus: "cerrado_perdido", conversationStatus: "requiere_atencion_humana", captureState: "perdido", attentionState: "requiere_humano" });
  assert.equal(perdido.principal, "Cerrado (perdido)");
  assert.equal(perdido.atencion, null);
  const abierto = estadoVisibleDelChat({ contactStatus: "en_conversacion", conversationStatus: "requiere_atencion_humana", captureState: "en_conversacion", attentionState: "requiere_humano" });
  assert.equal(abierto.principal, "En conversación");
  assert.equal(abierto.atencion, "Requiere atención humana");
});

test("22/11: la etiqueta de atención solo se muestra cuando no contradice el cierre", () => {
  assert.equal(atencionVisible({ captureState: "captado", attentionState: "requiere_humano" }), null);
  assert.equal(atencionVisible({ captureState: "captado", attentionState: "requiere_humano", attentionReason: "decision_profesional" }), "Requiere atención humana");
  assert.equal(atencionVisible({ captureState: "captado", attentionState: "humano_en_curso" }), "Atención humana en curso");
  assert.equal(atencionVisible({ captureState: "perdido", attentionState: "requiere_humano" }), null);
  assert.equal(atencionVisible({ captureState: "nuevo", attentionState: "ia" }), null);
  assert.equal(atencionVisible({ captureState: "nuevo", attentionState: "requiere_humano" }), "Requiere atención humana");
});
