// Etapa 2 · Bloque 2.3 — Seguimiento general de los cuatro perfiles, probado
// con el perfil de Marketing (que pasó a este circuito). También mantiene las
// correcciones 3, 4 y 5 de la revisión del 10/10 para los seguimientos
// automáticos: revalidación inmediatamente antes de enviar (pausa general,
// persona que tomó el chat), identificador de Meta en el mensaje y resultado
// incierto sin reenvío automático.
// Base de pruebas con datos inventados y Meta simulado.
import test, { after, before } from "node:test";
import assert from "node:assert/strict";

import { randomUUID } from "node:crypto";

import { CON_PAUSA, RedSimulada, SIN_PAUSA, canalId, crearContacto, db, esperarApi, fijarPausa, sql, pedido, prepararSesionDePrueba } from "./soporte/entorno";
import { analyzeTemplate } from "@/lib/plantillas/catalogo";
import { planFollowups, runDueFollowups } from "@/lib/seguimiento/motor";
import { followupOverview } from "@/lib/seguimiento/panel";
import { PATCH as revisarTarea } from "@/app/api/seguimiento/tareas/[id]/route";
import { POST as generarRepesca } from "@/app/api/seguimiento/repesca/route";
import { POST as configurar } from "@/app/api/seguimiento/config/route";


const MARKETING = "44444444-4444-4444-4444-444444444444";
const CLAVE = "PRUEBA_SEGUIMIENTO";
const CLAVE_B = "PRUEBA_SEGUIMIENTO_B";
const WABA = "200000000000077";
process.env[`${CLAVE}_PHONE_NUMBER_ID`] = "100000000000077";
process.env[`${CLAVE}_ACCESS_TOKEN`] = "token-seguimiento-de-prueba";
process.env[`${CLAVE}_WABA_ID`] = WABA;
process.env[`${CLAVE_B}_PHONE_NUMBER_ID`] = "100000000000078";
process.env[`${CLAVE_B}_ACCESS_TOKEN`] = "token-seguimiento-b-de-prueba";
process.env[`${CLAVE_B}_WABA_ID`] = WABA;
/** Perfil y línea de Autos 0 km (prueba): para comprobar que nunca se usa una línea de otro perfil. */
const AUTOS = "22222222-2222-2222-2222-222222222222";
const CLAVE_AUTOS = "PRUEBA_SEGUIMIENTO_AUTOS";
process.env[`${CLAVE_AUTOS}_PHONE_NUMBER_ID`] = "100000000000079";
process.env[`${CLAVE_AUTOS}_ACCESS_TOKEN`] = "token-autos-de-prueba";
process.env[`${CLAVE_AUTOS}_WABA_ID`] = WABA;
/** PIN inventado, solo para la base de pruebas. */
const PIN_PRUEBA = "739146";
process.env.ACCESS_PIN = PIN_PRUEBA;

/** Instante a partir de una hora de pared argentina (UTC-3). */
const art = (day: string, hh: number, mm = 0) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh + 3, mm));
};
const H = 3600 * 1000;
/** Igual que `art`, con segundos. */
const artS = (day: string, hh: number, mm: number, ss: number) => new Date(art(day, hh, mm).getTime() + ss * 1000);

let red: RedSimulada;
let lineA = "";
let lineB = "";
let tpl3 = "";

async function ok<T>(p: PromiseLike<{ data: T; error: any }>, what: string): Promise<T> {
  const r = await p;
  if (r.error) throw new Error(`${what}: ${r.error.message}`);
  return r.data;
}

async function plantilla(name: string, body: string): Promise<string> {
  const meta = { id: `meta-${name}`, name, language: "es_AR", status: "APPROVED", category: "MARKETING", components: [{ type: "BODY", text: body, example: { body_text: [["Ana"]] } }] };
  const a = analyzeTemplate(meta as any);
  const row: any = await ok(
    db()
      .from("whatsapp_templates")
      .insert({
        waba_id: WABA,
        meta_template_id: meta.id,
        name,
        language: "es_AR",
        category: "MARKETING",
        status: "APPROVED",
        parameter_format: a.format,
        components: meta.components,
        body_text: a.bodyText,
        variables: a,
        campaign_compatible: a.campaignCompatible,
        incompatibilities: a.incompatibilities,
      })
      .select("id")
      .single(),
    "plantilla"
  );
  return row.id;
}

