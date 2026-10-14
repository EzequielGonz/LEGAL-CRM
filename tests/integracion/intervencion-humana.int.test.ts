// Corrección 3 — Intervención humana y respuestas de la IA en curso.
// La respuesta manual pausa el chat ANTES de enviar; toda salida automática
// se revalida en la base (pausa general y chat tomado) inmediatamente antes
// de enviar; el acuse final de la IA solo sale con su permiso de un solo uso.
import test, { after, before } from "node:test";
import assert from "node:assert/strict";

import { CON_PAUSA, RedSimulada, SIN_PAUSA, crearContacto, crearConversacion, db, esperarApi, fijarPausa, sql, pedido, prepararSesionDePrueba } from "./soporte/entorno";
import { AutomaticSendBlockedError, sendOutboundMessage } from "@/lib/messaging";
import { POST as responderManual } from "@/app/api/conversations/[id]/messages/route";
import { POST as cambiarIa } from "@/app/api/conversations/[id]/toggle-ai/route";


let red: RedSimulada;
before(async () => {
  red = new RedSimulada();
  await esperarApi();
  await prepararSesionDePrueba();
});
after(() => red.restaurar());

async function chat() {
  const c = await crearContacto({ area: "civil" });
  const conv = await crearConversacion(c.id, { area: "civil", aiEnabled: true });
  return { conv, phone: c.phone };
}
async function conversacion(id: string) {
  const { data } = await db().from("conversations").select("ai_enabled, status, ai_ack_token, ai_ack_expires_at, human_takeover_at").eq("id", id).single();
  return data as any;
}
async function mensajes(id: string) {
  const { data } = await db().from("messages").select("sender_type, body").eq("conversation_id", id);
  return data ?? [];
}
const json = (body: unknown) => pedido("http://local/api", { method: "POST", body: JSON.stringify(body) });

test("3: la respuesta manual pausa el chat ANTES de llamar a Meta", async () => {
  await fijarPausa(SIN_PAUSA);
  const { conv } = await chat();
  let visto: any = null;
  red.alRecibirEnvio = async () => {
    visto = await conversacion(conv);
  };
  try {
    const res = await responderManual(json({ body: "Hola, soy del estudio." }), { params: { id: conv } });
    assert.equal(res.status, 200);
  } finally {
    red.alRecibirEnvio = null;
  }
  assert.ok(visto, "Meta recibió el envío");
  assert.equal(visto.ai_enabled, false, "cuando el mensaje llega a Meta, la IA ya está pausada");
  assert.equal(visto.status, "requiere_atencion_humana");
  assert.ok(visto.human_takeover_at);
});

test("3: si el envío manual falla, el chat igual queda tomado por la persona", async () => {
  await fijarPausa(SIN_PAUSA);
  const { conv, phone } = await chat();
  red.responder(phone, { status: 400, body: { error: { code: 131047, message: "Re-engagement message" } } });
  const res = await responderManual(json({ body: "Hola" }), { params: { id: conv } });
  assert.equal(res.status, 502);
  assert.equal((await conversacion(conv)).ai_enabled, false);
});

test("3: con la pausa general activa, la IA no envía (se revalida en el momento)", async () => {
  await fijarPausa(CON_PAUSA);
  const { conv, phone } = await chat();
  await assert.rejects(
    sendOutboundMessage({ conversationId: conv, senderType: "agente_ia", body: "respuesta automática" }),
    (e: any) => e instanceof AutomaticSendBlockedError && e.reason === "pausa_general"
  );
  assert.equal(red.enviosA(phone).length, 0);
  assert.equal((await mensajes(conv)).length, 0);
});

test("3: una respuesta de la IA en curso no sale si una persona tomó el chat mientras tanto", async () => {
  await fijarPausa(SIN_PAUSA);
  const { conv, phone } = await chat();
  // La IA empezó a preparar su respuesta (chat con IA activa)...
  assert.equal((await conversacion(conv)).ai_enabled, true);
  // ...y mientras tanto la persona respondió a mano.
  await responderManual(json({ body: "Te atiendo yo." }), { params: { id: conv } });
  // Al momento de enviar, la compuerta lo impide.
  await assert.rejects(
    sendOutboundMessage({ conversationId: conv, senderType: "agente_ia", body: "respuesta de la IA" }),
    (e: any) => e instanceof AutomaticSendBlockedError && e.reason === "chat_pausado"
  );
  const salidas = red.enviosA(phone);
  assert.equal(salidas.length, 1, "solo salió el mensaje de la persona");
  assert.equal(salidas[0].body.text.body, "Te atiendo yo.");
  assert.deepEqual((await mensajes(conv)).map((m: any) => m.sender_type), ["admin"]);
});

test("3: si el operador pausó el chat desde el panel, la IA tampoco envía", async () => {
  await fijarPausa(SIN_PAUSA);
  const { conv, phone } = await chat();
  await cambiarIa(json({ ai_enabled: false }), { params: { id: conv } });
  await assert.rejects(
    sendOutboundMessage({ conversationId: conv, senderType: "agente_ia", body: "x" }),
    (e: any) => e.reason === "chat_pausado"
  );
  assert.equal(red.enviosA(phone).length, 0);
});

