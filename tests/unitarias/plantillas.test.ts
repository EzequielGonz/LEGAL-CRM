// Pruebas unitarias del catálogo de plantillas (pregunta 22) y del horario
// general (pregunta 39). Datos controlados: nada sale a Meta (fetch simulado).
import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeTemplate,
  buildBodyParameters,
  isSendable,
  previewBody,
  sourcesProblems,
  statusLabel,
} from "@/lib/plantillas/catalogo";
import { listWabaTemplates, findWabaTemplate, MetaApiError, metaErrorText } from "@/lib/plantillas/meta";
import { effectiveSendHours, getSendWindow } from "@/lib/horario";
import { classifyMetaErrorCode } from "@/lib/envios/errores";

const posicional = {
  name: "primer_contacto_prueba",
  language: "es_AR",
  status: "APPROVED",
  category: "MARKETING",
  components: [
    { type: "BODY", text: "Hola {{1}}, soy {{2}} de {{3}}. ¿Seguís con tu caso? {{1}}", example: { body_text: [["Juan", "Ana", "Marca"]] } },
    { type: "FOOTER", text: "Respondé BAJA para no recibir más mensajes" },
    { type: "BUTTONS", buttons: [{ type: "QUICK_REPLY", text: "Sí" }, { type: "QUICK_REPLY", text: "No" }] },
  ],
};

test("plantillas: variables numeradas, ejemplos y compatibilidad", () => {
  const a = analyzeTemplate(posicional);
  assert.equal(a.format, "POSITIONAL");
  assert.deepEqual(a.bodyVariables, ["1", "2", "3"], "sin repetir y en orden");
  assert.deepEqual(a.bodyExamples, ["Juan", "Ana", "Marca"]);
  assert.equal(a.campaignCompatible, true);
  assert.equal(a.footer, "Respondé BAJA para no recibir más mensajes");
  assert.equal(a.buttons.length, 2);
});

test("plantillas: variables con nombre", () => {
  const a = analyzeTemplate({
    name: "x",
    language: "es",
    status: "APPROVED",
    parameter_format: "NAMED",
    components: [
      {
        type: "BODY",
        text: "Hola {{nombre}}, te escribe {{asesor}}",
        example: { body_text_named_params: [{ param_name: "nombre", example: "Juan" }, { param_name: "asesor", example: "Ana" }] },
      },
    ],
  });
  assert.equal(a.format, "NAMED");
  assert.deepEqual(a.bodyVariables, ["nombre", "asesor"]);
  assert.deepEqual(a.bodyExamples, ["Juan", "Ana"]);
  assert.equal(a.campaignCompatible, true);
});

test("plantillas: lo que todavía no se envía desde campañas queda marcado, sin inventar nada", () => {
  const conImagen = analyzeTemplate({
    name: "x",
    language: "es",
    status: "APPROVED",
    components: [{ type: "HEADER", format: "IMAGE" }, { type: "BODY", text: "Hola" }],
  });
  assert.equal(conImagen.campaignCompatible, false);
  assert.match(conImagen.incompatibilities[0], /imagen/);

  const encabezadoVariable = analyzeTemplate({
    name: "x",
    language: "es",
    status: "APPROVED",
    components: [{ type: "HEADER", format: "TEXT", text: "Hola {{1}}" }, { type: "BODY", text: "Texto" }],
  });
  assert.equal(encabezadoVariable.campaignCompatible, false);

  const botonVariable = analyzeTemplate({
    name: "x",
    language: "es",
    status: "APPROVED",
    components: [{ type: "BODY", text: "Hola" }, { type: "BUTTONS", buttons: [{ type: "URL", text: "Ver", url: "https://ej.com/{{1}}" }] }],
  });
  assert.equal(botonVariable.campaignCompatible, false);

  const salteadas = analyzeTemplate({ name: "x", language: "es", status: "APPROVED", components: [{ type: "BODY", text: "{{1}} y {{3}}" }] });
  assert.equal(salteadas.campaignCompatible, false);

  const autenticacion = analyzeTemplate({ name: "x", language: "es", status: "APPROVED", category: "AUTHENTICATION", components: [{ type: "BODY", text: "Código {{1}}" }] });
  assert.equal(autenticacion.campaignCompatible, false);

  const sinCuerpo = analyzeTemplate({ name: "x", language: "es", status: "APPROVED", components: [] });
  assert.equal(sinCuerpo.campaignCompatible, false);
});

