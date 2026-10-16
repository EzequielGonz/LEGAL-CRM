// Etapa 2 · Bloque 1 — Captación por evento único, avisos, atención humana
// (12.2), detención con disculpa, entrantes 24 h, resultado posterior y citas.
// Base de pruebas, Meta simulado y modelo de IA simulado: nada sale afuera.
import test, { after, before } from "node:test";
import assert from "node:assert/strict";

import { CON_PAUSA, RedSimulada, SIN_PAUSA, crearContacto, crearConversacion, db, esperarApi, fijarPausa, pedido, prepararSesionDePrueba, sql } from "./soporte/entorno";
import { handleInboundMessage } from "@/lib/inbound";
import { usarModeloAgente, type ModeloAgente } from "@/lib/ai-agent/agent";
import { registrarCaptacion, solicitarAtencion } from "@/lib/captacion";
import { ensureOpportunity } from "@/lib/opportunities";
import { crearCitaIa, ejecutarCitaTareasVencidas, registrarInicioEnviado } from "@/lib/citas";
import { POST as accionOportunidad } from "@/app/api/oportunidades/[id]/route";
import { POST as cambiar24h } from "@/app/api/perfiles/atencion-24h/route";

const JURIDICO = "11111111-1111-1111-1111-111111111111";
const PIN_PRUEBA = process.env.ACCESS_PIN && /^[0-9]{6}$/.test(process.env.ACCESS_PIN) ? process.env.ACCESS_PIN : "482915";
const art = (day: string, hh: number, mm = 0) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh + 3, mm));
};
const json = (body: unknown) => pedido("http://local/api", { method: "POST", body: JSON.stringify(body) });

let red: RedSimulada;
let llamadasModelo = 0;
let guion: ModeloAgente = async () => ({ parts: [{ text: "Hola, ¿en qué te ayudo?" }] });

before(async () => {
  red = new RedSimulada();
  await esperarApi();
  await prepararSesionDePrueba();
  // Solo en la base de pruebas: agente Civil activo y con identidad.
  sql(`insert into public.ai_agents (area, display_name, system_prompt, active) values ('civil', 'Agente de prueba', 'Sos un asistente de prueba.', true)
       on conflict (area) do update set active = true`);
  sql(`update public.rubros set brand_name = 'Estudio de Prueba', agent_presentation_name = 'Asistente de Prueba' where id = '${JURIDICO}'`);
  usarModeloAgente(async (req) => {
    llamadasModelo++;
    return guion(req);
  });
});
after(() => {
  sql(`update public.ai_agents set active = false where area = 'civil'`);
  usarModeloAgente(null);
  red.restaurar();
});

async function chat(opts: { aiEnabled?: boolean } = {}) {
  const c = await crearContacto({ area: "civil", rubroId: JURIDICO });
  const conv = await crearConversacion(c.id, { area: "civil", aiEnabled: opts.aiEnabled ?? true });
  const opp = await ensureOpportunity({ contactId: c.id, conversationId: conv });
  return { contactId: c.id, phone: c.phone, conv, opp: opp.id };
}
async function entrante(phone: string, body: string, now?: Date) {
  return handleInboundMessage({ area: "civil", channelType: "whatsapp", externalUserId: phone, phone, body, externalMessageId: `wamid.prueba.${Math.random()}`, now });
}
async function oportunidad(id: string) {
  const { data } = await db().from("opportunities").select("*").eq("id", id).single();
  return data as any;
}
async function salientes(conv: string) {
  const { data } = await db().from("messages").select("body, origin, sender_type").eq("conversation_id", conv).eq("direction", "saliente");
  return (data ?? []) as any[];
}
function fijar24h(valor: boolean) {
  sql(`update public.rubros set inbound_24h_enabled = ${valor} where id = '${JURIDICO}'`);
}

