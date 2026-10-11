// Correcciones 3, 4 y 5 en los seguimientos automáticos de Marketing: se
// revalida la pausa general y si una persona tomó la conversación justo
// antes de enviar; el mensaje guarda el identificador de Meta; un resultado
// incierto no se reintenta solo.
import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { CON_PAUSA, RedSimulada, SIN_PAUSA, crearContacto, crearConversacion, db, esperarApi, fijarPausa } from "./soporte/entorno";
import { EN_HORARIO } from "./soporte/campanas";
import { processOneDueFollowup } from "@/lib/marketing/followups";

const MARKETING = "44444444-4444-4444-4444-444444444444";
process.env.WHATSAPP_MARKETING_PHONE_NUMBER_ID = "100000000000044";
process.env.WHATSAPP_MARKETING_ACCESS_TOKEN = "token-marketing-de-prueba";

let red: RedSimulada;
before(async () => {
  red = new RedSimulada();
  await esperarApi();
  // Plantillas de seguimiento aprobadas en el catálogo (inventadas).
  for (const name of [process.env.MARKETING_TEMPLATE_REPESCA_1 ?? "kocos_repesca_1", process.env.MARKETING_TEMPLATE_REPESCA_2 ?? "kocos_repesca_2"]) {
    const { data } = await db().from("whatsapp_templates").select("id").eq("name", name).eq("language", "es_AR").maybeSingle();
    if (!data) {
      const r = await db()
        .from("whatsapp_templates")
        .insert({ waba_id: "200000000000044", name, language: "es_AR", status: "APPROVED", campaign_compatible: true, components: [], variables: {} });
      if (r.error) throw new Error(r.error.message);
    }
  }
});
after(async () => {
  await fijarPausa(SIN_PAUSA);
  red.restaurar();
});

/** Lead de Marketing en seguimiento, con el seguimiento vencido. */
async function leadVencido(opts: { aiEnabled: boolean }) {
  const c = await crearContacto({ area: "marketing", rubroId: MARKETING, nombre: `Negocio De Prueba ${randomUUID().slice(0, 4)}` });
  const conv = await crearConversacion(c.id, { area: "marketing", aiEnabled: opts.aiEnabled });
  const { data, error } = await db()
    .from("marketing_leads")
    .insert({
      contact_id: c.id,
      outreach_status: "repesca",
      followup_count: 0,
      next_followup_at: new Date(EN_HORARIO.getTime() - 60_000).toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { leadId: data!.id as string, phone: c.phone, conv };
}

async function lead(id: string) {
  const { data } = await db().from("marketing_leads").select("followup_count, next_followup_at, closed_reason").eq("id", id).single();
  return data as any;
}

test("3: si una persona tomó la conversación, el seguimiento no sale y se cierra", async () => {
  await fijarPausa(SIN_PAUSA);
  const l = await leadVencido({ aiEnabled: false });
  const r = await processOneDueFollowup({ now: EN_HORARIO });
  assert.match(r, /tomada por una persona/);
  assert.equal(red.enviosA(l.phone).length, 0);
  const despues = await lead(l.leadId);
  assert.equal(despues.next_followup_at, null);
  assert.match(despues.closed_reason, /Una persona tomó la conversación/);
});

test("3: con la pausa general activa no sale y queda pendiente", async () => {
  const l = await leadVencido({ aiEnabled: true });
  await fijarPausa(CON_PAUSA);
  const r = await processOneDueFollowup({ now: EN_HORARIO });
  assert.match(r, /pausa general/);
  assert.equal(red.enviosA(l.phone).length, 0);
  assert.ok((await lead(l.leadId)).next_followup_at, "sigue pendiente para cuando se levante la pausa");
  // Se cierra este para que no interfiera con las pruebas siguientes.
  await db().from("marketing_leads").update({ next_followup_at: null, closed_reason: "Cerrado por la prueba" }).eq("id", l.leadId);
  await fijarPausa(SIN_PAUSA);
});

test("4: el seguimiento enviado guarda el identificador de Meta y su estado", async () => {
  await fijarPausa(SIN_PAUSA);
  const l = await leadVencido({ aiEnabled: true });
  const r = await processOneDueFollowup({ now: EN_HORARIO });
  assert.match(r, /seguimiento 1 enviado/);
  assert.equal(red.enviosA(l.phone).length, 1);
  const { data } = await db().from("messages").select("external_message_id, delivery_status, metadata").eq("conversation_id", l.conv).single();
  assert.match(data!.external_message_id, /^wamid\.PRUEBA\./);
  assert.equal(data!.delivery_status, "enviado");
  assert.equal(data!.metadata.marketing_followup, 1);
  assert.equal((await lead(l.leadId)).followup_count, 1);
});

test("5: sin respuesta de Meta el seguimiento queda para revisión y no se reintenta solo", async () => {
  await fijarPausa(SIN_PAUSA);
  const l = await leadVencido({ aiEnabled: true });
  red.responder(l.phone, { red: "sin_respuesta" });
  const r = await processOneDueFollowup({ now: EN_HORARIO });
  assert.match(r, /incierto/);
  const despues = await lead(l.leadId);
  assert.equal(despues.next_followup_at, null);
  assert.match(despues.closed_reason, /No se pudo confirmar el envío/);
  const { data: ev } = await db().from("marketing_events").select("event_type").eq("lead_id", l.leadId);
  assert.ok((ev ?? []).some((e: any) => e.event_type === "repesca_incierta"));
  await processOneDueFollowup({ now: EN_HORARIO });
  assert.equal(red.enviosA(l.phone).length, 1, "no se reenvía");
});
