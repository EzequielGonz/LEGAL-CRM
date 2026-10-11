// Correcciones 2 y 5 — Envíos de campaña sin duplicados y sin atribuir
// fallas técnicas al prospecto. Base de pruebas con datos inventados y
// Meta simulado: ninguna llamada sale a internet.
import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { RedSimulada, SIN_PAUSA, db, esperarApi, fijarPausa, sql } from "./soporte/entorno";
import { EN_HORARIO, crearCampana, estadoDestinatarios } from "./soporte/campanas";
import { tickCampaign } from "@/lib/campaigns";
import { MAX_TRANSIENT_ATTEMPTS } from "@/lib/envios/errores";

let red: RedSimulada;

before(async () => {
  red = new RedSimulada();
  await esperarApi();
  await fijarPausa(SIN_PAUSA); // solo en la base de pruebas
});
after(() => red.restaurar());

/** Ticks seguidos hasta que la campaña termina o no hay nada más para hacer. */
async function hastaTerminar(campaignId: string, max = 50) {
  const acciones: string[] = [];
  for (let i = 0; i < max; i++) {
    const r = await tickCampaign(campaignId, { now: EN_HORARIO });
    acciones.push(r.action);
    if (r.action === "finished" || r.action === "not_running") break;
  }
  return acciones;
}

async function mensajesDeCampana(campaignId: string) {
  const { data } = await db().from("messages").select("id, external_message_id, delivery_status, metadata").eq("metadata->>campaign_id", campaignId);
  return data ?? [];
}

test("2: muchos ticks simultáneos: cada destinatario recibe un solo envío", async () => {
  const { campaignId, destinatarios } = await crearCampana("simultáneos", 6);
  red.demoraEnvioMs = 120;
  try {
    // 12 ejecuciones a la vez: una sola procesa la campaña, el resto ve "ocupado".
    const primeras = await Promise.all(Array.from({ length: 12 }, () => tickCampaign(campaignId, { now: EN_HORARIO })));
    assert.equal(primeras.filter((r) => r.action === "sent").length, 1, JSON.stringify(primeras.map((r) => r.action)));
    assert.equal(primeras.filter((r) => r.action === "busy").length, 11);
    // Tandas simultáneas hasta terminar.
    for (let ronda = 0; ronda < 20; ronda++) {
      const r = await Promise.all(Array.from({ length: 5 }, () => tickCampaign(campaignId, { now: EN_HORARIO })));
      if (r.some((x) => x.action === "finished")) break;
    }
  } finally {
    red.demoraEnvioMs = 0;
  }
  for (const d of destinatarios) assert.equal(red.enviosA(d.phone).length, 1, `un solo envío a ${d.phone}`);
  const estados = await estadoDestinatarios(campaignId);
  assert.deepEqual([...estados.values()].map((r: any) => r.status), Array(6).fill("enviado"));
  const mensajes = await mensajesDeCampana(campaignId);
  assert.equal(mensajes.length, 6, "un mensaje registrado por destinatario");
  assert.equal(new Set(mensajes.map((m: any) => m.external_message_id)).size, 6);
});

test("2: la reserva es atómica: 20 reservas simultáneas nunca toman el mismo destinatario", async () => {
  const { campaignId, destinatarios } = await crearCampana("reservas", 8);
  const s = db();
  const res = await Promise.all(
    Array.from({ length: 20 }, () => s.rpc("campaign_claim_next", { p_campaign: campaignId, p_token: randomUUID() }))
  );
  const tomados = res.flatMap((r: any) => (Array.isArray(r.data) ? r.data : [])).map((x: any) => x.id);
  assert.equal(tomados.length, 8, "se reservan los 8, ni uno más");
  assert.equal(new Set(tomados).size, 8, "ningún destinatario dos veces");
  assert.deepEqual(new Set(tomados), new Set(destinatarios.map((d) => d.ccId)));
});

test("2: aunque se rompa el bloqueo de la campaña, dos ejecuciones nunca envían al mismo destinatario", async () => {
  const { campaignId, destinatarios } = await crearCampana("bloqueo vencido", 2);
  red.demoraEnvioMs = 600;
  try {
    const a = tickCampaign(campaignId, { now: EN_HORARIO });
    await new Promise((ok) => setTimeout(ok, 250)); // A ya reservó y está esperando a Meta
    // Se fuerza el vencimiento del bloqueo, como si A se hubiera colgado.
    sql(`update campaigns set tick_lock_until = now() - interval '1 second' where id = '${campaignId}'`);
    const b = tickCampaign(campaignId, { now: EN_HORARIO });
    const [ra, rb] = await Promise.all([a, b]);
    assert.deepEqual([ra.action, rb.action], ["sent", "sent"]);
    assert.notEqual(ra.detail, rb.detail, "cada una envió a un destinatario distinto");
  } finally {
    red.demoraEnvioMs = 0;
  }
  for (const d of destinatarios) assert.equal(red.enviosA(d.phone).length, 1);
});