async function linea(clave: string, label: string): Promise<string> {
  const row: any = await ok(
    db()
      .from("profile_lines")
      .insert({ rubro_id: MARKETING, area: "marketing", label, credential_key: clave, answers_with_agent: true, use_for_campaigns: false })
      .select("id")
      .single(),
    "línea"
  );
  return row.id;
}

async function asignar(lineId: string, purpose: string, templateId: string) {
  await ok(
    db().from("template_assignments").insert({ rubro_id: MARKETING, line_id: lineId, purpose, template_id: templateId, variable_sources: ["contacto.nombre"] }),
    "asignación"
  );
}

before(async () => {
  red = new RedSimulada();
  await esperarApi();
  await prepararSesionDePrueba();
  await fijarPausa(SIN_PAUSA);
  lineA = await linea(CLAVE, "Línea de seguimiento (prueba)");
  lineB = await linea(CLAVE_B, "Línea sin plantilla (prueba)");
  const tpl2 = await plantilla("prueba_seguimiento_2", "Hola {{1}}, ¿pudiste pensarlo? Si te quedó alguna duda, escribinos por acá.");
  tpl3 = await plantilla("prueba_seguimiento_3", "Hola {{1}}, te escribimos por última vez por si querés retomarlo.");
  await asignar(lineA, "seguimiento", tpl2);
  await asignar(lineA, "seguimiento_3", tpl3);
  await ok(
    db().from("rubros").update({ followup_enabled_since: "2026-10-01T03:00:00Z", followup_target_hours: 60 }).eq("id", MARKETING),
    "activar seguimiento"
  );
});
after(async () => {
  await fijarPausa(SIN_PAUSA);
  red.restaurar();
});

interface Caso {
  contactId: string;
  phone: string;
  conv: string;
  opp: string;
}

async function mensaje(conv: string, direction: "entrante" | "saliente", at: Date, body: string) {
  await ok(
    db().from("messages").insert({
      conversation_id: conv,
      direction,
      sender_type: direction === "entrante" ? "prospecto" : "agente_ia",
      body,
      created_at: at.toISOString(),
    }),
    "mensaje"
  );
}

/** Conversación de Marketing: contacto 1, respuesta de la persona y nuestro último mensaje sin respuesta en `base`. */
async function interrumpida(base: Date, opts: { respondio?: boolean; lineId?: string; nombre?: string } = {}): Promise<Caso> {
  const c = await crearContacto({ area: "marketing", rubroId: MARKETING, nombre: opts.nombre ?? "Negocio De Prueba" });
  const conv: any = await ok(
    db()
      .from("conversations")
      .insert({ contact_id: c.id, channel_id: await canalId("marketing"), area: "marketing", ai_enabled: true, line_id: opts.lineId ?? lineA })
      .select("id")
      .single(),
    "conversación"
  );
  await mensaje(conv.id, "saliente", new Date(base.getTime() - 3 * H), "Contacto 1 (inicial)");
  if (opts.respondio !== false) await mensaje(conv.id, "entrante", new Date(base.getTime() - 2 * H), "Hola, ¿de qué se trata?");
  await mensaje(conv.id, "saliente", base, "Te cuento: … ¿te interesa que lo veamos?");
  const opp: any = await ok(db().from("opportunities").select("id").eq("contact_id", c.id).single(), "oportunidad");
  return { contactId: c.id, phone: c.phone, conv: conv.id, opp: opp.id };
}

async function tareas(opp: string) {
  return (await ok(db().from("followup_tasks").select("*").eq("opportunity_id", opp).order("created_at"), "tareas")) as any[];
}
async function oportunidad(opp: string) {
  return (await ok(
    db().from("opportunities").select("followup_state, followup_reason, capture_state, followup_exhausted_at, repesca_base_id").eq("id", opp).single(),
    "oportunidad"
  )) as any;
}
const json = (body: unknown, method = "POST") => pedido("http://local/api", { method, body: JSON.stringify(body) });

const caso1: { c?: Caso } = {};

