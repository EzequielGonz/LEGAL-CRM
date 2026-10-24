/**
 * Herramientas del asistente sobre chats (24/10). Puras: solo las
 * declaraciones. Leer un chat responde en el momento; todo lo demás queda
 * como PROPUESTA y se ejecuta al confirmar en el panel (responder pide la
 * confirmación reforzada porque le escribe a una persona).
 */
export const NOMBRES_CHATS = [
  "buscar_chat",
  "proponer_respuesta_chat",
  "proponer_tomar_chat",
  "proponer_soltar_chat",
  "proponer_marcar_captado",
  "proponer_marcar_derivado",
] as const;

const persona = { type: "string", description: "Nombre o teléfono de la persona (como figura en el panel)" };

export const DECLARACIONES_CHATS = [
  {
    name: "buscar_chat",
    description: "Busca el chat de una persona del perfil por nombre o teléfono y devuelve sus últimos mensajes, quién atiende (bot o persona) y el estado de captación. Solo lectura.",
    parametersJsonSchema: { type: "object", properties: { persona }, required: ["persona"] },
  },
  {
    name: "proponer_respuesta_chat",
    description: "Deja como PROPUESTA mandarle un mensaje a una persona por su chat, como la responsable (el chat pasa a atención humana). Pide la confirmación reforzada. Leé el chat antes con buscar_chat.",
    parametersJsonSchema: {
      type: "object",
      properties: { persona, texto: { type: "string", description: "Mensaje exacto que se va a enviar" } },
      required: ["persona", "texto"],
    },
  },
  {
    name: "proponer_tomar_chat",
    description: "Deja como PROPUESTA tomar el chat de una persona: el bot deja de responder ahí y lo atiende una persona. No envía nada.",
    parametersJsonSchema: { type: "object", properties: { persona }, required: ["persona"] },
  },
  {
    name: "proponer_soltar_chat",
    description: "Deja como PROPUESTA devolverle el chat de una persona al bot (vuelve a responder él). No envía nada en el momento.",
    parametersJsonSchema: { type: "object", properties: { persona }, required: ["persona"] },
  },
  {
    name: "proponer_marcar_captado",
    description: "Deja como PROPUESTA marcar como captada a una persona. Necesita la evidencia: qué aceptó, en sus palabras.",
    parametersJsonSchema: {
      type: "object",
      properties: { persona, evidencia: { type: "string", description: "Qué aceptó la persona (lo que dijo)" } },
      required: ["persona", "evidencia"],
    },
  },
  {
    name: "proponer_marcar_derivado",
    description: "Deja como PROPUESTA marcar como derivada a una persona ya captada (se la pasaron al profesional, al asesor o al equipo).",
    parametersJsonSchema: {
      type: "object",
      properties: { persona, destinatario: { type: "string", description: "A quién se derivó (opcional)" }, nota: { type: "string" } },
      required: ["persona"],
    },
  },
];
