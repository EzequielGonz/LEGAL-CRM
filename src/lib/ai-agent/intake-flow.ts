import { createAdminClient } from "@/lib/supabase/admin";
import { sendOutboundMessage } from "@/lib/messaging";
import { notifyAdminOfQualifiedIntake } from "@/lib/notify";

/**
 * Cuestionario fijo que se dispara cuando un prospecto responde al botón
 * "Mi caso esta pendiente" de la plantilla de campaña `estudio_juridico_vita`.
 * A diferencia del agente IA (agent.ts), acá NO se usa el modelo: los
 * textos, el orden y las opciones son exactamente los que definió el
 * estudio, así que se recorren como un guión fijo, paso a paso, guardado en
 * `conversations.intake_step`.
 *
 * Devuelve `true` si el mensaje entrante fue consumido por este flujo (el
 * llamador no debe pasárselo también al agente IA), `false` si no aplica y
 * el mensaje debe seguir su curso normal.
 */

function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // saca acentos (rango unicode de tildes) para que "esta" y "está" matcheen igual
}

// El botón de la plantilla decía "M caso esta pendiente" (typo, sin la "i" de
// "Mi") y se mandó a corregir a "Mi caso esta pendiente"; mientras Meta
// aprueba el cambio puede llegar cualquiera de las dos variantes. Se matchea
// por contenido en vez de texto exacto para no depender de cuál esté activa.
function esBotonPendiente(normalized: string): boolean {
  return normalized.includes("caso") && normalized.includes("pendiente");
}

function esBotonResuelto(normalized: string): boolean {
  return normalized.includes("caso") && normalized.includes("resuelto");
}

const MSG_INTRO =
  "Para poder derivarte con el profesional adecuado según tu situación, necesitamos hacerte algunas preguntas breves.\n" +
  "No te preocupes, son solo para entender mejor tu caso y brindarte la mejor atención.\n" +
  "Responde con el número de cada opción:";

const MSG_PREGUNTA_1 =
  "📋 Pregunta 1: ¿Hace cuánto tiempo ocurrió tu accidente laboral?\n\n" +
  "1 - Menos de 6 meses\n" +
  "2 - Entre 6 meses y 1 año\n" +
  "3 - Entre 1 y 2 años\n" +
  "4 - Más de 2 años";

const MSG_PREGUNTA_2 =
  "📋 Pregunta 2: ¿Dónde ocurrió el accidente?\n" +
  "1 - En el lugar de trabajo\n" +
  "2 - En el camino al trabajo\n" +
  "3 - Volviendo del trabajo";

const MSG_PREGUNTA_3 =
  "📋 Pregunta 3: 🩺 ¿Qué lesión o problema de salud te generó el accidente laboral? (Escribí tu respuesta)";

const MSG_PREGUNTA_4 =
  "📋 Pregunta 4: 📅 ¿Qué día y horario te viene bien para una reunión con un profesional?\n\n(Escribí tu respuesta)";

const MSG_RESUELTO =
  "¡Qué buena noticia! Nos alegra mucho saber que pudiste resolver tu situación. " +
  "Muchas gracias por tu tiempo y por habernos respondido. Te deseamos mucha suerte, y si en algún " +
  "momento necesitás asesoramiento legal, sabés que podés contar con nosotros. ¡Que sigas muy bien!";

const MSG_OPCION_INVALIDA =
  "No pude identificar tu respuesta 🙏 Por favor, respondé solamente con el número de la opción.";

const OPCIONES_PREGUNTA_1 = [
  "Menos de 6 meses",
  "Entre 6 meses y 1 año",
  "Entre 1 y 2 años",
  "Más de 2 años",
];

const OPCIONES_PREGUNTA_2 = ["En el lugar de trabajo", "En el camino al trabajo", "Volviendo del trabajo"];

function parseOpcion(body: string, max: number): number | null {
  const match = body.trim().match(/(\d+)/);
  if (!match) return null;
  const n = Number(match[1]);
  if (n < 1 || n > max) return null;
  return n;
}

function firstName(fullName: string | null): string {
  if (!fullName) return "";
  return fullName.trim().split(/\s+/)[0];
}

async function send(conversationId: string, body: string) {
  await sendOutboundMessage({ conversationId, senderType: "agente_ia", body });
}

async function guardarDato(contactId: string, key: string, value: string) {
  const supabase = createAdminClient();
  const { data: contact } = await supabase
    .from("contacts")
    .select("qualification_data")
    .eq("id", contactId)
    .single();
  const merged = { ...(contact?.qualification_data ?? {}), [key]: value };
  await supabase.from("contacts").update({ qualification_data: merged }).eq("id", contactId);
}