test("plantillas: estado real de Meta, solo APPROVED se envía", () => {
  assert.equal(statusLabel("APPROVED"), "Aprobada (APPROVED)");
  assert.equal(statusLabel("PAUSED"), "Pausada por Meta (PAUSED)");
  assert.equal(statusLabel("ALGO_NUEVO"), "ALGO_NUEVO", "un estado desconocido se muestra tal cual");
  assert.equal(isSendable("APPROVED"), true);
  for (const s of ["PENDING", "REJECTED", "PAUSED", "DISABLED", "", null]) assert.equal(isSendable(s as any), false);
});

test("plantillas: cada variable necesita su fuente y nunca se envía vacía", () => {
  const a = analyzeTemplate(posicional);
  assert.equal(sourcesProblems(a, ["contacto.nombre", "perfil.presentacion", "perfil.marca"]).length, 0);
  assert.ok(sourcesProblems(a, ["contacto.nombre"]).length > 0);
  assert.ok(sourcesProblems(a, ["contacto.nombre", "inventado", "perfil.marca"]).length > 0);

  const ok = buildBodyParameters(a, ["contacto.nombre", "perfil.presentacion", "perfil.marca"], {
    "contacto.nombre": "Juan Pérez",
    "perfil.presentacion": "Ana",
    "perfil.marca": "Marca",
  });
  assert.equal(ok.ok, true);
  if (ok.ok) assert.deepEqual(ok.parameters, [{ type: "text", text: "Juan Pérez" }, { type: "text", text: "Ana" }, { type: "text", text: "Marca" }]);

  const falta = buildBodyParameters(a, ["contacto.nombre", "perfil.presentacion", "perfil.marca"], {
    "contacto.nombre": "  ",
    "perfil.presentacion": "Ana",
    "perfil.marca": "Marca",
  });
  assert.equal(falta.ok, false);
  if (!falta.ok) assert.equal(falta.missing[0].variable, "{{1}}");

  const named = buildBodyParameters({ format: "NAMED", bodyVariables: ["nombre"] }, ["contacto.nombre"], {
    "contacto.nombre": "Juan",
    "perfil.presentacion": null,
    "perfil.marca": null,
  });
  assert.equal(named.ok, true);
  if (named.ok) assert.deepEqual(named.parameters, [{ type: "text", parameter_name: "nombre", text: "Juan" }]);

  assert.equal(
    previewBody({ bodyText: "Hola {{1}}, soy {{2}}", bodyVariables: ["1", "2"] }, (_v, i) => ["[A]", "[B]"][i]),
    "Hola [A], soy [B]"
  );
});

test("plantillas: errores de Meta al enviar (ver también errores-envio.test.ts)", () => {
  assert.equal(classifyMetaErrorCode(132015), "plantilla"); // pausada
  assert.equal(classifyMetaErrorCode(132001), "plantilla"); // no existe
  assert.equal(classifyMetaErrorCode(190), "cuenta"); // token
  assert.equal(classifyMetaErrorCode(131031), "cuenta"); // cuenta bloqueada
  assert.equal(classifyMetaErrorCode(131026), "contacto"); // destinatario
  // Corrección 5: sin código ya no se atribuye al contacto.
  assert.equal(classifyMetaErrorCode(null), "desconocido");
});