test("2.3 (C08): conversación interrumpida el jueves 20:15 → contacto 2 programado el sábado 20:15; sin duplicados", async () => {
  const c = await interrumpida(art("2026-10-15", 20, 15), { nombre: "Ana" });
  caso1.c = c;
  // Quien nunca respondió no entra.
  const nunca = await interrumpida(art("2026-10-15", 20, 15), { respondio: false });

  await planFollowups({ now: art("2026-10-15", 21, 0) });
  await planFollowups({ now: art("2026-10-15", 21, 5) });
  const t = await tareas(c.opp);
  assert.equal(t.length, 1, "una sola tarea aunque se planifique dos veces");
  assert.equal(t[0].step, 2);
  assert.equal(t[0].status, "programada");
  assert.equal(new Date(t[0].scheduled_at).toISOString(), art("2026-10-17", 20, 15).toISOString());
  assert.equal(t[0].offset_hours, 48);
  assert.equal((await oportunidad(c.opp)).followup_state, "activo");
  assert.equal((await tareas(nunca.opp)).length, 0, "quien nunca respondió no recibe seguimiento");
});

test("2.3 (corrección 4): el contacto 2 sale una sola vez, con la plantilla de seguimiento, el identificador de Meta y su estado", async () => {
  const c = caso1.c!;
  // Antes de su hora no sale.
  await runDueFollowups({ now: art("2026-10-17", 20, 0) });
  assert.equal(red.enviosA(c.phone).length, 0);
  // Dos ejecuciones simultáneas: una sola lo envía.
  red.demoraEnvioMs = 100;
  try {
    await Promise.all([runDueFollowups({ now: art("2026-10-17", 20, 20) }), runDueFollowups({ now: art("2026-10-17", 20, 20) })]);
  } finally {
    red.demoraEnvioMs = 0;
  }
  await runDueFollowups({ now: art("2026-10-17", 20, 30) });
  const envios = red.enviosA(c.phone);
  assert.equal(envios.length, 1);
  assert.equal(envios[0].body.template.name, "prueba_seguimiento_2");
  assert.equal(envios[0].body.template.components[0].parameters[0].text, "Ana");
  assert.equal(envios[0].phoneNumberId, "100000000000077", "sale por la línea de la conversación");

  const [t] = await tareas(c.opp);
  assert.equal(t.status, "enviada");
  const msg: any = await ok(db().from("messages").select("body, external_message_id, delivery_status, metadata").eq("id", t.message_id).single(), "mensaje");
  assert.match(msg.external_message_id, /^wamid\.PRUEBA\./);
  assert.equal(msg.delivery_status, "enviado");
  assert.equal(msg.metadata.followup_step, 2);
  assert.match(msg.body, /Hola Ana, ¿pudiste pensarlo\?/);
  assert.equal((await oportunidad(c.opp)).capture_state, "en_seguimiento");
});

test("2.3: sin respuesta al contacto 2 se detiene a las 72 h y no hay contacto 3 ni repesca", async () => {
  const c = caso1.c!;
  await planFollowups({ now: art("2026-10-19", 12, 0) });
  assert.equal((await oportunidad(c.opp)).followup_state, "activo", "dentro de las 72 h se espera");
  await planFollowups({ now: art("2026-10-20", 20, 31) });
  const o = await oportunidad(c.opp);
  assert.equal(o.followup_state, "caido");
  assert.match(o.followup_reason, /Sin respuesta al segundo contacto/);
  assert.equal(o.followup_exhausted_at, null, "no entra a la repesca");
  assert.equal((await tareas(c.opp)).length, 1);
  assert.equal(red.enviosA(c.phone).length, 1);
});

