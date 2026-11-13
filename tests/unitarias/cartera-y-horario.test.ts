import { test } from "node:test";
import assert from "node:assert/strict";
import { VISTAS_CARTERA, cuandoCorto, grupoElegido, iniciales, inicioDeSemana, vistaCartera } from "@/lib/cartera";
import { indicadorPorClave } from "@/lib/indicadores";
import { bloqueHorarioAtencion, enHorarioAsesores, proximaFranja } from "@/lib/horario-atencion";
import { validarPaginaFacebook, variablesRedes } from "@/lib/redes/facebook-pagina";
import { seccionActiva, seccionesDePerfil } from "@/lib/menu";

test("cartera: cada grupo de oportunidades usa un indicador existente y no incluye la base fría", () => {
  for (const v of Object.values(VISTAS_CARTERA)) {
    for (const g of v.grupos) {
      if (g.fuente.tipo === "oportunidades") assert.ok(indicadorPorClave(g.fuente.indicador), g.fuente.indicador);
    }
  }
  // 12/11: la regla vale para las vistas de trabajo. «Descartados» es el archivo aparte donde sí van los detenidos.
  // 13/11: «Para recuperar» se retiró; quien deja de contestar pasa solo a Caídos, en Descartados.
  const deTrabajo = [VISTAS_CARTERA.conversaciones, VISTAS_CARTERA.contactos];
  const todas = deTrabajo.flatMap((v) => v.grupos.map((g) => (g.fuente.tipo === "oportunidades" ? g.fuente.indicador : "")));
  assert.deepEqual(VISTAS_CARTERA.descartados.grupos.map((g) => g.clave), ["sin_respuesta", "caidos", "perdidos", "no_contactar"]);
  assert.ok(!("recuperar" in VISTAS_CARTERA), "«Para recuperar» ya no existe");
  for (const fria of ["oportunidades", "sin_contactar", "contactado_sin_respuesta", "nuevo", "requiere_humano", "detencion_reciente", "seguimiento_caido", "perdido_comercial"]) assert.ok(!todas.includes(fria), fria);
  assert.deepEqual(VISTAS_CARTERA.conversaciones.grupos.slice(0, 4).map((g) => g.clave), ["captados", "posibles", "escribieron", "piden"], "primero lo que está más cerca de cerrar");
});

test("cartera: grupo pedido, si no el primero con algo, si no el primero", () => {
  assert.equal(grupoElegido("contactos", "citas", {}).clave, "citas");
  assert.equal(grupoElegido("contactos", "otra", { clientes: 0, ventas: 0, citas: 3 }).clave, "citas");
  assert.equal(grupoElegido("descartados", "caidos", {}).clave, "caidos");
  assert.equal(grupoElegido("descartados", undefined, {}).clave, "sin_respuesta");
  assert.equal(vistaCartera("recuperar"), "conversaciones");
  assert.equal(vistaCartera("cualquiera"), "conversaciones");
});

