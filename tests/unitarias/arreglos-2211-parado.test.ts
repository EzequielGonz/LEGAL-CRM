import test from "node:test";
import assert from "node:assert/strict";
import { motivoDePausaLegible, motivosDeParo } from "@/lib/definiciones/parado";

const sano = {
  pausaGeneral: { ia: false, envios: false },
  lineasMeta: [{ nombre: "Línea 1", estado: "conectada", ok: true, calidad: "alta" }],
  lineasWasender: [],
  campanas: [],
  agenteActivo: true,
};

test("22/11: un perfil sano no tiene motivos de paro", () => {
  assert.deepEqual(motivosDeParo(sano), []);
});

test("22/11: Hoy dice por qué cada perfil está parado, con lo que hay que hacer", () => {
  const sinAcceso = motivosDeParo({ ...sano, lineasMeta: [{ nombre: "Marketing", estado: "sin_acceso", ok: false, etiqueta: "Sin acceso al número", calidad: null }] });
  assert.equal(sinAcceso[0].tono, "rojo");
  assert.match(sinAcceso[0].texto, /Marketing/);
  assert.match(sinAcceso[0].texto, /acceso/i);
  const calidad = motivosDeParo({ ...sano, lineasMeta: [{ nombre: "Autos", estado: "conectada", ok: true, calidad: "baja" }] });
  assert.match(calidad[0].texto, /calidad baja/i);
  assert.match(calidad[0].texto, /se pausan solas/i);
  const pago = motivosDeParo({ ...sano, campanas: [{ nombre: "Salud 1", status: "pausada", pauseReason: "La línea tiene un problema de pago (131042). Revisá el método de pago en Meta." }] });
  assert.match(pago[0].texto, /131042/);
});

test("22/11: pausa general, Wasender caída y agente apagado también se dicen", () => {
  const r = motivosDeParo({ ...sano, pausaGeneral: { ia: true, envios: true }, lineasWasender: [{ nombre: "Chip 1", estado: "logged_out", habilitada: true }], agenteActivo: false });
  const textos = r.map((x) => x.texto).join(" | ");
  assert.match(textos, /pausa general de envíos/i);
  assert.match(textos, /respuestas de la IA/i);
  assert.match(textos, /Chip 1/);
  assert.match(textos, /agente/i);
});

test("22/11: sin ninguna línea, el motivo es que no hay línea", () => {
  const r = motivosDeParo({ ...sano, lineasMeta: [], lineasWasender: [] });
  assert.match(r[0].texto, /sin línea/i);
});

test("22/11: los motivos de pausa internos se traducen (nada de «ad» ni «domingo» sueltos)", () => {
  assert.match(motivoDePausaLegible("domingo"), /domingo/i);
  assert.notEqual(motivoDePausaLegible("domingo"), "domingo");
  assert.match(motivoDePausaLegible("ad"), /anotó|motivo/i);
  assert.equal(motivoDePausaLegible("Límite diario alcanzado"), "Límite diario alcanzado");
  assert.equal(motivoDePausaLegible(null), "Sin motivo registrado");
  assert.match(motivoDePausaLegible("WHATSAPP_MARKETING sin acceso"), /conexión de la línea/i);
  assert.doesNotMatch(motivoDePausaLegible("WHATSAPP_MARKETING sin acceso"), /WHATSAPP_/);
});

test("22/11: una campaña pausada con motivo corto interno se explica en Hoy", () => {
  const r = motivosDeParo({ ...sano, campanas: [{ nombre: "Graves", status: "pausada", pauseReason: "domingo" }] });
  assert.match(r[0].texto, /Graves/);
  assert.match(r[0].texto, /domingo/i);
  assert.match(r[0].texto, /nadie la reanudó|reanud/i);
});