test("2.3: responde al 2 y se interrumpe → contacto 3 con su plantilla; después, base para campaña manual sin enviar nada", async () => {
  const c = await interrumpida(art("2026-10-19", 10, 0), { nombre: "Bruno" });
  await planFollowups({ now: art("2026-10-19", 10, 30) });
  const [t2] = await tareas(c.opp);
  assert.equal(new Date(t2.scheduled_at).toISOString(), art("2026-10-21", 20, 0).toISOString(), "lunes 10 + 58 h = miércoles 20");
  await runDueFollowups({ now: art("2026-10-21", 20, 5) });
  assert.equal(red.enviosA(c.phone).length, 1);

  // Responde al 2, la IA contesta y la persona se vuelve a callar.
  await mensaje(c.conv, "entrante", art("2026-10-21", 21, 0), "Sí, contame");
  await mensaje(c.conv, "saliente", art("2026-10-21", 21, 5), "Genial, te paso la propuesta…");
  await planFollowups({ now: art("2026-10-21", 21, 10) });
  const t3 = (await tareas(c.opp)).find((t) => t.step === 3);
  assert.ok(t3, "se programó el contacto 3");
  assert.equal(new Date(t3.scheduled_at).toISOString(), art("2026-10-24", 9, 5).toISOString(), "miércoles 21:05 + 60 h = sábado 9:05");
  await runDueFollowups({ now: art("2026-10-24", 9, 10) });
  const envios = red.enviosA(c.phone);
  assert.equal(envios.length, 2);
  assert.equal(envios[1].body.template.name, "prueba_seguimiento_3");

  // Sin respuesta al 3: agotado (no es baja) y pasa a la base para campaña manual.
  await planFollowups({ now: art("2026-10-27", 9, 11) });
  const o = await oportunidad(c.opp);
  assert.equal(o.followup_state, "completado");
  assert.ok(o.followup_exhausted_at);
  const { data: detencion } = await db().from("contact_detentions").select("id").eq("contact_id", c.contactId);
  assert.equal((detencion ?? []).length, 0, "agotar el circuito no detiene al contacto");

  const enviosAntes = red.envios.length;
  const r = await generarRepesca(json({ rubro_id: MARKETING }));
  assert.equal(r.status, 200);
  const body = await r.json();
  const total = body.bases.reduce((n: number, b: any) => n + b.filas, 0);
  assert.ok(total >= 1);
  assert.equal(red.envios.length, enviosAntes, "generar la base no envía nada");
  const o2 = await oportunidad(c.opp);
  assert.ok(o2.repesca_base_id);
  const filas = ((await ok(db().from("imported_base_rows").select("contact_id, status").eq("base_id", o2.repesca_base_id), "filas")) ?? []) as any[];
  assert.ok(filas.some((f) => f.contact_id === c.contactId));
  // Volver a generar no repite a quien ya está en una base.
  const again = await generarRepesca(json({ rubro_id: MARKETING }));
  assert.equal(again.status, 409);
});

test("2.3: si la persona respondió antes de la hora, el seguimiento no sale (compuerta)", async () => {
  const c = await interrumpida(art("2026-10-22", 10, 0));
  await planFollowups({ now: art("2026-10-22", 10, 5) });
  const [t] = await tareas(c.opp);
  assert.equal(new Date(t.scheduled_at).toISOString(), art("2026-10-24", 20, 0).toISOString());
  await mensaje(c.conv, "entrante", art("2026-10-23", 12, 0), "Perdón, recién lo veo");
  await runDueFollowups({ now: art("2026-10-24", 20, 5) });
  const [t2] = await tareas(c.opp);
  assert.equal(t2.status, "cancelada");
  assert.match(t2.status_reason, /respondió/);
  assert.equal(red.enviosA(c.phone).length, 0);
});

test("2.3 (corrección 3): con la pausa general activa no se programa ni se envía nada", async () => {
  const c = await interrumpida(art("2026-10-26", 9, 0));
  await fijarPausa(CON_PAUSA);
  try {
    const plan = await planFollowups({ now: art("2026-10-26", 9, 5) });
    assert.match(plan.skipped ?? "", /Pausa general/);
    const exec = await runDueFollowups({ now: art("2026-10-28", 20, 0) });
    assert.match(exec.skipped ?? "", /Pausa general/);
  } finally {
    await fijarPausa(SIN_PAUSA);
  }
  assert.equal((await tareas(c.opp)).length, 0);
  assert.equal(red.enviosA(c.phone).length, 0);
});

test("2.3 (corrección 3): si una persona tomó el chat justo antes, no sale y el circuito se detiene", async () => {
  const c = await interrumpida(art("2026-10-26", 10, 0));
  await planFollowups({ now: art("2026-10-26", 10, 5) });
  await ok(db().from("conversations").update({ ai_enabled: false }).eq("id", c.conv), "tomar chat");
  await runDueFollowups({ now: art("2026-10-28", 20, 5) });
  const [t] = await tareas(c.opp);
  assert.equal(t.status, "cancelada");
  assert.equal((await oportunidad(c.opp)).followup_state, "caido");
  assert.equal(red.enviosA(c.phone).length, 0);
});

