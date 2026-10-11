// Corrección 1 — Pausa general ante configuración incompleta, de punta a
// punta: el panel, el motor de campañas y la compuerta de la IA en la base
// mantienen todo en pausa si el registro falta, es nulo o le faltan campos.
import test, { after, before } from "node:test";
import assert from "node:assert/strict";

import { RedSimulada, SIN_PAUSA, crearContacto, crearConversacion, db, esperarApi, fijarPausa, sql } from "./soporte/entorno";
import { EN_HORARIO, crearCampana } from "./soporte/campanas";
import { getAutomationPause } from "@/lib/automation-pause";
import { tickCampaign } from "@/lib/campaigns";
import { sendOutboundMessage } from "@/lib/messaging";

let red: RedSimulada;
before(async () => {
  red = new RedSimulada();
  await esperarApi();
});
after(async () => {
  await fijarPausa(SIN_PAUSA);
  red.restaurar();
});

const CASOS: { nombre: string; preparar: () => Promise<void> }[] = [
  { nombre: "sin registro", preparar: () => fijarPausa("sin_fila") },
  {
    nombre: "valor nulo",
    preparar: async () => {
      await fijarPausa(SIN_PAUSA);
      sql(`update system_settings set value = 'null'::jsonb where key = 'automation_pause'`);
    },
  },
  { nombre: "objeto vacío", preparar: () => fijarPausa({}) },
  { nombre: "campos con otro tipo", preparar: () => fijarPausa({ ai_replies_paused: "false", outbound_automations_paused: 0 }) },
];

for (const caso of CASOS) {
  test(`1: ${caso.nombre}: el panel ve todo en pausa con el problema, no sale ningún envío automático`, async () => {
    await caso.preparar();
    const p = await getAutomationPause();
    assert.deepEqual([p.aiRepliesPaused, p.outboundPaused], [true, true]);
    assert.ok(p.configProblem, "el panel muestra el problema de configuración");

    // La base aplica la misma regla.
    const ia = await db().rpc("automation_pause_active", { p_field: "ai_replies_paused" });
    const envios = await db().rpc("automation_pause_active", { p_field: "outbound_automations_paused" });
    assert.deepEqual([ia.data, envios.data], [true, true]);

    // Campañas: no envía.
    const { campaignId, destinatarios } = await crearCampana(`pausa ${caso.nombre}`, 1);
    const r = await tickCampaign(campaignId, { now: EN_HORARIO });
    assert.equal(r.action, "not_running");
    assert.match(r.detail ?? "", /Pausa general/);
    assert.equal(red.enviosA(destinatarios[0].phone).length, 0);

    // IA: la compuerta de la base la frena.
    const c = await crearContacto({ area: "civil" });
    const conv = await crearConversacion(c.id, { area: "civil" });
    await assert.rejects(
      sendOutboundMessage({ conversationId: conv, senderType: "agente_ia", body: "x" }),
      (e: any) => e.reason === "pausa_general"
    );
    assert.equal(red.enviosA(c.phone).length, 0);
  });
}

test("1: falta un solo campo: solo esa pausa queda activa (el false explícito se respeta)", async () => {
  await fijarPausa({ ai_replies_paused: false });
  const p = await getAutomationPause();
  assert.deepEqual([p.aiRepliesPaused, p.outboundPaused], [false, true]);
  assert.match(p.configProblem ?? "", /outbound_automations_paused/);
  const envios = await db().rpc("automation_pause_active", { p_field: "outbound_automations_paused" });
  assert.equal(envios.data, true);
  const { campaignId } = await crearCampana("pausa un campo", 1);
  assert.equal((await tickCampaign(campaignId, { now: EN_HORARIO })).action, "not_running");
});

test("1: configuración completa con false explícito: se habilita (solo en la base de pruebas)", async () => {
  await fijarPausa(SIN_PAUSA);
  const p = await getAutomationPause();
  assert.deepEqual([p.aiRepliesPaused, p.outboundPaused, p.configProblem], [false, false, undefined]);
  const { campaignId, destinatarios } = await crearCampana("sin pausa", 1);
  assert.equal((await tickCampaign(campaignId, { now: EN_HORARIO })).action, "sent");
  assert.equal(red.enviosA(destinatarios[0].phone).length, 1);
});
