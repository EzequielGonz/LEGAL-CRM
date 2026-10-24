import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clasificarRespuesta,
  esPostergaFirme,
  instruccionUltimaRespuesta,
  prepararHistorial,
  textoDePlantilla,
} from "@/lib/agentes/plantillas-en-historial";
import { reglaDeRechazo } from "@/lib/captacion/insistencia";

const COB = {
  bodyText: "Hola {{1}}, te escribe {{2}} de {{3}}. ¿Te interesa que revisemos alternativas para vos o tu familia?",
  buttons: [{ text: "Sí, me interesa" }, { text: "Ahora no" }, { text: "No me escriban más" }],
};

test("la plantilla se muestra con su texto y sus botones", () => {
  const t = textoDePlantilla(COB)!;
  assert.match(t, /^Hola …, te escribe … de …\./);
  assert.match(t, /Botones: «Sí, me interesa» \/ «Ahora no» \/ «No me escriban más»/);
  assert.equal(textoDePlantilla({ bodyText: "" }), null);
});

test("clasifica los botones de todas las plantillas cargadas", () => {
  const casos: [string, string][] = [
    ["No me escriban más", "baja"],
    ["Ahora no", "posterga"],
    ["No por ahora", "posterga"],
    ["Prefiero otro horario", "reprogramar"],
    ["Sí, otro horario", "reprogramar"],
    ["Ya compré", "resuelto"],
    ["Ya lo resolví", "resuelto"],
    ["Ya quedó resuelto", "resuelto"],
    ["Mi caso ya esta resuelto", "resuelto"],
    ["Ya no", "resuelto"],
    ["No, gracias", "rechaza"],
    ["Sí, me interesa", "acepta"],
    ["Dale", "acepta"],
    ["Quiero comparar", "acepta"],
    ["Sí, cuéntenme", "acepta"],
    ["Sigue pendiente", "acepta"],
    ["Mi caso esta pendiente", "acepta"],
    ["Me interesa", "acepta"],
    ["Nos interesa", "acepta"],
    ["Sí, empecemos", "acepta"],
  ];
  for (const [b, c] of casos) assert.equal(clasificarRespuesta(b), c, b);
  assert.equal(clasificarRespuesta("ahora no puedo, estoy trabajando"), "posterga");
  assert.equal(clasificarRespuesta("lo vemos más adelante"), "posterga");
});

test("historial: plantilla real, botón marcado y regla de «ahora no»", () => {
  const filas = [
    { direction: "saliente", body: "[Plantilla de campaña \"X\": cob_recupero_a] Primer contacto automático a Fulana.", metadata: { template_id: "t1" } },
    { direction: "entrante", body: "Ahora no", metadata: { provider_type: "button" } },
  ];
  const { filas: h, ultima } = prepararHistorial(filas, (r) => (r.id === "t1" ? COB : null));
  assert.match(h[0].body!, /Le mandamos esta plantilla/);
  assert.match(h[0].body!, /revisemos alternativas/);
  assert.doesNotMatch(h[0].body!, /Fulana/);
  assert.equal(h[1].body, "«Ahora no» (tocó este botón de la plantilla)");
  assert.equal(ultima?.clase, "posterga");
  assert.equal(esPostergaFirme(ultima), true);
  const ins = instruccionUltimaRespuesta(ultima);
  assert.match(ins, /NO insistas/);
  assert.match(ins, /no preguntes qué día/);
});

test("texto libre: solo baja o «ahora no» y solo si responde a una plantilla", () => {
  const plantilla = { direction: "saliente", body: "x", metadata: { plantilla: "cob_seguimiento_2" } };
  const charla = { direction: "saliente", body: "¿Estabas registrado?", metadata: {} };
  const a = prepararHistorial([plantilla, { direction: "entrante", body: "ahora no puedo", metadata: {} }], () => null).ultima;
  assert.match(instruccionUltimaRespuesta(a), /NO insistas/);
  const b = prepararHistorial([charla, { direction: "entrante", body: "no", metadata: {} }], () => null).ultima;
  assert.equal(instruccionUltimaRespuesta(b), "");
  assert.equal(esPostergaFirme(b), false);
});

test("reglas de rechazo: «ahora no» sin insistir en los 4 rubros y sin decir «base»", () => {
  for (const s of ["juridico", "coberturas_medicas", "agencia_0km", "marketing"]) {
    const r = reglaDeRechazo(s).join("\n");
    assert.match(r, /NO insistas, no preguntes día ni horario/);
    assert.match(r, /Nunca digas «base»/);
    assert.doesNotMatch(r, /insistí UNA sola vez preguntando qué día/);
  }
  assert.match(reglaDeRechazo("coberturas_medicas").join("\n"), /ya compró\/contrató.*«no me interesa».*insistí UNA sola vez/);
});