test("2.3 (corrección 5): sin respuesta de Meta queda a revisar, no se reenvía solo y reintentar exige confirmación", async () => {
  const c = await interrumpida(art("2026-10-27", 11, 0));
  await planFollowups({ now: art("2026-10-27", 11, 5) });
  red.responder(c.phone, { red: "sin_respuesta" });
  await runDueFollowups({ now: art("2026-10-29", 20, 5) });
  const [t] = await tareas(c.opp);
  assert.equal(t.status, "a_revisar");
  assert.match(t.status_reason, /No se pudo confirmar/);
  await runDueFollowups({ now: art("2026-10-29", 20, 30) });
  assert.equal(red.enviosA(c.phone).length, 1, "no se reenvía");

  const sinConfirmar = await revisarTarea(json({ action: "reintentar" }, "PATCH"), { params: { id: t.id } });
  assert.equal(sinConfirmar.status, 409);
  const marcado = await revisarTarea(json({ action: "marcar_enviado", note: "La persona confirmó que le llegó" }, "PATCH"), { params: { id: t.id } });
  assert.equal(marcado.status, 200);
  assert.equal((await tareas(c.opp))[0].status, "enviada");
});

test("2.3: sin plantilla de seguimiento en la línea queda pendiente y sale cuando se asigna (dentro del plazo)", async () => {
  const c = await interrumpida(art("2026-10-28", 9, 0), { lineId: lineB });
  await planFollowups({ now: art("2026-10-28", 9, 5) });
  await runDueFollowups({ now: art("2026-10-30", 20, 5) });
  let [t] = await tareas(c.opp);
  assert.equal(t.status, "pendiente");
  assert.match(t.status_reason, /plantilla aprobada asignada a la línea/);
  assert.equal(red.enviosA(c.phone).length, 0);

  await asignar(lineB, "seguimiento", (await ok(db().from("whatsapp_templates").select("id").eq("name", "prueba_seguimiento_2").single(), "plantilla") as any).id);
  await runDueFollowups({ now: art("2026-10-30", 20, 10) });
  [t] = await tareas(c.opp);
  assert.equal(t.status, "enviada");
  assert.equal(red.enviosA(c.phone)[0].phoneNumberId, "100000000000078");
});

test("2.0 + 2.3: sin franja válida queda como conflicto visible; descartarlo no la vuelve a generar", async () => {
  await ok(db().from("contact_calendar_exceptions").insert({ day: "2026-10-31", closed: true, note: "prueba seguimiento" }), "excepción");
  const c = await interrumpida(art("2026-10-29", 20, 15));
  await planFollowups({ now: art("2026-10-29", 20, 20) });
  const [t] = await tareas(c.opp);
  assert.equal(t.status, "conflicto");
  assert.equal(t.scheduled_at, null);
  const vista = await followupOverview(MARKETING);
  assert.ok(vista.atencion.some((x) => x.id === t.id), "visible en «Necesitan revisión»");

  const r = await revisarTarea(json({ action: "descartar" }, "PATCH"), { params: { id: t.id } });
  assert.equal(r.status, 200);
  await planFollowups({ now: art("2026-10-29", 20, 30) });
  const despues = await tareas(c.opp);
  assert.equal(despues.length, 1, "la misma interrupción no genera otra tarea");
  assert.equal(despues[0].status, "cancelada");
  assert.equal(red.enviosA(c.phone).length, 0);
});