test("A08: domingo a la noche responde solo con la atención 24 h habilitada; nunca con pausa ni chat tomado", async () => {
  const domingo = art("2026-10-18", 23, 30);
  guion = async () => ({ parts: [{ text: "Hola, te leo." }] });

  await fijarPausa(SIN_PAUSA);
  fijar24h(false);
  const a = await chat();
  const r1 = await entrante(a.phone, "Hola, quiero consultar", domingo);
  assert.deepEqual(r1.respuesta, { responder: false, motivo: "fuera_de_horario_sin_24h" });
  assert.equal(red.enviosA(a.phone).length, 0);

  fijar24h(true);
  const b = await chat();
  const r2 = await entrante(b.phone, "Hola, quiero consultar", domingo);
  assert.deepEqual(r2.respuesta, { responder: true });
  assert.equal(red.enviosA(b.phone).length, 1);
  const out = await salientes(b.conv);
  assert.equal(out.length, 1);
  assert.equal(out[0].origin, "respuesta_entrante");

  await fijarPausa(CON_PAUSA);
  const c = await chat();
  const r3 = await entrante(c.phone, "Hola", domingo);
  assert.equal((r3.respuesta as any).motivo, "pausa_general");
  assert.equal(red.enviosA(c.phone).length, 0);

  await fijarPausa(SIN_PAUSA);
  const d = await chat({ aiEnabled: false });
  const r4 = await entrante(d.phone, "Hola", domingo);
  assert.equal((r4.respuesta as any).motivo, "chat_tomado");
  assert.equal(red.enviosA(d.phone).length, 0);
  fijar24h(false);
});

test("activar la atención 24 h pide el PIN y no levanta la pausa general", async () => {
  await fijarPausa(CON_PAUSA);
  const mal = await cambiar24h(json({ rubro_id: JURIDICO, enabled: true, pin: "000001" }));
  assert.notEqual(mal.status, 200);
  assert.equal(sql(`select inbound_24h_enabled from public.rubros where id = '${JURIDICO}'`), "f");
  const bien = await cambiar24h(json({ rubro_id: JURIDICO, enabled: true, pin: PIN_PRUEBA }));
  assert.equal(bien.status, 200);
  assert.equal(sql(`select inbound_24h_enabled from public.rubros where id = '${JURIDICO}'`), "t");
  assert.equal(sql(`select value->>'ai_replies_paused' from public.system_settings where key = 'automation_pause'`), "true");
  fijar24h(false);
});

test("C10/2.9: cierre repetido o simultáneo = un evento y un aviso; sin destinatario queda pendiente y visible", async () => {
  await fijarPausa(SIN_PAUSA);
  const a = await chat();
  const res = await Promise.all(
    Array.from({ length: 5 }, () => registrarCaptacion({ opportunityId: a.opp, actor: "ia", aceptacion: true, evidencia: "Acepta la revisión y el contacto del profesional", datos: {} }))
  );
  assert.equal(res.filter((r) => r.nuevo).length, 1);
  assert.ok(res.every((r) => r.captado && r.eventId === res[0].eventId));
  assert.equal(sql(`select count(*) from public.capture_events where opportunity_id = '${a.opp}'`), "1");
  assert.equal(sql(`select count(*) || ':' || min(status) from public.capture_notices n join public.capture_events e on e.id = n.capture_event_id where e.opportunity_id = '${a.opp}'`), "1:sin_destinatario");
  const o = await oportunidad(a.opp);
  assert.equal(o.capture_state, "captado");
  assert.equal(o.location_zone, "sin_confirmar");
  assert.ok((o.capture_warnings as string[]).includes("ubicacion_sin_confirmar"));
  assert.equal(o.derivation_state, "no_derivado", "captar no deriva");
  assert.equal(sql(`select count(*) from public.opportunity_events where opportunity_id = '${a.opp}' and dimension = 'captacion' and to_value = 'captado'`), "1");

  // Con destinatarios configurados: un aviso por destinatario.
  sql(`update public.rubros set capture_notice_recipients = '[{"clave":"equipo-a","nombre":"Equipo A"},{"clave":"equipo-b","nombre":"Equipo B"}]' where id = '${JURIDICO}'`);
  const b = await chat();
  await registrarCaptacion({ opportunityId: b.opp, actor: "operador", aceptacion: true, evidencia: "Aceptó el contacto", zona: "fuera" });
  await registrarCaptacion({ opportunityId: b.opp, actor: "operador", aceptacion: true, evidencia: "Aceptó el contacto", zona: "fuera" });
  assert.equal(sql(`select string_agg(recipient_key || '=' || status, ',' order by recipient_key) from public.capture_notices n join public.capture_events e on e.id = n.capture_event_id where e.opportunity_id = '${b.opp}'`), "equipo-a=pendiente,equipo-b=pendiente");
  assert.equal((await oportunidad(b.opp)).location_zone, "fuera", "A17: fuera de AMBA sigue captado, en grupo aparte");
  sql(`update public.rubros set capture_notice_recipients = '[]' where id = '${JURIDICO}'`);
});