test("cartera: quiere hablar con alguien excluye perdidos y quejas", () => {
  const ind = indicadorPorClave("piden_persona")!;
  // 13/11: ni perdidos ni captados (los captados están en «Para cerrar»: una persona no aparece en dos listas).
  assert.ok(ind.conds.some((c) => c.op === "in" && c.col === "capture_state" && !c.value.includes("perdido") && !c.value.includes("captado")));
  assert.ok(ind.conds.some((c) => c.op === "or" && c.value.includes("attention_category.neq.detencion")));
  // PostgREST admite un solo filtro «o» por consulta: cada indicador lleva como mucho uno.
  for (const c of ["piden_persona", "repesca", "perdido_comercial", "dejaron_de_responder"]) assert.ok(indicadorPorClave(c)!.conds.filter((x) => x.op === "or").length <= 1, c);
  const frenados = indicadorPorClave("dejaron_de_responder")!;
  assert.ok(frenados.conds.some((c) => c.op === "antes_de_horas" && c.value === 72 && c.col === "last_inbound_at"));
  // 13/11 · una sola definición por nombre, sobre quién habló último.
  assert.equal(indicadorPorClave("piden_persona")!.label, "Oportunidades reales");
  assert.ok(indicadorPorClave("piden_persona")!.conds.some((c) => c.op === "eq" && c.col === "attention_state" && c.value === "requiere_humano"));
  assert.ok(indicadorPorClave("te_escribio")!.conds.some((c) => c.op === "eq" && c.col === "ultima_palabra" && c.value === "persona"));
  assert.ok(indicadorPorClave("quedaron_sin_respuesta")!.conds.some((c) => c.op === "antes_de_horas" && c.value === 168));
  assert.ok(indicadorPorClave("posible_captacion")!.conds.some((c) => c.op === "eq" && c.col === "posible_captacion" && c.value === true));
  assert.ok(indicadorPorClave("seguimiento_caido")!.conds.some((c) => c.op === "eq" && c.col === "followup_state" && c.value === "caido"));
  for (const c of ["te_escribio", "quedaron_sin_respuesta", "posible_captacion", "hablando_ahora", "seguimiento_caido"]) assert.ok(indicadorPorClave(c)!.conds.filter((x) => x.op === "or").length <= 1, c);
});

test("semana y fechas en hora de Argentina", () => {
  // Jueves 22/10/2026 15:00 AR = 18:00 UTC → lunes 19/10 0:00 AR = 03:00 UTC.
  assert.equal(inicioDeSemana(new Date("2026-10-22T18:00:00Z")).toISOString(), "2026-10-19T03:00:00.000Z");
  // Lunes 1:00 AR (04:00 UTC) ya es esa semana; el domingo 23:00 AR es la anterior.
  assert.equal(inicioDeSemana(new Date("2026-10-19T04:00:00Z")).toISOString(), "2026-10-19T03:00:00.000Z");
  assert.equal(inicioDeSemana(new Date("2026-10-19T02:00:00Z")).toISOString(), "2026-10-12T03:00:00.000Z");
  const ahora = new Date("2026-10-22T18:00:00Z");
  assert.match(cuandoCorto("2026-10-22T13:30:00Z", ahora), /^hoy 10:30$/);
  assert.match(cuandoCorto("2026-10-21T13:30:00Z", ahora), /^ayer /);
  assert.match(cuandoCorto("2026-10-23T13:30:00Z", ahora), /^mañana /);
  assert.equal(cuandoCorto(null), "");
  assert.equal(iniciales("DURAN RODRIGUEZ ALEJANDRO"), "DA");
  assert.equal(iniciales("  "), "·");
});

test("horario de atención: asesores lunes a sábado de 8 a 21; fuera de horario igual se capta", () => {
  assert.equal(enHorarioAsesores(new Date("2026-10-22T13:00:00Z")), true); // jueves 10:00
  assert.equal(enHorarioAsesores(new Date("2026-10-23T00:00:00Z")), false); // jueves 21:00 (no vale)
  assert.equal(enHorarioAsesores(new Date("2026-10-22T10:59:00Z")), false); // jueves 7:59
  assert.equal(enHorarioAsesores(new Date("2026-10-25T15:00:00Z")), false); // domingo
  assert.equal(proximaFranja(new Date("2026-10-22T09:00:00Z")), "hoy desde las 8"); // 6:00
  assert.equal(proximaFranja(new Date("2026-10-23T01:00:00Z")), "mañana desde las 8"); // jueves 22:00
  assert.equal(proximaFranja(new Date("2026-10-25T01:00:00Z")), "el lunes desde las 8"); // sábado 22:00
  const fuera = bloqueHorarioAtencion(new Date("2026-10-23T01:00:00Z"));
  assert.match(fuera, /FUERA del horario/);
  assert.match(fuera, /buscá captar/);
  // 24/10: sin prometer día ni hora del llamado.
  assert.match(fuera, /No prometas día ni hora/);
  assert.doesNotMatch(fuera, /mañana desde las 8/);
  assert.doesNotMatch(bloqueHorarioAtencion(new Date("2026-10-22T13:00:00Z")), /FUERA/);
});

