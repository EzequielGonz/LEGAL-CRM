// 24/10: contestadores automáticos, pedidos de datos, promesas de horario, calidad de líneas, rescate y ficha del negocio.
import { test } from "node:test";
import assert from "node:assert/strict";
import { esRespuestaAutomatica, motivoParaNoResponder, pideOrigenOBajaDeDatos } from "@/lib/agentes/automaticos";
import { validarTextoSalida, prometeHorario } from "@/lib/agentes/contrato";
import { bloqueHorarioAtencion } from "@/lib/horario-atencion";
import { clasificarAtencion } from "@/lib/captacion/reglas";
import { correspondePedidoTexto } from "@/lib/fuente";
import { tocaConsultar, motivoPausaCalidad } from "@/lib/whatsapp/calidad-servidor";
import { enFranjaDeRescate } from "@/lib/ai-agent/rescate";
import { bloqueFichaNegocio, validarFicha } from "@/lib/agentes/ficha-negocio";
import { evaluarSalud } from "@/lib/salud/reglas";
import { itemsDelPerfil } from "@/lib/salud/por-perfil";

test("contestadores", () => {
  for (const t of [
    "¡Hola! Gracias por comunicarte con Lucca y Asoc. En breve te responderemos.",
    "Este es un mensaje automático. Nuestro horario de atención es de 9 a 18.",
    "En este momento no podemos atenderte, te responderemos a la brevedad.",
    "Bienvenido. Escribí 1 para ventas\n2 para soporte\n3 para administración",
    "1. Ventas\n2. Soporte\n3. Pagos",
    "Gracias por tu mensaje. Un asesor te responderá lo antes posible.",
  ]) assert.equal(esRespuestaAutomatica(t), true, t);
  for (const t of ["Hola, sí me interesa", "Ya compré", "Buen día Nancy", "gracias!", "Tengo 2 hijos y busco plan", "Mañana te escribo"]) assert.equal(esRespuestaAutomatica(t), false, t);
});

test("bucle y pendientes", () => {
  const ahora = new Date("2026-10-24T12:00:00Z");
  const m = (d: string, s: number, body: string) => ({ direction: d, sender_type: d === "saliente" ? "agente_ia" : "prospecto", body, created_at: new Date(ahora.getTime() - s * 1000).toISOString() });
  assert.equal(motivoParaNoResponder([m("saliente", 100, "Hola"), m("entrante", 95, "Gracias por comunicarte con X, en breve te respondemos")], ahora), "respuesta_automatica");
  assert.equal(motivoParaNoResponder([m("saliente", 100, "Hola"), m("entrante", 60, "Hola, sí")], ahora), null);
  const largo = "Hola, gracias por escribir a Estudio X, nuestro equipo te contesta pronto";
  assert.equal(motivoParaNoResponder([m("entrante", 300, largo + " ok"), m("saliente", 290, "a"), m("entrante", 280, "Que lindo saludarte che, contame mas de lo que buscas"), m("saliente", 200, "b"), m("entrante", 100, "Que lindo saludarte che, contame mas de lo que buscas")], ahora), "bucle_automatico");
  const rapido = [m("saliente", 300, "a"), m("entrante", 295, "x1"), m("saliente", 250, "b"), m("entrante", 245, "x2"), m("saliente", 200, "c"), m("entrante", 196, "x3")];
  assert.equal(motivoParaNoResponder(rapido, ahora), "bucle_automatico");
  assert.equal(motivoParaNoResponder(rapido.slice(0, 4), ahora), null);
  assert.equal(motivoParaNoResponder([m("entrante", 10, "Gracias por comunicarte, en breve te respondemos"), m("entrante", 5, "Hola soy Juan, quería consultar")], ahora), null);
});