test("C07: solo preguntar el precio no capta y pasa a atención humana con el chat pausado", async () => {
  await fijarPausa(SIN_PAUSA);
  const a = await chat();
  const r = await registrarCaptacion({ opportunityId: a.opp, actor: "ia", aceptacion: true, evidencia: "¿Cuánto cobran?", soloPrecio: true });
  assert.equal(r.captado, false);
  const o = await oportunidad(a.opp);
  assert.equal(o.capture_state, "nuevo");
  assert.equal(o.attention_state, "requiere_humano");
  assert.equal(o.attention_category, "comercial");
  assert.equal(o.attention_reason, "precio_fuera_alcance");
  assert.equal(sql(`select ai_enabled from public.conversations where id = '${a.conv}'`), "f");
});

test("C12: un captado que vuelve a escribir: el mensaje se guarda, sin respuesta comercial, atención humana prioritaria", async () => {
  await fijarPausa(SIN_PAUSA);
  fijar24h(true);
  const a = await chat();
  await registrarCaptacion({ opportunityId: a.opp, actor: "ia", aceptacion: true, evidencia: "Acepta el contacto del profesional" });
  const antes = llamadasModelo;
  const r = await entrante(a.phone, "Hola, ¿cuándo me llaman?");
  assert.equal(r.status, "guardado");
  assert.equal((r.respuesta as any).motivo, "captado_mensaje_posterior");
  assert.equal(llamadasModelo, antes, "la IA no se llama");
  assert.equal(red.enviosA(a.phone).length, 0);
  const o = await oportunidad(a.opp);
  assert.equal(o.attention_state, "requiere_humano");
  assert.equal(o.attention_reason, "mensaje_posterior_captado");
  assert.equal(sql(`select ai_enabled from public.conversations where id = '${a.conv}'`), "f");
  fijar24h(false);
});

test("A14: número equivocado → la IA manda una sola disculpa breve y recién después queda detenido (archivo secundario)", async () => {
  await fijarPausa(SIN_PAUSA);
  fijar24h(true);
  const a = await chat();
  let vuelta = 0;
  guion = async () => {
    vuelta++;
    if (vuelta === 1) return { parts: [{ functionCall: { name: "detener_contacto", args: { motivo: "numero_equivocado", detalle: "Dice que no es la persona" } } }] };
    return { parts: [{ text: "Disculpá la molestia, no te vamos a volver a escribir." }] };
  };
  await entrante(a.phone, "Número equivocado, no soy esa persona");
  assert.equal(red.enviosA(a.phone).length, 1, "sale una sola disculpa");
  assert.equal(sql(`select count(*) || ':' || min(motive) || ':' || min(source) from public.contact_detentions where contact_id = '${a.contactId}' and status = 'vigente'`), "1:numero_equivocado:agente");
  const o = await oportunidad(a.opp);
  assert.equal(o.attention_category, "detencion");
  assert.equal(o.attention_state, "ia", "no queda como pendiente de la atención principal");
  assert.equal(sql(`select ai_enabled from public.conversations where id = '${a.conv}'`), "f");
  // Si vuelve a escribir, no hay respuesta automática.
  const antes = llamadasModelo;
  await entrante(a.phone, "Hola?");
  assert.equal(llamadasModelo, antes);
  assert.equal(red.enviosA(a.phone).length, 1);
  fijar24h(false);
});