test("2.3: activar o apagar el seguimiento pide el PIN; apagarlo cancela lo programado", async () => {
  const c = await interrumpida(art("2026-11-02", 10, 0));
  await planFollowups({ now: art("2026-11-02", 10, 5) });
  assert.equal((await tareas(c.opp))[0].status, "programada");

  const mal = await configurar(json({ rubro_id: MARKETING, enabled: false, pin: "000001" }));
  assert.equal(mal.status, 401);
  const sinPin = await configurar(json({ rubro_id: MARKETING, enabled: false }));
  assert.equal(sinPin.status, 401);
  const objetivo = await configurar(json({ rubro_id: MARKETING, target_hours: 80 }));
  assert.equal(objetivo.status, 400, "el objetivo tiene que estar entre 48 y 72");

  const apagar = await configurar(json({ rubro_id: MARKETING, enabled: false, pin: PIN_PRUEBA }));
  assert.equal(apagar.status, 200);
  const [t] = await tareas(c.opp);
  assert.equal(t.status, "cancelada");
  const { data: r } = await db().from("rubros").select("followup_enabled_since").eq("id", MARKETING).single();
  assert.equal(r!.followup_enabled_since, null);
  await runDueFollowups({ now: art("2026-11-04", 20, 5) });
  assert.equal(red.enviosA(c.phone).length, 0);

  // Volver a activarlo: solo entran las interrupciones posteriores (la de esta prueba es anterior).
  const activar = await configurar(json({ rubro_id: MARKETING, enabled: true, pin: PIN_PRUEBA }));
  assert.equal(activar.status, 200);
  const { count } = await db().from("access_events").select("id", { count: "exact", head: true }).eq("kind", "seguimiento_automatico");
  assert.ok((count ?? 0) >= 2, "queda en el registro de accesos");
});

// ---------------------------------------------------------------------------
// Correcciones de la revisión del 13/10 sobre la entrega 1 (regresiones).
// ---------------------------------------------------------------------------

test("corrección 1: una conversación con la línea de otro perfil no envía, y una línea propia desactivada no se cambia por otra", async () => {
  // Línea de Autos 0 km con plantilla de seguimiento asignada: estaría lista para enviar, pero no es del perfil de la tarea.
  const lineaAutos: any = await ok(
    db()
      .from("profile_lines")
      .insert({ rubro_id: AUTOS, area: "agencia_0km", label: "Línea de Autos (prueba)", credential_key: CLAVE_AUTOS, answers_with_agent: true, use_for_campaigns: false })
      .select("id")
      .single(),
    "línea de Autos"
  );
  const tpl2: any = await ok(db().from("whatsapp_templates").select("id").eq("name", "prueba_seguimiento_2").single(), "plantilla");
  await ok(
    db().from("template_assignments").insert({ rubro_id: AUTOS, line_id: lineaAutos.id, purpose: "seguimiento", template_id: tpl2.id, variable_sources: ["contacto.nombre"] }),
    "asignación de Autos"
  );

  const ajena = await interrumpida(art("2026-11-03", 10, 0), { lineId: lineaAutos.id, nombre: "Carla" });
  const propia = await interrumpida(art("2026-11-03", 10, 0), { lineId: lineB, nombre: "Diego" });
  await planFollowups({ now: art("2026-11-03", 10, 5) });
  const [tAjena] = await tareas(ajena.opp);
  const [tPropia] = await tareas(propia.opp);
  assert.equal(new Date(tAjena.scheduled_at).toISOString(), art("2026-11-05", 20, 0).toISOString());

  await ok(db().from("profile_lines").update({ active: false }).eq("id", lineB), "desactivar la línea propia");
  try {
    await runDueFollowups({ now: art("2026-11-05", 20, 0) });
    await runDueFollowups({ now: art("2026-11-05", 20, 10) });
  } finally {
    await ok(db().from("profile_lines").update({ active: true }).eq("id", lineB), "reactivar la línea propia");
  }

  const [a] = await tareas(ajena.opp);
  assert.equal(a.status, "pendiente");
  assert.match(a.status_reason, /línea de otro perfil/);
  assert.equal(a.line_id, null, "no quedó registrada la línea ajena");
  assert.equal(a.template_id, null, "no se eligió plantilla");
  assert.equal(a.attempts, 0, "ni siquiera se reservó");
  assert.equal(red.enviosA(ajena.phone).length, 0);
  const eventos = (await ok(db().from("opportunity_events").select("id").eq("opportunity_id", ajena.opp).eq("to_value", "pendiente"), "eventos")) as any[];
  assert.equal(eventos.length, 1, "el motivo queda registrado una sola vez aunque se revise dos veces");

  const [p] = await tareas(propia.opp);
  assert.equal(p.status, "pendiente");
  assert.match(p.status_reason, /desactivada/);
  assert.equal(red.enviosA(propia.phone).length, 0, "no sale por otra línea del perfil");
  assert.equal(tPropia.id, p.id);

  // Defensa en la base: aunque la tarea tuviera registrada una línea ajena, la compuerta no deja enviar.
  const token = randomUUID();
  assert.equal(await ok(db().rpc("followup_claim", { p_task: a.id, p_token: token }), "reserva"), true);
  await ok(db().from("followup_tasks").update({ line_id: lineaAutos.id }).eq("id", a.id), "línea ajena en la tarea");
  assert.equal(await ok(db().rpc("followup_gate", { p_task: a.id, p_token: token }), "compuerta"), "linea_incompatible");
  assert.equal(await ok(db().rpc("followup_release", { p_task: a.id, p_token: token, p_status: "pendiente", p_reason: "prueba" }), "devolver"), true);
  const [a2] = await tareas(ajena.opp);
  assert.equal(a2.status, "pendiente");
  assert.equal(a2.attempts, 0, "devolver la reserva no cuenta un intento");
  assert.equal(red.enviosA(ajena.phone).length, 0);
});