test("origen y baja", () => {
  assert.equal(pideOrigenOBajaDeDatos("¿De dónde sacaron mi número?"), "origen");
  assert.equal(pideOrigenOBajaDeDatos("de donde tienen mis datos"), "origen");
  assert.equal(pideOrigenOBajaDeDatos("Quién te dio mi número?"), "origen");
  assert.equal(pideOrigenOBajaDeDatos("Cómo consiguieron mi celular"), "origen");
  assert.equal(pideOrigenOBajaDeDatos("Borren mis datos por favor"), "baja");
  assert.equal(pideOrigenOBajaDeDatos("eliminá mi número"), "baja");
  assert.equal(pideOrigenOBajaDeDatos("Sacame de la lista"), "baja");
  assert.equal(pideOrigenOBajaDeDatos("denme de baja"), "baja");
  for (const t of ["de dónde son?", "Hola", "no me interesa", "¿De dónde me escriben?", "te paso mi número de dni", "Ya compré"]) assert.equal(pideOrigenOBajaDeDatos(t), null, t);
});

test("validador", () => {
  assert.equal(validarTextoSalida("Perfecto, un asesor te llama mañana a la mañana.").ok, false);
  assert.equal(validarTextoSalida("Listo, te contactamos hoy por la tarde.").ok, false);
  assert.equal(validarTextoSalida("¿Te queda mejor que te llamen a la mañana o a la tarde?").ok, true);
  assert.equal(validarTextoSalida("Perfecto, una persona del equipo se va a comunicar con vos. ¡Gracias!").ok, true);
  assert.equal(validarTextoSalida("Por lo que contás, te corresponde una compensación.").ok, false);
  assert.equal(validarTextoSalida("Corresponde una compensación por eso").ok, false);
  assert.equal(validarTextoSalida("Te queda agendado para el martes a las 10.").ok, true);
  assert.equal(prometeHorario("Buen día! ¿Cómo estás?"), null);
});

test("horario, atención, pedido de texto, calidad, rescate, ficha", () => {
  const fuera = bloqueHorarioAtencion(new Date("2026-10-23T01:00:00Z"));
  assert.match(fuera, /No prometas día ni hora/);
  assert.doesNotMatch(fuera, /mañana desde las 8/);
  const t = clasificarAtencion("solicitud_eliminacion");
  assert.equal(t.principal, false); assert.equal(t.detener, "no_contacto"); assert.equal(t.respuesta, "disculpa_datos");
  // La detención no apaga al agente; el número de una menor sí.
  assert.equal(clasificarAtencion("no_quiere_mensajes").pausarChat, false);
  assert.equal(clasificarAtencion("numero_de_menor").pausarChat, true);
  const now = new Date();
  assert.equal(correspondePedidoTexto(new Date(now.getTime() - 10 * 60_000), now), false);
  assert.equal(correspondePedidoTexto(new Date(now.getTime() - 30 * 60_000), now), true);
  assert.equal(tocaConsultar(null, now), true);
  assert.equal(tocaConsultar(new Date(now.getTime() - 5 * 60_000).toISOString(), now), false);
  assert.match(motivoPausaCalidad("CIVIL"), /calidad baja/);
  assert.equal(enFranjaDeRescate(new Date(now.getTime() - 60_000).toISOString(), now), false);
  assert.equal(enFranjaDeRescate(new Date(now.getTime() - 5 * 60_000).toISOString(), now), true);
  assert.equal(enFranjaDeRescate(new Date(now.getTime() - 61 * 60_000).toISOString(), now), false);
  assert.match(bloqueFichaNegocio("Atendemos AMBA"), /FICHA DEL NEGOCIO[\s\S]*Atendemos AMBA[\s\S]*no lo inventes/);
  assert.equal(validarFicha("x".repeat(7000)).ok, false);
  const items = evaluarSalud({ ahora: now, ultimoLatido: now.toISOString(), pausa: { ia: false, envios: false }, cuarentena24h: { cantidad: 0, motivo: null }, secretoMeta: true, ultimoEntrante: now.toISOString(), perfiles: [], turnos24h: { errores: 0, total: 0 }, presupuestosAtrasados: 0, calidadLineas: [{ slug: "juridico", nombre: "Jurídico", linea: "CIVIL", calidad: "baja", pausadas: ["ART"] }] });
  const it = items.find((i) => i.clave === "calidad_juridico")!;
  assert.equal(it.estado, "rojo");
  assert.equal(itemsDelPerfil(items, "juridico").some((i) => i.clave === "calidad_juridico"), true);
  assert.equal(itemsDelPerfil(items, "marketing").some((i) => i.clave === "calidad_juridico"), false);
});