test("2: reintentos ante fallas temporales de Meta, con límite y sin duplicar", async () => {
  const { campaignId, destinatarios } = await crearCampana("reintentos", 2);
  const [x, y] = destinatarios;
  const temporal = { status: 429, body: { error: { code: 130429, message: "Rate limit hit" } } };
  red.responder(x.phone, temporal, temporal); // dos fallas y después sale
  red.responder(y.phone, ...Array(MAX_TRANSIENT_ATTEMPTS).fill(temporal)); // siempre falla
  await hastaTerminar(campaignId);
  const estados = await estadoDestinatarios(campaignId);
  const ex: any = estados.get(x.ccId);
  assert.equal(ex.status, "enviado");
  assert.equal(ex.attempts, 3);
  assert.equal(red.enviosA(x.phone).length, 3, "2 rechazos + 1 envío aceptado");
  const ey: any = estados.get(y.ccId);
  assert.equal(ey.status, "revisar", "superado el límite queda para revisión");
  assert.equal(ey.send_uncertain, false, "Meta lo rechazó: no hay duda de envío");
  assert.equal(red.enviosA(y.phone).length, MAX_TRANSIENT_ATTEMPTS);
  // Más ticks no lo reenvían.
  await hastaTerminar(campaignId);
  assert.equal(red.enviosA(y.phone).length, MAX_TRANSIENT_ATTEMPTS);
  assert.equal((await mensajesDeCampana(campaignId)).length, 1, "un solo mensaje registrado (el que salió)");
});

test("2: si falla guardar el resultado, se reintenta; si sigue fallando, queda a revisar y no se reenvía", async () => {
  const { campaignId, destinatarios } = await crearCampana("falla al guardar", 2);
  const [x, y] = destinatarios;

  // x: la base falla 2 veces al guardar el resultado y a la tercera lo guarda.
  red.fallasRpc.set("campaign_finish_send", 2);
  const r1 = await tickCampaign(campaignId, { now: EN_HORARIO });
  assert.equal(r1.action, "sent");
  assert.equal(((await estadoDestinatarios(campaignId)).get(x.ccId) as any).status, "enviado");

  // y: la base no deja guardar el resultado en ninguno de los reintentos.
  red.fallasRpc.set("campaign_finish_send", 3);
  const r2 = await tickCampaign(campaignId, { now: EN_HORARIO });
  assert.equal(r2.action, "sent", "Meta lo aceptó");
  let ey: any = (await estadoDestinatarios(campaignId)).get(y.ccId);
  assert.equal(ey.status, "enviando", "queda reservado, con la marca de inicio");
  assert.ok(ey.send_started_at);

  // Ticks posteriores no lo vuelven a tomar mientras la reserva está vigente.
  for (let i = 0; i < 3; i++) await tickCampaign(campaignId, { now: EN_HORARIO });
  assert.equal(red.enviosA(y.phone).length, 1);

  // Vencida la reserva, la recuperación lo pasa a revisión (no a la cola).
  const rec = await db().rpc("campaign_recover_stale", { p_campaign: campaignId, p_lease_seconds: 0 });
  assert.deepEqual(rec.data, { liberados: 0, a_revisar: 1 });
  ey = (await estadoDestinatarios(campaignId)).get(y.ccId);
  assert.equal(ey.status, "revisar");
  assert.equal(ey.send_uncertain, true);
  await hastaTerminar(campaignId);
  assert.equal(red.enviosA(y.phone).length, 1, "nunca se reenvía solo");
  assert.equal(red.enviosA(x.phone).length, 1);
});

test("2: ejecución cortada antes de llamar a Meta: vuelve a la cola y sale una sola vez", async () => {
  const { campaignId, destinatarios } = await crearCampana("cortada antes", 1);
  const [x] = destinatarios;
  const claim = await db().rpc("campaign_claim_next", { p_campaign: campaignId, p_token: randomUUID() });
  assert.equal(claim.data?.[0]?.id, x.ccId);
  // La reserva quedó colgada (sin marca de inicio): vuelve a la cola sin contar como intento.
  const rec = await db().rpc("campaign_recover_stale", { p_campaign: campaignId, p_lease_seconds: 0 });
  assert.deepEqual(rec.data, { liberados: 1, a_revisar: 0 });
  const ex: any = (await estadoDestinatarios(campaignId)).get(x.ccId);
  assert.deepEqual([ex.status, ex.attempts], ["pendiente", 0]);
  await hastaTerminar(campaignId);
  assert.equal(red.enviosA(x.phone).length, 1);
});

