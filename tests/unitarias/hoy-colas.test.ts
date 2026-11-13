import { test } from "node:test";
import assert from "node:assert/strict";
import { chatsQueEsperan } from "@/lib/hoy/colas";

const chat = (id: string) => ({ id, contact_id: `c-${id}`, last_message_at: null });
const msj = (conversation_id: string, direction: string, created_at: string, body = "texto ficticio") => ({ conversation_id, direction, created_at, body });

test("hoy: espera respuesta solo el chat cuyo último mensaje es de la persona", () => {
  const filas = chatsQueEsperan(
    [chat("a"), chat("b"), chat("c"), chat("d")],
    [
      msj("a", "saliente", "2026-11-10T10:00:00Z"),
      msj("a", "entrante", "2026-11-10T11:00:00Z", "¿Me pueden llamar?"),
      msj("b", "entrante", "2026-11-10T09:00:00Z"),
      msj("b", "saliente", "2026-11-10T09:30:00Z"),
      msj("c", "entrante", "2026-11-09T08:00:00Z"),
    ]
  );
  // «b» ya fue contestado; «d» no tiene mensajes en la ventana. Primero el que más esperó.
  assert.deepEqual(filas.map((f) => f.conversationId), ["c", "a"]);
  assert.equal(filas[1].texto, "¿Me pueden llamar?");
  assert.equal(filas[1].contactId, "c-a");
});

test("hoy: los detenidos y los perdidos no entran en la cola", () => {
  const filas = chatsQueEsperan([chat("a"), chat("b")], [msj("a", "entrante", "2026-11-10T11:00:00Z"), msj("b", "entrante", "2026-11-10T12:00:00Z")], new Set(["a"]));
  assert.deepEqual(filas.map((f) => f.conversationId), ["b"]);
});

import { siguientePasoFicha } from "@/lib/inicio";

test("ficha: si la persona escribió y el chat lo tiene una persona, el siguiente paso es responder", () => {
  const base = { capture_state: "en_conversacion", attention_state: "ninguna", followup_state: "inactivo" };
  assert.match(siguientePasoFicha({ ...base, chatTomado: true, esperaRespuesta: true }).texto, /está esperando/);
  assert.equal(siguientePasoFicha({ ...base, chatTomado: true, esperaRespuesta: true }).urgente, true);
  assert.match(siguientePasoFicha({ ...base, chatTomado: true, esperaRespuesta: false }).texto, /lo tiene una persona/);
  // Con la IA prendida sigue igual que antes.
  assert.match(siguientePasoFicha({ ...base, chatTomado: false, esperaRespuesta: true }).texto, /en curso con el agente/);
  // Un detenido sigue teniendo prioridad.
  assert.match(siguientePasoFicha({ ...base, detenido: true, chatTomado: true, esperaRespuesta: true }).texto, /detenido/);
});

import { unificarCola } from "@/lib/hoy/colas";

test("hoy: cada persona aparece una sola vez en la cola, con lo primero que hay que hacer", () => {
  const e = (contactId: string, at: string, extra: Record<string, unknown> = {}) => ({ contactId, conversationId: `v-${contactId}`, nombre: `Persona ${contactId}`, at, ...extra });
  const cola = unificarCola({
    esperan: [e("a", "2026-11-10T10:00:00Z", { detalle: "¿Me llaman?" }), e("b", "2026-11-09T10:00:00Z")],
    porCerrar: [e("a", "2026-11-10T10:00:00Z", { detalle: "Volvió a escribir" }), e("c", "2026-11-08T10:00:00Z", { detalle: "Hizo una pregunta que el bot no sabe" })],
    captados: [e("a", "2026-11-10T09:00:00Z"), e("d", "2026-11-11T09:00:00Z"), e("f", "2026-11-12T09:00:00Z")],
  });
  // «a» estaba en las tres listas: queda una sola fila, para responder y además derivar.
  assert.deepEqual(cola.map((i) => i.contactId), ["c", "b", "a", "f", "d"]);
  const a = cola.find((i) => i.contactId === "a")!;
  assert.deepEqual([a.accion, a.tambienDerivar, a.detalle], ["responder", true, "¿Me llaman?"]);
  assert.deepEqual([cola[3].accion, cola[3].tambienDerivar], ["derivar", false]);
  // Sin contacto ni conversación no se puede abrir: no entra.
  assert.equal(unificarCola({ esperan: [{ contactId: null, conversationId: null, nombre: null, at: null }], porCerrar: [], captados: [] }).length, 0);
});