test("plantillas: lectura de Meta con paginación y solo hacia graph.facebook.com", async () => {
  const calls: { url: string; auth: string | undefined }[] = [];
  const pages: Record<string, unknown> = {
    first: { data: [{ name: "a", language: "es_AR", status: "APPROVED" }], paging: { next: "https://graph.facebook.com/v21.0/123/message_templates?after=X" } },
    second: { data: [{ name: "b", language: "es_AR", status: "PENDING" }, { bad: true }] },
  };
  const fakeFetch = async (url: string, init?: { headers?: Record<string, string> }) => {
    calls.push({ url, auth: init?.headers?.Authorization });
    const body = url.includes("after=X") ? pages.second : pages.first;
    return { ok: true, status: 200, text: async () => JSON.stringify(body) };
  };
  const list = await listWabaTemplates("123", "TOKEN_DE_PRUEBA", fakeFetch as any);
  assert.deepEqual(list.map((t) => t.name), ["a", "b"]);
  assert.equal(calls.length, 2);
  assert.ok(calls.every((c) => c.auth === "Bearer TOKEN_DE_PRUEBA"), "el token va en el encabezado");
  assert.ok(calls.every((c) => !c.url.includes("TOKEN_DE_PRUEBA")), "el token nunca va en la dirección");
  assert.ok(calls[0].url.startsWith("https://graph.facebook.com/v21.0/123/message_templates"));

  const evil = async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ data: [], paging: { next: "https://otro.sitio/robar" } }) });
  await assert.rejects(listWabaTemplates("123", "T", evil as any), /paginación/);

  const denied = async () => ({
    ok: false,
    status: 400,
    text: async () => JSON.stringify({ error: { message: "Invalid OAuth access token", code: 190 } }),
  });
  await assert.rejects(listWabaTemplates("123", "T", denied as any), (e: any) => e instanceof MetaApiError && e.code === 190);
  assert.match(metaErrorText(new MetaApiError("x", 400, 190)), /token/);

  const one = async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ data: [{ name: "a", language: "en_US", status: "APPROVED" }, { name: "a", language: "es_AR", status: "PAUSED" }] }),
  });
  const hit = await findWabaTemplate("123", "T", "a", "es_AR", one as any);
  assert.equal(hit?.status, "PAUSED", "busca por nombre e idioma");
});

test("horario general: lunes a sábado de 8 a 21, sin domingos (pregunta 39)", () => {
  // Hora Argentina = UTC-3.
  const at = (iso: string) => new Date(iso);
  const c = { send_window_start_hour: 7, send_window_end_hour: 21 }; // como "BASE 21 9"
  assert.deepEqual(effectiveSendHours(c), { start: 8, end: 21 });
  assert.equal(getSendWindow(c, at("2026-10-12T10:30:00Z")).withinWindow, false, "lunes 7:30: todavía no abre");
  assert.equal(getSendWindow(c, at("2026-10-12T10:30:00Z")).opensAt.toISOString(), "2026-10-12T11:00:00.000Z", "abre a las 8");
  assert.equal(getSendWindow(c, at("2026-10-12T11:00:00Z")).withinWindow, true, "lunes 8:00");
  assert.equal(getSendWindow(c, at("2026-10-12T23:59:00Z")).withinWindow, true, "lunes 20:59");
  assert.equal(getSendWindow(c, at("2026-10-13T00:00:00Z")).withinWindow, false, "lunes 21:00 ya cerró");
  // Sábado 21:30 → abre el lunes a las 8 (el domingo no).
  const sab = getSendWindow(c, at("2026-10-18T00:30:00Z"));
  assert.equal(sab.withinWindow, false);
  assert.equal(sab.opensAt.toISOString(), "2026-10-19T11:00:00.000Z");
  // Domingo al mediodía → cerrado; abre el lunes a las 8.
  const dom = getSendWindow(c, at("2026-10-18T15:00:00Z"));
  assert.equal(dom.withinWindow, false);
  assert.equal(dom.opensAt.toISOString(), "2026-10-19T11:00:00.000Z");
  // Un feriado que cae en día hábil no se excluye (lunes 12/10/2026).
  assert.equal(getSendWindow(c, at("2026-10-12T15:00:00Z")).withinWindow, true);
  // Una campaña con horario más chico conserva el suyo.
  assert.deepEqual(effectiveSendHours({ send_window_start_hour: 9, send_window_end_hour: 20 }), { start: 9, end: 20 });
});
