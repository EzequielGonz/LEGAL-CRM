// Reproducción de los 6 puntos de la revisión contra la ENTREGA ANTERIOR
// (7c721bf + kocos-pipeline-etapa1.zip), en la base de pruebas con datos
// inventados y Meta simulado. Cada prueba PASA si el error existía en esa
// versión. Se corre con tests/reproduccion/correr.sh (ver README.md).
// Con la versión corregida, las mismas situaciones están cubiertas por
// tests/unitarias y tests/integracion.
import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { RedSimulada, SIN_PAUSA, CON_PAUSA, crearContacto, crearConversacion, db, esperarApi, fijarPausa } from "../integracion/soporte/entorno";
import { crearCampana } from "../integracion/soporte/campanas";
import { getAutomationPause } from "@/lib/automation-pause";
import { tickCampaign } from "@/lib/campaigns";
import { sendOutboundMessage } from "@/lib/messaging";
import { classifyMetaSendError } from "@/lib/plantillas/catalogo";
import { findBarrio } from "@/lib/ficha";
import { POST as responderManual } from "@/app/api/conversations/[id]/messages/route";

// Reloj fijo en un martes a las 12 (Argentina) para que la versión anterior,
// que usa la hora real, esté dentro del horario de envío.
const RealDate = Date;
const FIJA = new RealDate("2026-10-06T15:00:00Z").getTime();
class FakeDate extends RealDate {
  constructor(...args: any[]) {
    if (args.length === 0) super(FIJA);
    else super(...(args as [any]));
  }
  static now() {
    return FIJA;
  }
}

let red: RedSimulada;
before(async () => {
  red = new RedSimulada();
  await esperarApi();
});
after(() => {
  (globalThis as any).Date = RealDate;
  red.restaurar();
});

test("1 reproducido: sin registro de pausa, la versión anterior habilita todo", async () => {
  await fijarPausa("sin_fila");
  const p = await getAutomationPause();
  assert.deepEqual([p.aiRepliesPaused, p.outboundPaused], [false, false]);
  await fijarPausa(SIN_PAUSA);
});

test("2 reproducido: dos ticks simultáneos envían dos veces al mismo destinatario", async () => {
  await fijarPausa(SIN_PAUSA);
  const { campaignId, destinatarios } = await crearCampana("repro duplicados", 3);
  (globalThis as any).Date = FakeDate;
  red.demoraEnvioMs = 300;
  try {
    await Promise.all([tickCampaign(campaignId), tickCampaign(campaignId)]);
  } finally {
    red.demoraEnvioMs = 0;
    (globalThis as any).Date = RealDate;
  }
  const dobles = destinatarios.filter((d) => red.enviosA(d.phone).length > 1);
  assert.ok(dobles.length >= 1, `envíos por destinatario: ${destinatarios.map((d) => red.enviosA(d.phone).length).join(",")}`);
});

test("3 reproducido: la IA envía con la pausa general activa y la respuesta manual apaga la IA después de enviar", async () => {
  await fijarPausa(CON_PAUSA);
  const c = await crearContacto({ area: "civil" });
  const conv = await crearConversacion(c.id, { area: "civil" });
  await sendOutboundMessage({ conversationId: conv, senderType: "agente_ia", body: "respuesta automática" });
  assert.equal(red.enviosA(c.phone).length, 1, "salió con la pausa activa");
  await fijarPausa(SIN_PAUSA);

  // Respuesta manual: cuando el mensaje llega a Meta, la IA todavía está activa.
  const c2 = await crearContacto({ area: "civil" });
  const conv2 = await crearConversacion(c2.id, { area: "civil", aiEnabled: true });
  let iaAlEnviar: boolean | null = null;
  red.alRecibirEnvio = async () => {
    const { data } = await db().from("conversations").select("ai_enabled").eq("id", conv2).single();
    iaAlEnviar = data!.ai_enabled;
  };
  try {
    const res = await responderManual(new Request("http://local", { method: "POST", body: JSON.stringify({ body: "Hola" }) }), { params: { id: conv2 } });
    assert.equal(res.status, 200);
  } finally {
    red.alRecibirEnvio = null;
  }
  assert.equal(iaAlEnviar, true, "la IA se apagaba recién después de enviar");
});

test("4 reproducido: el mensaje de campaña no guarda el identificador de Meta", async () => {
  await fijarPausa(SIN_PAUSA);
  const { campaignId } = await crearCampana("repro estados", 1);
  (globalThis as any).Date = FakeDate;
  try {
    const r = await tickCampaign(campaignId);
    assert.equal(r.action, "sent");
  } finally {
    (globalThis as any).Date = RealDate;
  }
  const { data } = await db().from("messages").select("external_message_id").eq("metadata->>campaign_id", campaignId);
  assert.equal(data!.length, 1);
  assert.equal(data![0].external_message_id, null);
});

test("5 reproducido: sin código (red caída) se atribuye al contacto y queda fallido", async () => {
  assert.equal(classifyMetaSendError(null), "contacto");
  await fijarPausa(SIN_PAUSA);
  const { campaignId, destinatarios } = await crearCampana("repro red", 1);
  red.responder(destinatarios[0].phone, { red: "sin_respuesta" });
  (globalThis as any).Date = FakeDate;
  try {
    await tickCampaign(campaignId);
  } finally {
    (globalThis as any).Date = RealDate;
  }
  const { data } = await db().from("campaign_contacts").select("status").eq("id", destinatarios[0].ccId).single();
  assert.equal(data!.status, "fallo");
});

test("6 reproducido: con domicilio antes que barrio, sale la dirección completa", () => {
  assert.equal(findBarrio(null, { Domicilio: "Av. Siempre Viva 742", Barrio: "Lanús" }), "Av. Siempre Viva 742");
});