test("A15: pide una persona → pausa del chat, un solo aviso y atención comercial principal", async () => {
  await fijarPausa(SIN_PAUSA);
  fijar24h(true);
  const a = await chat();
  let vuelta = 0;
  guion = async () => {
    vuelta++;
    if (vuelta === 1) return { parts: [{ functionCall: { name: "escalar_a_humano", args: { categoria: "pide_persona", motivo: "Quiere hablar con alguien" } } }] };
    return { parts: [{ text: "Te va a escribir una persona del equipo." }] };
  };
  await entrante(a.phone, "Quiero hablar con una persona");
  assert.equal(red.enviosA(a.phone).length, 1);
  const o = await oportunidad(a.opp);
  assert.equal(o.attention_state, "requiere_humano");
  assert.equal(o.attention_category, "comercial");
  assert.equal(o.attention_reason, "pide_persona");
  assert.equal(sql(`select ai_enabled || ':' || status from public.conversations where id = '${a.conv}'`), "false:requiere_atencion_humana");
  assert.equal(sql(`select count(*) from public.contact_detentions where contact_id = '${a.contactId}'`), "0");
  fijar24h(false);
});

test("A20: el resultado posterior solo después de derivar; no altera captación ni derivación ni inicia secuencias", async () => {
  await fijarPausa(SIN_PAUSA);
  const a = await chat();
  const antes = await accionOportunidad(json({ accion: "resultado_posterior", resultado: "avanzo", fuente: "profesional" }), { params: { id: a.opp } });
  assert.equal(antes.status, 400);
  await accionOportunidad(json({ accion: "captar", nota: "Aceptó el contacto del profesional" }), { params: { id: a.opp } });
  await accionOportunidad(json({ accion: "derivar", nota: "Al estudio" }), { params: { id: a.opp } });
  const sinMotivo = await accionOportunidad(json({ accion: "resultado_posterior", resultado: "no_avanzo", fuente: "profesional" }), { params: { id: a.opp } });
  assert.equal(sinMotivo.status, 400);
  const ok = await accionOportunidad(
    json({ accion: "resultado_posterior", resultado: "contacto_previsto", fuente: "profesional", nota: "La llama el lunes", contacto_previsto: "2026-10-19T13:00:00Z" }),
    { params: { id: a.opp } }
  );
  assert.equal(ok.status, 200);
  const o = await oportunidad(a.opp);
  assert.equal(o.post_derivation_state, "contacto_previsto");
  assert.equal(o.post_derivation_source, "profesional");
  assert.equal(o.capture_state, "captado");
  assert.equal(o.derivation_state, "derivado");
  assert.equal(sql(`select count(*) from public.followup_tasks where opportunity_id = '${a.opp}'`), "0");
  assert.equal(sql(`select count(*) from public.opportunity_events where opportunity_id = '${a.opp}' and dimension = 'resultado_posterior'`), "1");
  // Captar desde el panel también deja el evento único con su aviso.
  assert.equal(sql(`select count(*) from public.capture_events where opportunity_id = '${a.opp}'`), "1");
});

