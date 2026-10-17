import { test } from "node:test";
import assert from "node:assert/strict";
import { conVolver, etiquetaVolver, fichaDe, inicioDePerfil, perfilDeArea, volverSeguro } from "@/lib/navegacion";

test("volver solo acepta rutas internas", () => {
  assert.equal(volverSeguro("/prospectos?q=1"), "/prospectos?q=1");
  for (const malo of ["https://otra.web", "//otra.web", "/a\\b", "", undefined, 3]) assert.equal(volverSeguro(malo), null);
});

test("conVolver agrega o reemplaza el origen y conserva consulta y ancla", () => {
  assert.equal(conVolver("/ficha/1", "/oportunidades?perfil=marketing&pagina=3"), "/ficha/1?volver=%2Foportunidades%3Fperfil%3Dmarketing%26pagina%3D3");
  assert.equal(conVolver("/inbox/9?x=1#fin", "/ficha/1"), "/inbox/9?x=1&volver=%2Fficha%2F1#fin");
  assert.equal(conVolver("/inbox/9?volver=%2Fviejo", "/nuevo"), "/inbox/9?volver=%2Fnuevo");
  assert.equal(conVolver("/ficha/1", "https://otra.web"), "/ficha/1");
  // La cadena completa se puede desarmar: la conversación vuelve a la ficha y la ficha a la lista.
  const lista = "/prospectos?area=civil&pagina=2";
  const ficha = conVolver("/prospectos/abc", lista);
  const chat = conVolver("/inbox/z", ficha);
  const volverDelChat = new URLSearchParams(chat.split("?")[1]).get("volver");
  assert.equal(volverDelChat, ficha);
  assert.equal(new URLSearchParams(volverDelChat!.split("?")[1]).get("volver"), lista);
});

test("el texto de «Volver» dice adónde lleva", () => {
  assert.equal(etiquetaVolver("/ficha/1?volver=%2Fx"), "Volver a la ficha");
  assert.equal(etiquetaVolver("/prospectos/abc"), "Volver a la ficha");
  assert.equal(etiquetaVolver("/prospectos?area=civil"), "Volver a la lista");
  assert.equal(etiquetaVolver("/inbox/1"), "Volver a la conversación");
  assert.equal(etiquetaVolver("/conversacion/1"), "Volver a la conversación");
  assert.equal(etiquetaVolver("/telefono/marketing/clientes?estado=x"), "Volver a la lista");
  assert.equal(etiquetaVolver("/telefono/marketing"), "Volver al teléfono");
  assert.equal(etiquetaVolver("/panel/marketing"), "Volver al panel");
  assert.equal(etiquetaVolver("/"), "Volver al panel");
  assert.equal(etiquetaVolver("/comparacion-agentes?perfil=marketing&vista=perfil&semana=2"), "Volver a la comparación");
  assert.equal(etiquetaVolver("/comparacion-agentes/lista?cand=A"), "Volver a la lista");
  assert.equal(etiquetaVolver("/revision?vista=detenciones"), "Volver a Revisión");
  assert.equal(etiquetaVolver(null), "Volver");
});

test("inicio y ficha según el perfil", () => {
  assert.equal(inicioDePerfil("juridico"), "/hoy?perfil=juridico");
  assert.equal(inicioDePerfil("marketing"), "/hoy?perfil=marketing");
  assert.equal(etiquetaVolver("/hoy?perfil=marketing"), "Volver al inicio");
  assert.equal(perfilDeArea("civil"), "juridico");
  assert.equal(perfilDeArea("penal"), "juridico");
  assert.equal(perfilDeArea("agencia_0km"), "agencia_0km");
  assert.equal(fichaDe("a", "penal"), "/prospectos/a");
  assert.equal(fichaDe("a", "coberturas_medicas"), "/ficha/a");
});
