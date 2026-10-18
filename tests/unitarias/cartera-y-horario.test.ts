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
  const todas = Object.values(VISTAS_CARTERA).flatMap((v) => v.grupos.map((g) => (g.fuente.tipo === "oportunidades" ? g.fuente.indicador : "")));
  for (const fria of ["oportunidades", "sin_contactar", "contactado_sin_respuesta", "nuevo", "requiere_humano", "detencion_reciente"]) assert.ok(!todas.includes(fria), fria);
  assert.equal(VISTAS_CARTERA.conversaciones.grupos[0].clave, "captados");
});

test("cartera: grupo pedido, si no el primero con algo, si no el primero", () => {
  assert.equal(grupoElegido("contactos", "citas", {}).clave, "citas");
  assert.equal(grupoElegido("contactos", "otra", { clientes: 0, ventas: 0, citas: 3 }).clave, "citas");
  assert.equal(grupoElegido("recuperar", undefined, {}).clave, "caidos");
  assert.equal(vistaCartera("cualquiera"), "conversaciones");
});

test("cartera: quiere hablar con alguien excluye perdidos y quejas", () => {
  const ind = indicadorPorClave("piden_persona")!;
  assert.ok(ind.conds.some((c) => c.op === "neq" && c.col === "capture_state" && c.value === "perdido"));
  assert.ok(ind.conds.some((c) => c.op === "or" && c.value.includes("attention_category.neq.detencion")));
  // PostgREST admite un solo filtro «o» por consulta: cada indicador lleva como mucho uno.
  for (const c of ["piden_persona", "repesca", "perdido_comercial", "dejaron_de_responder"]) assert.ok(indicadorPorClave(c)!.conds.filter((x) => x.op === "or").length <= 1, c);
  const frenados = indicadorPorClave("dejaron_de_responder")!;
  assert.ok(frenados.conds.some((c) => c.op === "antes_de_horas" && c.value === 72));
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
  assert.match(fuera, /asesor lo llame mañana desde las 8/);
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
  assert.ok(s[2].tabs.some((t) => t.label === "Prospectos" && t.href.startsWith("/prospectos-por-base?")));
  assert.ok(s[4].tabs.some((t) => t.label === "Perfiles" && !t.oculto));
  assert.equal(seccionActiva(s, "/oportunidades", "perfil=agencia_0km&indicador=captado_sin_derivar")?.seccion.clave, "conversaciones");
  assert.equal(seccionActiva(s, "/oportunidades", "perfil=agencia_0km&indicador=derivado")?.seccion.clave, "contactos");
  assert.equal(seccionActiva(s, "/recuperar", "perfil=agencia_0km")?.seccion.clave, "conversaciones");
  assert.equal(seccionActiva(seccionesDePerfil("juridico"), "/revision", null)?.seccion.clave, "conversaciones");
});
