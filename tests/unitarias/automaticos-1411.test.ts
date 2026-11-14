import { test } from "node:test";
import assert from "node:assert/strict";
import { esRespuestaAutomatica } from "@/lib/agentes/automaticos";

// 14/11: contestadores vistos en los chats de la v2, con el nombre del negocio cambiado.
const AUTOMATICOS = [
  "Gracias por comunicarte con Negocio Ejemplo. ¿Cómo podemos ayudarte?",
  "Gracias por comunicarte con Aberturas Ejemplo.. ¿Cómo podemos ayudarte?",
  "¡Hola! ¿Cómo estás? 🙋‍♂ Te comunicaste con Puertas Ejemplo ¡Soy Marcos y seré tu asesor! En este momento me encuentro ocupado",
  "Hola!, En éste momento no puedo atenderte. - Nuestros horarios de atención son: lunes a viernes de 8:00 a 13:00",
  "Gracias por comunicarte con Herrajes Ejemplo. Te estaremos respondiendo en nuestro horario comercial, de Lunes a Viernes",
  "Por favor *elegí una de las opciones* que te dejé más arriba y seguimos conversando.",
  "Lamento informarte que superaste los intentos para elegir una de las opciones. Volvé a intentarlo más tarde. 🤖",
  "¡No hay problema! Ya no te vamos a mandar las ofertas por WhatsApp. Podés *volver a suscribirte* cuando quieras. 🤗",
  "👋 5491100000000, quiero ayudarte con tu consulta.",
  "¡Fue un placer hablar con vos! Cuando quieras contratar algún servicio, escribime _*hola*_. ☺️",
  "Gracias por tu mensaje. Estoy de receso... vuelvo pronto.",
  "Gracias por comunicarte con Puertas Ejemplo. ¿Cómo podemos ayudarte? Recordá nuestros horarios de atención: lunes a viernes",
];

// Personas reales: nada de esto puede tomarse como contestador.
const PERSONAS = [
  "Hola, ya tengo abogado, gracias",
  "Ahora no",
  "Estoy en el trabajo, te escribo más tarde",
  "Podría ser más tarde yo le aviso cuando me llama",
  "Gracias por avisar, después lo veo",
  "No me escriban más",
  "Hola buenos días ok",
  "Sí, me interesa",
  "¿Con qué marcas trabajan?",
  "Estoy. Comentame de qué se trata",
  "Gracias por comunicarte, sí me interesa saber más",
];

test("contestadores del 14/11: se reconocen", () => {
  for (const t of AUTOMATICOS) assert.equal(esRespuestaAutomatica(t), true, t);
});

test("contestadores del 14/11: las personas no se confunden con un contestador", () => {
  for (const t of PERSONAS) assert.equal(esRespuestaAutomatica(t), false, t);
});