test("3: acuse final autorizado: sale una sola vez, con permiso vigente, y una persona puede anularlo", async () => {
  await fijarPausa(SIN_PAUSA);
  const s = db();

  // La IA deriva a una persona: el chat queda pausado y se otorga UN permiso.
  const a = await chat();
  const g = await s.rpc("grant_ai_final_ack", { p_conversation: a.conv, p_status: "requiere_atencion_humana", p_intake_step: null, p_minutes: 5 });
  const token = g.data as string;
  assert.ok(token);
  assert.equal((await conversacion(a.conv)).ai_enabled, false);
  // Sin el permiso, la IA no envía en un chat pausado.
  await assert.rejects(sendOutboundMessage({ conversationId: a.conv, senderType: "agente_ia", body: "x" }), (e: any) => e.reason === "chat_pausado");
  // Con un permiso equivocado, tampoco.
  await assert.rejects(
    sendOutboundMessage({ conversationId: a.conv, senderType: "agente_ia", body: "x", finalAckToken: "00000000-0000-0000-0000-000000000000" }),
    (e: any) => e.reason === "acuse_no_autorizado"
  );
  // Con el permiso correcto sale el acuse...
  await sendOutboundMessage({ conversationId: a.conv, senderType: "agente_ia", body: "Te derivo con una persona del estudio.", finalAckToken: token });
  assert.equal(red.enviosA(a.phone).length, 1);
  // ...una sola vez.
  await assert.rejects(
    sendOutboundMessage({ conversationId: a.conv, senderType: "agente_ia", body: "otra vez", finalAckToken: token }),
    (e: any) => e.reason === "acuse_no_autorizado"
  );
  assert.equal(red.enviosA(a.phone).length, 1);

  // Si una persona toma el chat antes del acuse, el permiso se anula.
  const b = await chat();
  const gb = await s.rpc("grant_ai_final_ack", { p_conversation: b.conv, p_status: "requiere_atencion_humana", p_intake_step: null, p_minutes: 5 });
  await responderManual(json({ body: "Ya te atiendo." }), { params: { id: b.conv } });
  assert.equal((await conversacion(b.conv)).ai_ack_token, null);
  await assert.rejects(
    sendOutboundMessage({ conversationId: b.conv, senderType: "agente_ia", body: "acuse", finalAckToken: gb.data as string }),
    (e: any) => e.reason === "acuse_no_autorizado"
  );
  assert.equal(red.enviosA(b.phone).length, 1, "solo el mensaje de la persona");

  // Un permiso vencido no sirve.
  const c = await chat();
  const gc = await s.rpc("grant_ai_final_ack", { p_conversation: c.conv, p_status: "requiere_atencion_humana", p_intake_step: null, p_minutes: 5 });
  sql(`update conversations set ai_ack_expires_at = now() - interval '1 second' where id = '${c.conv}'`);
  await assert.rejects(
    sendOutboundMessage({ conversationId: c.conv, senderType: "agente_ia", body: "acuse", finalAckToken: gc.data as string }),
    (e: any) => e.reason === "acuse_no_autorizado"
  );

  // Con la pausa general activa, ni siquiera el acuse autorizado sale.
  const d = await chat();
  const gd = await s.rpc("grant_ai_final_ack", { p_conversation: d.conv, p_status: "requiere_atencion_humana", p_intake_step: null, p_minutes: 5 });
  await fijarPausa(CON_PAUSA);
  await assert.rejects(
    sendOutboundMessage({ conversationId: d.conv, senderType: "agente_ia", body: "acuse", finalAckToken: gd.data as string }),
    (e: any) => e.reason === "pausa_general"
  );
  assert.equal(red.enviosA(d.phone).length, 0);
});

test("3: si una persona toma el chat mientras la IA decide derivar, no hay acuse ni se pisa su estado", async () => {
  await fijarPausa(SIN_PAUSA);
  const { conv, phone } = await chat();
  // La IA está procesando; la persona responde a mano.
  await responderManual(json({ body: "Te atiendo yo." }), { params: { id: conv } });
  // La herramienta de la IA decide derivar (o cerrar) recién ahora.
  const g = await db().rpc("grant_ai_final_ack", { p_conversation: conv, p_status: "cerrado_perdido", p_intake_step: "resuelto", p_minutes: 5 });
  assert.equal(g.data, null, "sin permiso para el acuse");
  const estado = await conversacion(conv);
  assert.equal(estado.status, "requiere_atencion_humana", "queda lo que decidió la persona");
  await assert.rejects(
    sendOutboundMessage({ conversationId: conv, senderType: "agente_ia", body: "acuse", finalAckToken: null }),
    (e: any) => e.reason === "chat_pausado"
  );
  assert.equal(red.enviosA(phone).length, 1, "solo salió el mensaje de la persona");
});

test("3: pausar la IA desde el panel anula un acuse final pendiente", async () => {
  await fijarPausa(SIN_PAUSA);
  const { conv, phone } = await chat();
  const g = await db().rpc("grant_ai_final_ack", { p_conversation: conv, p_status: "requiere_atencion_humana", p_intake_step: null, p_minutes: 5 });
  await cambiarIa(json({ ai_enabled: false }), { params: { id: conv } });
  const despues = await conversacion(conv);
  assert.deepEqual([despues.ai_enabled, despues.ai_ack_token, despues.ai_ack_expires_at], [false, null, null]);
  assert.ok(despues.human_takeover_at);
  await assert.rejects(
    sendOutboundMessage({ conversationId: conv, senderType: "agente_ia", body: "acuse", finalAckToken: g.data as string }),
    (e: any) => e.reason === "acuse_no_autorizado"
  );
  assert.equal(red.enviosA(phone).length, 0);
});
