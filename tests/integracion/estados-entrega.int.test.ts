// Corrección 4 — Entrega y lectura de los mensajes de campaña, y polling
// del Inbox que actualiza los estados de los mensajes que ya se ven.
import test, { after, before } from "node:test";
import assert from "node:assert/strict";

import { RedSimulada, SIN_PAUSA, crearContacto, crearConversacion, db, esperarApi, fijarPausa, pedido, prepararSesionDePrueba } from "./soporte/entorno";
import { EN_HORARIO, crearCampana } from "./soporte/campanas";
import { tickCampaign } from "@/lib/campaigns";
import { applyDeliveryStatus } from "@/lib/delivery-status";
import { sendOutboundMessage } from "@/lib/messaging";
import { mergePoll } from "@/lib/inbox/estados";
import { GET as leerMensajes } from "@/app/api/conversations/[id]/messages/route";


let red: RedSimulada;
before(async () => {
  red = new RedSimulada();
  await esperarApi();
  await prepararSesionDePrueba();
  await fijarPausa(SIN_PAUSA);
});
after(() => red.restaurar());

const ahora = () => String(Math.floor(Date.now() / 1000));

test("4: el mensaje de campaña guarda el identificador de Meta y su estado inicial; entrega y lectura lo actualizan", async () => {
  const { campaignId, destinatarios } = await crearCampana("estados de entrega", 1);
  const [d] = destinatarios;
  assert.equal((await tickCampaign(campaignId, { now: EN_HORARIO })).action, "sent");

  const { data: cc } = await db().from("campaign_contacts").select("status, message_id").eq("id", d.ccId).single();
  assert.match(cc!.message_id, /^wamid\.PRUEBA\./);
  const { data: msg } = await db()
    .from("messages")
    .select("id, conversation_id, created_at, external_message_id, delivery_status, delivery_status_at, metadata")
    .eq("external_message_id", cc!.message_id)
    .single();
  assert.ok(msg, "el mensaje insertado tiene el mismo identificador que el destinatario");
  assert.equal(msg!.delivery_status, "enviado");
  assert.ok(msg!.delivery_status_at);
  assert.equal(msg!.metadata.campaign_id, campaignId);

  // Webhook de Meta: entregado y leído.
  await applyDeliveryStatus({ id: cc!.message_id, status: "delivered", timestamp: ahora(), recipient_id: d.phone });
  let m = await db().from("messages").select("delivery_status").eq("id", msg!.id).single();
  assert.equal(m.data!.delivery_status, "entregado");
  await applyDeliveryStatus({ id: cc!.message_id, status: "read", timestamp: ahora(), recipient_id: d.phone });
  m = await db().from("messages").select("delivery_status").eq("id", msg!.id).single();
  assert.equal(m.data!.delivery_status, "leido");
  // Un "entregado" que llega tarde no retrocede el estado.
  await applyDeliveryStatus({ id: cc!.message_id, status: "delivered", timestamp: ahora(), recipient_id: d.phone });
  m = await db().from("messages").select("delivery_status").eq("id", msg!.id).single();
  assert.equal(m.data!.delivery_status, "leido");
  const cc2 = await db().from("campaign_contacts").select("status").eq("id", d.ccId).single();
  assert.equal(cc2.data!.status, "leido");

  // Polling del Inbox: no hay mensajes nuevos, pero sí el estado actualizado del que ya se ve.
  const url = `http://local/api/conversations/${msg!.conversation_id}/messages?after=${encodeURIComponent(msg!.created_at)}`;
  const res = await leerMensajes(pedido(url), { params: { id: msg!.conversation_id } });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.deepEqual(body.messages, []);
  const estado = body.estados.find((e: any) => e.id === msg!.id);
  assert.equal(estado?.delivery_status, "leido");
  const enPantalla = [{ id: msg!.id, delivery_status: "enviado", delivery_status_at: null }];
  assert.equal(mergePoll(enPantalla, body.messages, body.estados)[0].delivery_status, "leido");
});

test("4: la respuesta manual también guarda el identificador y el estado", async () => {
  const c = await crearContacto({ area: "civil" });
  const conv = await crearConversacion(c.id, { area: "civil" });
  await sendOutboundMessage({ conversationId: conv, senderType: "admin", body: "Hola, te escribo del estudio." });
  const { data } = await db().from("messages").select("id, external_message_id, delivery_status").eq("conversation_id", conv).single();
  assert.match(data!.external_message_id, /^wamid\.PRUEBA\./);
  assert.equal(data!.delivery_status, "enviado");
  await applyDeliveryStatus({ id: data!.external_message_id, status: "read", timestamp: ahora(), recipient_id: c.phone });
  const after2 = await db().from("messages").select("delivery_status").eq("id", data!.id).single();
  assert.equal(after2.data!.delivery_status, "leido");
});
