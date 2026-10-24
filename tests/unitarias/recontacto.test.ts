import { test } from "node:test";
import assert from "node:assert/strict";
import { excluidoDelRecontacto, leerDecision, planRecontacto, recontactoEncendido } from "@/lib/recontacto/reglas";
import { asignacionPorNombre } from "@/lib/plantillas/auto-reglas";

// Hora AR = UTC − 3. Viernes 23/10/2026.
const ar = (dia: string, hhmm: string) => new Date(`${dia}T${hhmm}:00-03:00`);

test("primer recontacto a las 2 h de la última respuesta del bot", () => {
  const p = planRecontacto({ ultimoEntrante: ar("2026-10-23", "12:51"), ultimoSaliente: ar("2026-10-23", "12:52"), recontactosHechos: 0 }, ar("2026-10-23", "13:30"));
  assert.equal(p.accion, "esperar");
  assert.equal((p as any).paso, 1);
  assert.equal((p as any).programado.toISOString(), ar("2026-10-23", "14:52").toISOString());
  const ya = planRecontacto({ ultimoEntrante: ar("2026-10-23", "12:51"), ultimoSaliente: ar("2026-10-23", "12:52"), recontactosHechos: 0 }, ar("2026-10-23", "14:53"));
  assert.equal(ya.accion, "enviar");
});

test("segundo recontacto a las 2 h del primero y después nada", () => {
  const p = planRecontacto({ ultimoEntrante: ar("2026-10-23", "12:51"), ultimoSaliente: ar("2026-10-23", "14:52"), recontactosHechos: 1 }, ar("2026-10-23", "16:53"));
  assert.equal(p.accion, "enviar");
  assert.equal((p as any).paso, 2);
  const fin = planRecontacto({ ultimoEntrante: ar("2026-10-23", "12:51"), ultimoSaliente: ar("2026-10-23", "16:53"), recontactosHechos: 2 }, ar("2026-10-23", "20:00"));
  assert.deepEqual(fin, { accion: "nada", motivo: "ya_se_recontacto" });
});

test("si el plazo cae después de las 21, se adelanta a las 20:50", () => {
  const p = planRecontacto({ ultimoEntrante: ar("2026-10-23", "19:55"), ultimoSaliente: ar("2026-10-23", "20:00"), recontactosHechos: 0 }, ar("2026-10-23", "20:10"));
  assert.equal(p.accion, "esperar");
  assert.equal((p as any).programado.toISOString(), ar("2026-10-23", "20:50").toISOString());
});

test("si ya no hay tiempo antes del cierre, sale a las 8 del día hábil siguiente dentro de la ventana", () => {
  // Respuesta del bot a las 20:45: el adelanto (20:50) no respeta el mínimo de 20 min.
  const p = planRecontacto({ ultimoEntrante: ar("2026-10-22", "20:40"), ultimoSaliente: ar("2026-10-22", "20:45"), recontactosHechos: 0 }, ar("2026-10-22", "22:00"));
  assert.equal(p.accion, "esperar");
  assert.equal((p as any).programado.toISOString(), ar("2026-10-23", "08:00").toISOString());
  // El sábado a la noche: el lunes ya pasó la ventana de 24 h.
  const sab = planRecontacto({ ultimoEntrante: ar("2026-10-24", "20:40"), ultimoSaliente: ar("2026-10-24", "20:45"), recontactosHechos: 0 }, ar("2026-10-24", "22:00"));
  assert.deepEqual(sab, { accion: "nada", motivo: "ventana_cerrada" });
});

test("nada si el último mensaje es de la persona o no escribió nunca", () => {
  assert.deepEqual(planRecontacto({ ultimoEntrante: ar("2026-10-23", "12:00"), ultimoSaliente: ar("2026-10-23", "11:00"), recontactosHechos: 0 }, ar("2026-10-23", "15:00")), { accion: "nada", motivo: "ultimo_es_de_la_persona" });
  assert.deepEqual(planRecontacto({ ultimoEntrante: null, ultimoSaliente: ar("2026-10-23", "11:00"), recontactosHechos: 0 }, ar("2026-10-23", "15:00")), { accion: "nada", motivo: "sin_mensaje_de_la_persona" });
});

test("exclusiones y lectura de la decisión del bot", () => {
  assert.equal(excluidoDelRecontacto({ aiEnabled: true }), null);
  assert.ok(excluidoDelRecontacto({ aiEnabled: false }));
  assert.ok(excluidoDelRecontacto({ aiEnabled: true, captacion: "captado" }));
  assert.ok(excluidoDelRecontacto({ aiEnabled: true, estadoConversacion: "agendado" }));
  assert.deepEqual(leerDecision('```json\n{"escribir": true, "motivo": "interés", "texto": "Hola María, ¿pudiste ver lo del alta?"}\n```'), { escribir: true, motivo: "interés", texto: "Hola María, ¿pudiste ver lo del alta?" });
  assert.equal(leerDecision('{"escribir": true, "texto": ""}'), null);
  assert.equal(leerDecision("no es json"), null);
  assert.equal(recontactoEncendido(null, "juridico"), true);
  assert.equal(recontactoEncendido({ juridico: false }, "juridico"), false);
});

test("asignación automática de plantillas por nombre", () => {
  assert.deepEqual(asignacionPorNombre("jur_base_fria_a", 2), { perfil: "juridico", proposito: "campana", fuentes: ["contacto.nombre", "perfil.presentacion"] });
  assert.deepEqual(asignacionPorNombre("cob_seguimiento_2", 1), { perfil: "coberturas_medicas", proposito: "seguimiento", fuentes: ["contacto.nombre"] });
  assert.deepEqual(asignacionPorNombre("autos_seguimiento_3", 1), { perfil: "agencia_0km", proposito: "seguimiento_3", fuentes: ["contacto.nombre"] });
  assert.equal(asignacionPorNombre("jur_base_fria_a", 3), null);
  assert.equal(asignacionPorNombre("cob_recupero_a", 1), null);
  assert.equal(asignacionPorNombre("mkt_apertura_propuesta", 1), null);
});