test("A13/A18: Fase 2 de IA no capta; un solo reagendamiento una hora después del inicio enviado; con pausa no sale nada", async () => {
  await fijarPausa(SIN_PAUSA);
  const a = await chat();
  const T = art("2026-10-19", 10); // lunes 10:00
  const cita = await crearCitaIa({ contactId: a.contactId, conversationId: a.conv, area: "civil", opportunityId: a.opp, now: new Date(T.getTime() - 2 * 3_600_000) });
  assert.equal(sql(`select kind from public.appointments where id = '${cita.id}'`), "ia");
  assert.equal((await oportunidad(a.opp)).capture_state, "nuevo", "agendar no capta");
  // La persona escribió a las 8:30; el inicio salió a las 9:00 y no respondió.
  sql(`insert into public.messages (conversation_id, sender_type, direction, body, created_at) values ('${a.conv}', 'prospecto', 'entrante', 'Dale', '${new Date(T.getTime() - 90 * 60_000).toISOString()}')`);
  sql(`update public.cita_tareas set status = 'enviada', status_reason = 'prueba' where appointment_id = '${cita.id}' and kind = 'inicio_cita'`);
  const inicio = new Date(T.getTime() - 3_600_000);
  await registrarInicioEnviado({ appointmentId: cita.id, messageId: null, sentAt: inicio });
  await registrarInicioEnviado({ appointmentId: cita.id, messageId: null, sentAt: inicio });
  assert.equal(sql(`select count(*) || '|' || min(scheduled_at at time zone 'America/Argentina/Buenos_Aires') from public.cita_tareas where appointment_id = '${cita.id}' and kind = 'reagendamiento'`), "1|2026-10-19 10:00:00");

  await fijarPausa(CON_PAUSA);
  assert.deepEqual(await ejecutarCitaTareasVencidas({ now: T }), []);
  assert.equal(red.enviosA(a.phone).length, 0);

  await fijarPausa(SIN_PAUSA);
  const r1 = await ejecutarCitaTareasVencidas({ now: T });
  assert.equal(r1.filter((r) => r.action === "enviada").length, 1);
  const r2 = await ejecutarCitaTareasVencidas({ now: T });
  assert.equal(r2.length, 0, "no se repite");
  assert.equal(red.enviosA(a.phone).length, 1);
  const out = await salientes(a.conv);
  assert.deepEqual(out.map((m) => m.origin), ["reagendamiento"]);
});

test("A13: si respondió después del inicio no hay cita incumplida; domingo no sale (se pasa a la franja siguiente)", async () => {
  await fijarPausa(SIN_PAUSA);
  const a = await chat();
  const T = art("2026-10-19", 11);
  const cita = await crearCitaIa({ contactId: a.contactId, conversationId: a.conv, area: "civil", opportunityId: a.opp, now: new Date(T.getTime() - 3 * 3_600_000) });
  sql(`update public.cita_tareas set status = 'enviada' where appointment_id = '${cita.id}' and kind = 'inicio_cita'`);
  await registrarInicioEnviado({ appointmentId: cita.id, messageId: null, sentAt: new Date(T.getTime() - 3_600_000) });
  sql(`insert into public.messages (conversation_id, sender_type, direction, body, created_at) values ('${a.conv}', 'prospecto', 'entrante', 'Estoy acá', '${new Date(T.getTime() - 30 * 60_000).toISOString()}')`);
  const r = await ejecutarCitaTareasVencidas({ now: T });
  assert.deepEqual(r.map((x) => `${x.action}:${x.detail}`), ["cancelada:respondio"]);
  assert.equal(red.enviosA(a.phone).length, 0);

  const b = await chat();
  const domingo = art("2026-10-18", 12);
  const citaB = await crearCitaIa({ contactId: b.contactId, conversationId: b.conv, area: "civil", opportunityId: b.opp, now: new Date(domingo.getTime() - 3_600_000) });
  sql(`insert into public.messages (conversation_id, sender_type, direction, body, created_at) values ('${b.conv}', 'prospecto', 'entrante', 'Hola', '${new Date(domingo.getTime() - 3_600_000).toISOString()}')`);
  const rb = await ejecutarCitaTareasVencidas({ now: domingo });
  assert.deepEqual(rb.filter((x) => x.taskId).map((x) => x.action), ["reprogramada"]);
  assert.equal(sql(`select status || '|' || (scheduled_at at time zone 'America/Argentina/Buenos_Aires') from public.cita_tareas where appointment_id = '${citaB.id}' and kind = 'inicio_cita'`), "programada|2026-10-19 08:00:00");
  assert.equal(red.enviosA(b.phone).length, 0);
});
