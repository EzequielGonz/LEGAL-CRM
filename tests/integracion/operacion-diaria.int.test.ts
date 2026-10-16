// Etapa 2 · Bloque 3 — Fuente acreditada, pedido de texto ante un audio y
// búsqueda en columnas importadas. Meta y la IA simulados.
import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { RedSimulada, SIN_PAUSA, CON_PAUSA, crearContacto, crearConversacion, db, esperarApi, fijarPausa, prepararSesionDePrueba, sql, pedido } from "./soporte/entorno";
import { handleInboundMessage } from "@/lib/inbound";
import { usarModeloAgente } from "@/lib/ai-agent/agent";
import { GET as inbox } from "@/app/api/inbox/route";

const JURIDICO = "11111111-1111-1111-1111-111111111111";
let red: RedSimulada;
before(async () => {
  red = new RedSimulada();
  await esperarApi();
  await prepararSesionDePrueba();
  sql(`insert into public.ai_agents (area, display_name, system_prompt, active) values ('civil', 'Agente de prueba', 'Prueba.', true) on conflict (area) do update set active = true`);
  sql(`update public.rubros set brand_name = 'Estudio de Prueba', agent_presentation_name = 'Asistente de Prueba', inbound_24h_enabled = true,
       source_identifiers = '[{"texto":"Hola, vengo desde la web","fuente":"landing"}]' where id = '${JURIDICO}'`);
  usarModeloAgente(async () => ({ parts: [{ text: "Hola" }] }));
});
after(() => {
  sql(`update public.ai_agents set active = false where area = 'civil'`);
  sql(`update public.rubros set inbound_24h_enabled = false, source_identifiers = '[]' where id = '${JURIDICO}'`);
  usarModeloAgente(null);
  red.restaurar();
});

async function nuevo() {
  const c = await crearContacto({ area: "civil", rubroId: JURIDICO });
  const conv = await crearConversacion(c.id, { area: "civil" });
  return { ...c, conv };
}
const fuente = (contactId: string) => sql(`select coalesce(first_source, '-') from public.opportunities where contact_id = '${contactId}' order by created_at desc limit 1`);

test("2.8: la primera fuente comprobable queda y no se pisa; sin referencia, «no informada»", async () => {
  await fijarPausa(CON_PAUSA);
  const a = await nuevo();
  await handleInboundMessage({ area: "civil", channelType: "whatsapp", externalUserId: a.phone, phone: a.phone, body: "Hola, vengo desde la web, quiero consultar", externalMessageId: `wamid.f1.${a.phone}` });
  assert.equal(fuente(a.id), "landing");
  await handleInboundMessage({ area: "civil", channelType: "whatsapp", externalUserId: a.phone, phone: a.phone, body: "otra cosa", externalMessageId: `wamid.f2.${a.phone}`, metadata: { referral: { source_type: "ad", source_id: "9" } } });
  assert.equal(fuente(a.id), "landing", "no se pisa");

  const b = await nuevo();
  await handleInboundMessage({ area: "civil", channelType: "whatsapp", externalUserId: b.phone, phone: b.phone, body: "Hola", externalMessageId: `wamid.f3.${b.phone}` });
  assert.equal(fuente(b.id), "base_importada", "vino de una base (contacto de prueba con origen base_de_datos)");

  const c = await nuevo();
  sql(`update public.contacts set source = 'organico_whatsapp' where id = '${c.id}'`);
  await handleInboundMessage({ area: "civil", channelType: "whatsapp", externalUserId: c.phone, phone: c.phone, body: "Hola", externalMessageId: `wamid.f4.${c.phone}` });
  assert.equal(fuente(c.id), "no_informada");
});

test("2.6: un audio recibe un solo pedido de texto (si la IA podría responder) y nunca con pausa", async () => {
  await fijarPausa(SIN_PAUSA);
  const a = await nuevo();
  const audio = (n: number) =>
    handleInboundMessage({ area: "civil", channelType: "whatsapp", externalUserId: a.phone, phone: a.phone, body: "[Audio]", messageType: "audio", aiReadable: false, externalMessageId: `wamid.au${n}.${a.phone}` });
  await audio(1);
  await audio(2);
  assert.equal(red.enviosA(a.phone).length, 1, "un solo pedido");
  const { data } = await db().from("messages").select("origin, body").eq("conversation_id", a.conv).eq("direction", "saliente");
  assert.equal(data?.[0]?.origin, "respuesta_entrante");

  await fijarPausa(CON_PAUSA);
  const b = await nuevo();
  await handleInboundMessage({ area: "civil", channelType: "whatsapp", externalUserId: b.phone, phone: b.phone, body: "[Audio]", messageType: "audio", aiReadable: false, externalMessageId: `wamid.au9.${b.phone}` });
  assert.equal(red.enviosA(b.phone).length, 0);
});

test("A06: la búsqueda del Inbox encuentra un valor que solo está en una columna importada", async () => {
  const a = await nuevo();
  const baseId = sql(`insert into public.imported_bases (area, name, source_label) values ('civil', 'Base de prueba', 'prueba') returning id`).split("\n")[0];
  sql(`insert into public.imported_base_rows (base_id, row_number, raw_data, status, contact_id) values ('${baseId}', 1, '{"Expediente":"EXP-ZZ-4821","Barrio":"Prueba"}', 'creado', '${a.id}')`);
  sql(`insert into public.messages (conversation_id, sender_type, direction, body) values ('${a.conv}', 'prospecto', 'entrante', 'hola')`);
  const res = await inbox(pedido("http://local/api/inbox?q=EXP-ZZ-4821"));
  const json: any = await res.json();
  assert.equal(res.status, 200, JSON.stringify(json));
  assert.equal(json.total, 1);
  assert.equal(json.items[0].id, a.conv);
});