test("corrección 2: una ejecución que empieza a las 20:59:59 y llega al envío a las 21:00:02 no envía; se reprograma dentro del plazo", async () => {
  const base = artS("2026-11-09", 8, 59, 59); // lunes
  const c = await interrumpida(base, { nombre: "Elena" });
  await planFollowups({ now: new Date(base.getTime() + 5 * 60 * 1000) });
  const [t] = await tareas(c.opp);
  const programada = new Date(t.scheduled_at);
  assert.equal(programada.toISOString(), artS("2026-11-11", 20, 59, 59).toISOString(), "lunes 8:59:59 + 60 h = miércoles 20:59:59");

  const tarde = artS("2026-11-11", 21, 0, 2);
  await runDueFollowups({ now: programada, clock: () => tarde });
  assert.equal(red.enviosA(c.phone).length, 0, "no sale después de las 21");
  const [t2] = await tareas(c.opp);
  assert.equal(t2.status, "programada");
  assert.equal(new Date(t2.scheduled_at).toISOString(), artS("2026-11-12", 8, 59, 59).toISOString(), "la única franja que queda antes de las 72 h");
  assert.equal(t2.attempts, 0, "no se gastó un intento");

  await runDueFollowups({ now: artS("2026-11-12", 8, 59, 59) });
  assert.equal(red.enviosA(c.phone).length, 1, "sale en la franja nueva, dentro del plazo");
});

test("corrección 2: si la hora cruza las 21 entre la compuerta y la llamada a Meta, tampoco sale", async () => {
  const base = artS("2026-11-16", 8, 59, 59); // lunes
  const c = await interrumpida(base, { nombre: "Fabián" });
  await planFollowups({ now: new Date(base.getTime() + 5 * 60 * 1000) });
  const [t] = await tareas(c.opp);
  const programada = new Date(t.scheduled_at);
  assert.equal(programada.toISOString(), artS("2026-11-18", 20, 59, 59).toISOString());

  // El motor lee la hora real dos veces: antes de reservar y justo antes de llamar a Meta.
  const tarde = artS("2026-11-18", 21, 0, 2);
  let lecturas = 0;
  await runDueFollowups({ now: programada, clock: () => (++lecturas === 1 ? new Date(programada.getTime() + 500) : tarde) });
  assert.equal(lecturas, 2);
  assert.equal(red.enviosA(c.phone).length, 0);
  const [t2] = await tareas(c.opp);
  assert.equal(t2.status, "programada");
  assert.equal(new Date(t2.scheduled_at).toISOString(), artS("2026-11-19", 8, 59, 59).toISOString());
  assert.equal(t2.attempts, 0, "la reserva se devolvió sin contar el intento");
  assert.equal(t2.send_started_at, null, "no queda como envío iniciado");
  assert.equal(t2.claim_token, null);
});