export async function handleIntakeFlow({
  conversationId,
  contactId,
  fullName,
  intakeStep,
  body,
  isButtonClick,
}: {
  conversationId: string;
  contactId: string;
  fullName: string | null;
  intakeStep: string | null;
  body: string;
  /** true si el mensaje entrante es un click real a un botón de plantilla
   * (message.type === "button" en el webhook), no texto libre. */
  isButtonClick: boolean;
}): Promise<boolean> {
  const supabase = createAdminClient();
  const normalized = normalize(body);

  // Los botones de la plantilla de campaña (RE)ARRANCAN el cuestionario
  // siempre que se toquen, sin importar en qué paso haya quedado
  // `intake_step` de una vuelta anterior. Esto es necesario porque el mismo
  // contacto/número puede recibir más de una campaña con el tiempo (o
  // usarse para reprobar), y siempre reutiliza la MISMA conversación — antes
  // este chequeo pedía además `!intakeStep`, así que si una vez ya se había
  // completado el cuestionario (o marcado "resuelto"), tocar el botón de
  // nuevo en una campaña posterior no hacía absolutamente nada: no
  // matcheaba ninguna rama de acá (porque intakeStep ya no era null) y
  // tampoco pasaba al agente IA (porque `ai_enabled` había quedado en
  // false). Por eso se chequea `isButtonClick` en vez de `!intakeStep`, y
  // solo con mensajes de tipo "button" real — así un texto libre que
  // casualmente contenga las mismas palabras no dispara el cuestionario por
  // error.
  if (isButtonClick && esBotonPendiente(normalized)) {
    await send(conversationId, MSG_INTRO);
    await send(conversationId, MSG_PREGUNTA_1);
    await supabase
      .from("conversations")
      .update({ intake_step: "pregunta_1", status: "en_conversacion", ai_enabled: true })
      .eq("id", conversationId);
    return true;
  }

  // Rama "ya está resuelto": se agradece y se cierra, sin arrancar el cuestionario.
  if (isButtonClick && esBotonResuelto(normalized)) {
    await send(conversationId, MSG_RESUELTO);
    await supabase
      .from("conversations")
      .update({ intake_step: "resuelto", status: "cerrado_perdido", ai_enabled: false })
      .eq("id", conversationId);
    await supabase.from("contacts").update({ status: "no_califica" }).eq("id", contactId);
    return true;
  }

  if (intakeStep === "pregunta_1") {
    const n = parseOpcion(body, 4);
    if (!n) {
      await send(conversationId, MSG_OPCION_INVALIDA);
      await send(conversationId, MSG_PREGUNTA_1);
      return true;
    }
    await guardarDato(contactId, "tiempo_desde_accidente", OPCIONES_PREGUNTA_1[n - 1]);
    await send(conversationId, MSG_PREGUNTA_2);
    await supabase.from("conversations").update({ intake_step: "pregunta_2" }).eq("id", conversationId);
    return true;
  }

  if (intakeStep === "pregunta_2") {
    const n = parseOpcion(body, 3);
    if (!n) {
      await send(conversationId, MSG_OPCION_INVALIDA);
      await send(conversationId, MSG_PREGUNTA_2);
      return true;
    }
    await guardarDato(contactId, "lugar_del_accidente", OPCIONES_PREGUNTA_2[n - 1]);
    await send(conversationId, MSG_PREGUNTA_3);
    await supabase.from("conversations").update({ intake_step: "pregunta_3" }).eq("id", conversationId);
    return true;
  }

  if (intakeStep === "pregunta_3") {
    await guardarDato(contactId, "lesion_o_problema_de_salud", body.trim());
    await send(conversationId, MSG_PREGUNTA_4);
    await supabase.from("conversations").update({ intake_step: "pregunta_4" }).eq("id", conversationId);
    return true;
  }

  if (intakeStep === "pregunta_4") {
    await guardarDato(contactId, "disponibilidad_para_reunion", body.trim());
    const nombre = firstName(fullName);
    const cierre = nombre
      ? `¡Perfecto ${nombre}, un profesional se va a estar contactando con vos brevemente!`
      : "¡Perfecto, un profesional se va a estar contactando con vos brevemente!";
    await send(conversationId, cierre);
    await supabase
      .from("conversations")
      .update({ intake_step: "completado", status: "requiere_atencion_humana", ai_enabled: false })
      .eq("id", conversationId);
    await supabase.from("contacts").update({ status: "calificado" }).eq("id", contactId);

    // Avisarle al estudio que hay un caso nuevo, calificado y con toda la
    // info del cuestionario, listo para que un profesional se contacte.
    // Antes esto no se hacía: el cuestionario se completaba pero nunca
    // salía ningún aviso.
    try {
      await notifyAdminOfQualifiedIntake(contactId);
    } catch (err) {
      console.error("No se pudo notificar al administrador del caso calificado:", err);
    }

    return true;
  }

  return false;
}