test("Facebook: variables por perfil y validación de lo editable", () => {
  assert.deepEqual(variablesRedes("juridico"), { pagina: "FACEBOOK_CIVIL_PAGE_ID", token: "FACEBOOK_CIVIL_PAGE_ACCESS_TOKEN", instagram: "INSTAGRAM_CIVIL_BUSINESS_ID" });
  assert.equal(variablesRedes("marketing").token, "FACEBOOK_MARKETING_PAGE_ACCESS_TOKEN");
  assert.deepEqual(validarPaginaFacebook({ about: " Hola ", website: "https://a.com", emails: "a@b.com, c@d.com" }), { about: "Hola", description: "", phone: "", website: "https://a.com", emails: ["a@b.com", "c@d.com"] });
  assert.throws(() => validarPaginaFacebook({ about: "x".repeat(256) }));
  assert.throws(() => validarPaginaFacebook({ website: "a.com" }));
  assert.throws(() => validarPaginaFacebook({ emails: ["no-es-mail"] }));
});

test("menú: Conversaciones y Contactos abren la cartera; las listas completas siguen en su sección", () => {
  const s = seccionesDePerfil("agencia_0km");
  assert.ok(s[1].href.startsWith("/conversaciones?"));
  assert.ok(s[2].href.startsWith("/contactos?"));
  assert.ok(s[2].tabs.some((t) => t.label === "Por base" && t.href.startsWith("/prospectos-por-base?")));
  // 10/11: se busca por clave (Wasender sumó una sección antes de esta).
  assert.ok(s.find((x) => x.clave === "linea")!.tabs.some((t) => t.label === "Perfil de WhatsApp y redes" && !t.oculto));
  assert.equal(seccionActiva(s, "/oportunidades", "perfil=agencia_0km&indicador=captado_sin_derivar")?.seccion.clave, "conversaciones");
  assert.equal(seccionActiva(s, "/oportunidades", "perfil=agencia_0km&indicador=derivado")?.seccion.clave, "contactos");
  assert.equal(seccionActiva(s, "/descartados", "perfil=agencia_0km")?.seccion.clave, "conversaciones");
  assert.ok(!s.some((x) => x.tabs.some((t) => t.label === "Para recuperar")), "«Para recuperar» se retiró del menú");
  assert.equal(seccionActiva(seccionesDePerfil("juridico"), "/incidencias", "perfil=juridico")?.seccion.clave, "conversaciones");
  // 13/11: cada perfil tiene sus incidencias.
  assert.equal(seccionActiva(seccionesDePerfil("agencia_0km"), "/incidencias", "perfil=agencia_0km")?.seccion.clave, "conversaciones");
});

import { previaLegible } from "@/lib/cartera";

test("lista de chats: la vista previa se lee en palabras, sin nombres técnicos de plantillas", () => {
  assert.equal(previaLegible('Vos: [Plantilla de campaña "GRAVES - META": estudio_juridico_vita_asesor] Primer contacto automático a Ana.'), "Vos: Primer mensaje de la campaña «GRAVES - META»");
  assert.equal(previaLegible("[Audio]"), "Audio");
  assert.equal(previaLegible("[Reacción 👍]"), "Reaccionó 👍");
  assert.equal(previaLegible("[Mensaje no compatible: unsupported]"), "Mensaje que no se puede mostrar");
  assert.equal(previaLegible("Hola, ¿cómo estás?"), "Hola, ¿cómo estás?");
  assert.equal(previaLegible(null), "Sin mensajes todavía");
});
