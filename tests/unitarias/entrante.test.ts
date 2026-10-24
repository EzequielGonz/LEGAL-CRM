import { test } from "node:test";
import assert from "node:assert/strict";
import { guionSegunModo, modoDelContacto } from "@/lib/agentes/entrante";
import { buildSystemPrompt, criterioDelRubro } from "@/lib/ai-agent/prompt";
import { reglaDeRechazo } from "@/lib/captacion/insistencia";
import { bloqueDeRol } from "@/lib/agentes/roles-reglas";

const agenteCivil = {
  system_prompt: "GUION DE CAMPAÑA ART: preguntá si cobró la indemnización de la ART.",
  qualification_criteria: ["Tuvo un accidente laboral"],
  required_fields: ["tiempo_desde_accidente", "lugar_del_accidente"],
};
const identidad = { presentationName: "Leo", brandName: "Estudio" };
const ctx = (modo: "campana" | "entrante") => ({ area: "civil" as any, fullName: null, dniCuil: null, qualificationData: {}, campaignName: null, isFirstReplyToCampaign: false, modo });

test("modo: con base o campaña es campaña; sin nada escribió por su cuenta", () => {
  assert.equal(modoDelContacto({ importedBaseId: "b" }), "campana");
  assert.equal(modoDelContacto({ campaignName: "ART" }), "campana");
  assert.equal(modoDelContacto({ campaignId: "c" }), "campana");
  assert.equal(modoDelContacto({}), "entrante");
  assert.equal(modoDelContacto({ importedBaseId: null, campaignName: null, campaignId: null }), "entrante");
});

test("campaña: el guion de Civil queda intacto y se suma atender otro tema", () => {
  const p = buildSystemPrompt(agenteCivil, ctx("campana"), identidad);
  assert.match(p, /GUION DE CAMPAÑA ART/);
  assert.match(p, /Tuvo un accidente laboral/);
  assert.match(p, /tiempo_desde_accidente/);
  assert.match(p, /trae un tema distinto al de la campaña/);
  assert.doesNotMatch(p, /Venta consultiva/);
});

test("escribió por su cuenta en Civil: estudio integral, sin guion de ART ni datos de accidente", () => {
  const p = buildSystemPrompt(agenteCivil, ctx("entrante"), identidad);
  assert.doesNotMatch(p, /GUION DE CAMPAÑA ART/);
  assert.doesNotMatch(p, /tiempo_desde_accidente/);
  assert.match(p, /QUÉ ATIENDE EL ESTUDIO/);
  assert.match(p, /penal/i);
  assert.match(p, /tomala igual/);
  assert.match(p, /No preguntes por ART/);
  assert.match(p, /finalizar_consulta con resultado "completado"/);
  assert.match(p, /Venta consultiva/);
  assert.match(p, /tema_legal/);
});

test("escribió por su cuenta en Coberturas: se suma al guion, con aumento de cuota", () => {
  const g = guionSegunModo("coberturas_medicas", "entrante", { system_prompt: "GUION COB", qualification_criteria: ["a"], required_fields: ["b"] });
  assert.match(g.guion, /^GUION COB/);
  assert.match(g.guion, /aumentaron la cuota/);
  assert.deepEqual(g.criterios, ["a"]);
  assert.deepEqual(g.datos, ["b"]);
});

test("Marketing por su cuenta: sin análisis previo", () => {
  const g = guionSegunModo("marketing", "entrante", { system_prompt: "GUION MKT", qualification_criteria: [], required_fields: [] });
  assert.match(g.guion, /NO hay análisis previo/);
});

test("criterio y rechazo de Jurídico según el modo", () => {
  const camp = criterioDelRubro("civil" as any, null, "campana");
  const ent = criterioDelRubro("civil" as any, null, "entrante");
  assert.match(camp, /lugar_del_accidente/);
  assert.doesNotMatch(ent, /lugar_del_accidente/);
  assert.match(ent, /tema_legal/);
  assert.match(reglaDeRechazo("juridico").join("\n"), /ART/);
  assert.doesNotMatch(reglaDeRechazo("juridico", "entrante").join("\n"), /ART/);
});

test("rol de campaña se presenta como de la campaña", () => {
  const b = bloqueDeRol({ nombre: "ART", objetivo: "", tono: "", instrucciones: "Hacé tal cosa con cuidado." }, "ART Graves", "campana");
  assert.match(b, /Rol para esta campaña \(«ART Graves»\)/);
  assert.match(bloqueDeRol({ nombre: "X", objetivo: "", tono: "", instrucciones: "Hacé tal cosa con cuidado." }, null), /Rol para esta base/);
});