test("2: ejecución cortada después de empezar el envío: a revisar; reintentar exige confirmación", async () => {
  const { campaignId, destinatarios } = await crearCampana("cortada después", 1);
  const [x] = destinatarios;
  const token = randomUUID();
  await db().rpc("campaign_claim_next", { p_campaign: campaignId, p_token: token });
  const marca = await db().rpc("campaign_mark_sending", { p_campaign_contact: x.ccId, p_token: token });
  assert.equal(marca.data, true);
  await db().rpc("campaign_recover_stale", { p_campaign: campaignId, p_lease_seconds: 0 });
  let ex: any = (await estadoDestinatarios(campaignId)).get(x.ccId);
  assert.deepEqual([ex.status, ex.send_uncertain], ["revisar", true]);
  assert.match(ex.review_reason, /no se sabe si Meta aceptó/);
  await hastaTerminar(campaignId);
  assert.equal(red.enviosA(x.phone).length, 0, "no se envía solo");

  const sinConfirmar = await db().rpc("campaign_review_action", { p_campaign_contact: x.ccId, p_action: "reintentar" });
  assert.equal(sinConfirmar.data, "requiere_confirmacion");
  const confirmado = await db().rpc("campaign_review_action", {
    p_campaign_contact: x.ccId,
    p_action: "reintentar",
    p_confirm_uncertain: true,
    p_note: "Revisado: no le llegó",
  });
  assert.equal(confirmado.data, "ok");
  ex = (await estadoDestinatarios(campaignId)).get(x.ccId);
  assert.equal(ex.status, "pendiente");
  await db().from("campaigns").update({ status: "en_curso", finished_at: null }).eq("id", campaignId);
  await hastaTerminar(campaignId);
  assert.equal(red.enviosA(x.phone).length, 1, "sale una sola vez, por decisión de una persona");
});

test("5: red caída o tiempo vencido sin respuesta: a revisión como incierto, nunca 'fallido' ni reenvío", async () => {
  const { campaignId, destinatarios } = await crearCampana("inciertos", 3);
  const [a, b, c] = destinatarios;
  red.responder(a.phone, { red: "sin_respuesta" });
  red.responder(b.phone, { red: "tiempo_vencido" });
  red.responder(c.phone, { status: 502, body: "<html>Bad gateway</html>" } as any);
  await hastaTerminar(campaignId);
  const estados = await estadoDestinatarios(campaignId);
  for (const d of [a, b, c]) {
    const e: any = estados.get(d.ccId);
    assert.equal(e.status, "revisar", d.phone);
    assert.equal(e.send_uncertain, true, "no se sabe si Meta lo aceptó");
    assert.match(e.review_reason, /No se reenvía solo/);
    assert.equal(red.enviosA(d.phone).length, 1, "sin reenvío automático");
  }
  await hastaTerminar(campaignId);
  for (const d of [a, b, c]) assert.equal(red.enviosA(d.phone).length, 1);
});

test("5: Meta responde bien pero sin el identificador del mensaje: incierto, a revisión", async () => {
  const { campaignId, destinatarios } = await crearCampana("sin identificador", 1);
  red.responder(destinatarios[0].phone, { status: 200, body: { messaging_product: "whatsapp" } });
  await hastaTerminar(campaignId);
  const e: any = (await estadoDestinatarios(campaignId)).get(destinatarios[0].ccId);
  assert.deepEqual([e.status, e.send_uncertain], ["revisar", true]);
});

test("5: solo un error confirmado del destinatario lo marca 'fallido'; cuenta o plantilla pausan la campaña", async () => {
  const { campaignId, destinatarios } = await crearCampana("errores confirmados", 3);
  const [a, b] = destinatarios;
  red.responder(a.phone, { status: 400, body: { error: { code: 131026, message: "Message undeliverable" } } });
  red.responder(b.phone, { status: 401, body: { error: { code: 190, message: "Invalid OAuth access token" } } });
  await hastaTerminar(campaignId);
  const estados = await estadoDestinatarios(campaignId);
  assert.equal((estados.get(a.ccId) as any).status, "fallo", "Meta confirmó un problema de ese destinatario");
  const eb: any = estados.get(b.ccId);
  assert.equal(eb.status, "pendiente", "un problema de la línea no se atribuye al prospecto");
  assert.match(eb.error, /línea o la cuenta/);
  const { data: camp } = await db().from("campaigns").select("status, pause_reason").eq("id", campaignId).single();
  assert.equal(camp!.status, "pausada");
  assert.match(camp!.pause_reason, /código 190/);
  assert.equal((estados.get(destinatarios[2].ccId) as any).status, "pendiente", "el resto de la cola se conserva");
});