test("corrección 3: 200 interrupciones antiguas y 30 descartadas no tapan a una nueva, y ninguna se reactiva", async () => {
  const canal = await canalId("marketing");
  // 200 interrupciones anteriores a la activación del seguimiento y 30 recientes cuya tarea se descartó.
  sql(`do $$
  declare i int; v_contact uuid; v_conv uuid; v_opp uuid; v_base timestamptz;
  begin
    for i in 1..230 loop
      v_base := case when i <= 200 then timestamptz '2026-10-01 12:00:00-03' + make_interval(mins => i)
                     else timestamptz '2026-11-21 09:00:00-03' + make_interval(mins => i) end;
      insert into public.contacts (area, full_name, phone, source, rubro_id)
        values ('marketing', 'Prueba antigua ' || i, '54911770' || lpad(i::text, 5, '0'), 'base_de_datos', '${MARKETING}')
        returning id into v_contact;
      insert into public.conversations (contact_id, channel_id, area, ai_enabled, line_id)
        values (v_contact, '${canal}', 'marketing', true, '${lineA}') returning id into v_conv;
      insert into public.messages (conversation_id, direction, sender_type, body, created_at)
        values (v_conv, 'saliente', 'agente_ia', 'Contacto 1', v_base - interval '3 hours');
      insert into public.messages (conversation_id, direction, sender_type, body, created_at)
        values (v_conv, 'entrante', 'prospecto', 'Hola', v_base - interval '2 hours');
      insert into public.messages (conversation_id, direction, sender_type, body, created_at)
        values (v_conv, 'saliente', 'agente_ia', 'Te cuento', v_base);
      if i > 200 then
        select id into v_opp from public.opportunities where contact_id = v_contact;
        insert into public.followup_tasks (rubro_id, opportunity_id, contact_id, conversation_id, step, base_at, target_hours,
                                           status, status_reason, resolved_at, resolved_by)
          values ('${MARKETING}', v_opp, v_contact, v_conv, 2, v_base, 60, 'cancelada', 'Descartada desde el panel (prueba)', now(), 'panel');
      end if;
    end loop;
  end $$;`);
  const listas = sql(`select count(*) from public.opportunities o join public.contacts c on c.id = o.contact_id
                       where c.full_name like 'Prueba antigua %' and o.contact_state = 'respondio' and o.conversation_id is not null
                         and o.followup_state = 'ninguno'`);
  assert.equal(listas, "230", "las 230 quedaron como conversaciones interrumpidas de quien respondió");

  const nueva = await interrumpida(art("2026-11-23", 10, 0), { nombre: "Gabriela" });
  const plan = await planFollowups({ now: art("2026-11-23", 10, 5) });
  const [t] = await tareas(nueva.opp);
  assert.ok(t, "la nueva quedó programada");
  assert.equal(t.status, "programada");
  assert.ok(plan.revisadas < 30, `solo se revisan las que el circuito puede decidir (${plan.revisadas})`);

  const reactivadas = sql(`select count(*) from public.followup_tasks t join public.contacts c on c.id = t.contact_id
                            where c.full_name like 'Prueba antigua %' and t.status <> 'cancelada'`);
  assert.equal(reactivadas, "0", "ninguna antigua ni descartada vuelve a programarse");
  const cambiadas = sql(`select count(*) from public.opportunities o join public.contacts c on c.id = o.contact_id
                          where c.full_name like 'Prueba antigua %' and o.followup_state <> 'ninguno'`);
  assert.equal(cambiadas, "0", "su estado no cambia");
});

test("corrección 3: el planificador recorre todas las páginas, con el tope de páginas por vuelta", async () => {
  const a = await interrumpida(art("2026-11-24", 10, 0), { nombre: "Hilda" });
  const b = await interrumpida(art("2026-11-24", 10, 10), { nombre: "Ivo" });
  const c = await interrumpida(art("2026-11-24", 10, 20), { nombre: "Juana" });
  const plan = await planFollowups({ now: art("2026-11-24", 10, 30), limit: 1 });
  for (const caso of [a, b, c]) assert.equal((await tareas(caso.opp)).length, 1, "páginas de una candidata: se programan las tres");
  assert.ok(plan.revisadas >= 3);

  const d = await interrumpida(art("2026-11-25", 10, 0), { nombre: "Kevin" });
  const e = await interrumpida(art("2026-11-25", 10, 10), { nombre: "Lucía" });
  await planFollowups({ now: art("2026-11-25", 10, 30), limit: 1, maxPages: 1 });
  assert.equal((await tareas(d.opp)).length, 1);
  assert.equal((await tareas(e.opp)).length, 0, "con una sola página por vuelta, la siguiente queda para la próxima");
  await planFollowups({ now: art("2026-11-25", 10, 31), limit: 1, maxPages: 1 });
  assert.equal((await tareas(e.opp)).length, 1);
});