import { descarteDe } from "@/lib/hoy/descartes";
import { rangoDePeriodo, tasa, variacion } from "@/lib/hoy/periodos";

test("hoy: reconoce los descartes claros y deja en atención humana todo lo dudoso", () => {
  assert.equal(descarteDe("Hola no gracias ya tengo abogado")?.clave, "ya_tiene_profesional");
  assert.equal(descarteDe("Mi caso ya está resuelto")?.clave, "ya_resuelto");
  assert.equal(descarteDe("No me interesa, gracias")?.clave, "no_interesa");
  assert.equal(descarteDe("no gracias")?.clave, "no_interesa");
  assert.equal(descarteDe("Número equivocado")?.clave, "numero_equivocado");
  assert.equal(descarteDe("No me escriban más")?.clave, "no_escribir");
  // Interés, dudas o frases que siguen la charla: nunca son descarte.
  for (const t of ["A la tarde", "Sí, sigamos", "Ya tengo abogado pero quisiera otra opinión", "¿Cuánto sale?", "No ahora me viene bien justo estoy desocupado", "Sos un muy buen asesor", "", null]) {
    assert.equal(descarteDe(t as any), null, String(t));
  }
});

test("hoy: los períodos de la presentación y su comparación", () => {
  const ahora = new Date("2026-11-12T18:00:00Z"); // jueves 12/11, 15 h de Argentina
  const sem = rangoDePeriodo("semana", ahora);
  assert.equal(sem.desde.toISOString(), "2026-11-09T03:00:00.000Z");
  assert.equal(sem.antesDesde.toISOString(), "2026-11-02T03:00:00.000Z");
  const pasada = rangoDePeriodo("semana_pasada", ahora);
  assert.deepEqual([pasada.desde.toISOString(), pasada.hasta.toISOString()], ["2026-11-02T03:00:00.000Z", "2026-11-09T03:00:00.000Z"]);
  const mes = rangoDePeriodo("mes", ahora);
  assert.equal(mes.desde.toISOString(), "2026-11-01T03:00:00.000Z");
  const mesPasado = rangoDePeriodo("mes_pasado", ahora);
  assert.deepEqual([mesPasado.desde.toISOString(), mesPasado.hasta.toISOString()], ["2026-10-01T03:00:00.000Z", "2026-11-01T03:00:00.000Z"]);
  assert.equal(variacion(12, 10).texto, "+20 % (antes 10)");
  assert.equal(variacion(5, 10).tono, "baja");
  assert.equal(variacion(3, 3).tono, "igual");
  assert.equal(variacion(null, 3).tono, "nada");
  assert.equal(tasa(5, 200), "2,5 %");
  assert.equal(tasa(5, 0), null);
});

import { accesosDe, direccionValida } from "@/lib/redes/accesos";

test("redes: los accesos solo aceptan direcciones https del dominio que corresponde", () => {
  assert.deepEqual(direccionValida("instagram", "instagram.com/perfil_ficticio"), { ok: true, url: "https://instagram.com/perfil_ficticio" });
  assert.deepEqual(direccionValida("instagram", "  "), { ok: true, url: null });
  assert.equal(direccionValida("instagram", "https://ejemplo.com/perfil").ok, false);
  assert.equal(direccionValida("facebook", "http://facebook.com/pagina").ok, false);
  assert.equal(direccionValida("facebook", "https://usuario:clave@facebook.com/pagina").ok, false);
  assert.equal(direccionValida("instagram", "javascript:alert(1)").ok, false);
  // Los accesos fijos (WhatsApp Web, bandeja de Meta…) no se pueden cambiar.
  assert.equal(direccionValida("whatsapp_web", "https://web.whatsapp.com").ok, false);
  const lista = accesosDe({ instagram: "https://instagram.com/perfil_ficticio" });
  assert.equal(lista.find((a) => a.clave === "instagram")?.url, "https://instagram.com/perfil_ficticio");
  assert.equal(lista.find((a) => a.clave === "facebook")?.url, null);
  assert.equal(lista.find((a) => a.clave === "whatsapp_web")?.url, "https://web.whatsapp.com/");
});
