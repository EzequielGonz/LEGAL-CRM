/**
 * Respuestas automáticas de otros negocios y pedidos sobre los datos (24/10,
 * decisión de la responsable). Puro: sin base ni red.
 *
 * - Un contestador automático (mensaje de ausencia, menú «escribí 1 para…»,
 *   «gracias por comunicarte, te respondemos a la brevedad») no es una
 *   persona: el bot no le responde, no usa herramientas, no deriva a una
 *   persona y no guarda datos. Cuando escriba una persona real, responde.
 * - Tope de bucle: si en el chat ya hubo varias respuestas inmediatas a lo
 *   que manda el bot, o el mismo mensaje largo se repite, se corta.
 * - «¿De dónde sacaron mi número?» o «borren mis datos»: disculpa automática,
 *   sin explicar el origen (el agente es asesor y no tiene ese dato), y se
 *   detiene el contacto. El origen lo atiende el equipo de marketing.
 */

/** Disculpa fija para quien pregunta por el origen de sus datos o pide la baja. */
export const TEXTO_DISCULPA_DATOS =
  "Te pido disculpas por la molestia. Desde acá no tengo el detalle de cómo nos llegó tu contacto, pero ya registré tu pedido y no te vamos a volver a escribir. ¡Que tengas un buen día!";

function normalizar(t: string): string {
  return (t ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const SENALES_AUTOMATICO: RegExp[] = [
  /\b(?:mensaje|respuesta|contestacion)\s+automatic[ao]\b/,
  /\bgracias por (?:comunicarte|comunicarse|contactarte|contactarse|contactarnos|escribirnos|escribir|tu mensaje|su mensaje|tu consulta|su consulta)\b[^]{0,160}\b(?:en breve|a la brevedad|lo antes posible|pronto|responderemos|te respondemos|le respondemos|te contestamos|le contestamos|te contestaremos|nos pondremos en contacto|te atenderemos|le atenderemos|un representante|un asesor te|te vamos a responder)\b/,
  /\b(?:en este momento|ahora|por el momento) no (?:podemos|estamos|nos encontramos)\b[^]{0,80}\b(?:atender\w*|responder\w*|contestar\w*|disponibles?)/,
  /\b(?:estamos|nos encontramos) (?:fuera (?:del|de) horario|cerrados)\b/,
  /\bnuestro horario de atencion (?:es|son)\b/,
  /\b(?:escribi|escriba|envia|envie|responde|responda|marca|marque|presiona|presione|selecciona|seleccione|elegi|elija|digita|digite)\b[^]{0,25}\b(?:la opcion |el numero |el )?\d\b[^]{0,10}\bpara\b/,
  /\bseleccione una opcion\b|\belegi una (?:de las siguientes )?opcion(?:es)?\b|\bmenu principal\b/,
];

/** ¿El mensaje parece un contestador automático y no una persona? Pura. */
export function esRespuestaAutomatica(texto: string | null | undefined): boolean {
  const t = normalizar(texto ?? "");
  if (!t) return false;
  if (SENALES_AUTOMATICO.some((re) => re.test(t))) return true;
  // Menú numerado: tres o más opciones en líneas que empiezan con número o emoji de número.
  const opciones = (texto ?? "").split(/\n/).filter((l) => /^\s*(?:\d{1,2}\s*[).:\-–]|[0-9]️?⃣)/.test(l));
  return opciones.length >= 3;
}

export interface MensajeHistorial {
  direction: string;
  sender_type?: string | null;
  body: string | null;
  created_at: string;
}

/** Ventana y umbrales del tope de bucle. */
export const TOPE_BUCLE = { ventanaMin: 15, respuestaInmediataSeg: 10, inmediatasMax: 3, largoRepetido: 40 };

export type MotivoSinRespuesta = "respuesta_automatica" | "bucle_automatico";

export const TEXTO_SIN_RESPUESTA: Record<MotivoSinRespuesta, string> = {
  respuesta_automatica: "Respuesta automática de otro negocio: el bot no responde ni usa herramientas (regla 24/10).",
  bucle_automatico: "Bucle con un contestador automático: se cortó la conversación del bot (regla 24/10).",
};

/**
 * Decide si el bot NO debe responder porque del otro lado hay un contestador.
 * `historial` ordenado de más viejo a más nuevo. Pura.
 */
export function motivoParaNoResponder(historial: MensajeHistorial[], ahora: Date): MotivoSinRespuesta | null {
  if (!historial.length) return null;
  // Lo que llegó desde la última salida (lo que habría que responder ahora).
  let i = historial.length - 1;
  const pendientes: MensajeHistorial[] = [];
  while (i >= 0 && historial[i].direction === "entrante") {
    pendientes.unshift(historial[i]);
    i--;
  }
  if (!pendientes.length) return null;

  // 1) Bucle: el mismo mensaje largo ya había llegado antes (los contestadores se repiten).
  const anteriores = historial.slice(0, i + 1).filter((m) => m.direction === "entrante").map((m) => normalizar(m.body ?? ""));
  if (pendientes.some((p) => {
    const t = normalizar(p.body ?? "");
    return t.length >= TOPE_BUCLE.largoRepetido && anteriores.includes(t);
  })) return "bucle_automatico";

  // 2) Bucle: varias respuestas instantáneas a lo que mandó el bot en poco tiempo.
  const desde = ahora.getTime() - TOPE_BUCLE.ventanaMin * 60_000;
  let inmediatas = 0;
  for (let k = 1; k < historial.length; k++) {
    const prev = historial[k - 1];
    const cur = historial[k];
    if (Date.parse(cur.created_at) < desde) continue;
    if (prev.direction === "saliente" && (prev.sender_type ?? "agente_ia") === "agente_ia" && cur.direction === "entrante") {
      const seg = (Date.parse(cur.created_at) - Date.parse(prev.created_at)) / 1000;
      if (seg >= 0 && seg <= TOPE_BUCLE.respuestaInmediataSeg) inmediatas++;
    }
  }
  if (inmediatas >= TOPE_BUCLE.inmediatasMax) return "bucle_automatico";

  // 3) Todo lo pendiente es de un contestador.
  if (pendientes.every((p) => esRespuestaAutomatica(p.body))) return "respuesta_automatica";
  return null;
}

const ORIGEN_DATOS: RegExp[] = [
  /\bde donde (?:sacaron|sacaste|sacan|sacas|tienen|tenes|obtuvieron|obtuviste|consiguieron|conseguiste|salio|saco|sale)\b[^?.!]{0,30}\b(?:mi|mis|el|este|los)\s+(?:numero|celular|cel|telefono|contacto|datos?|whats(?:app)?|wsp)\b/,
  /\bde donde (?:sacaron|sacaste|tienen|tenes|obtuvieron|consiguieron)\s+(?:mi|mis)\b/,
  /\bquien (?:les|te|le) (?:dio|paso|facilito)\s+(?:mi|mis|el|este)\s+(?:numero|celular|cel|telefono|contacto|datos?)\b/,
  /\bcomo (?:consiguieron|conseguiste|obtuvieron|obtuviste|sacaron|sacaste|tienen|tenes)\s+(?:mi|mis|este)\s+(?:numero|celular|cel|telefono|contacto|datos?)\b/,
];

const BAJA_DATOS: RegExp[] = [
  /\b(?:borr|elimin|sac|quit|suprim)(?:en|a|e|ame|enme|eme|alo|enlo)?\b[^?.!]{0,15}\b(?:mi|mis|este|el)\s+(?:numero|celular|cel|telefono|contacto|datos?)\b/,
  /\b(?:borrame|borrenme|eliminame|eliminenme|sacame|saquenme|quitenme|quitame)\b[^?.!]{0,20}\b(?:lista|base|registro|sistema|datos)\b/,
  /\b(?:den|dame|denme|darme|me dan|me den|quiero darme)\s+de baja\b/,
];

/** ¿Pregunta de dónde salieron sus datos o pide borrarlos o darse de baja? Pura. */
export function pideOrigenOBajaDeDatos(texto: string | null | undefined): "origen" | "baja" | null {
  const t = normalizar(texto ?? "");
  if (!t) return null;
  if (ORIGEN_DATOS.some((re) => re.test(t))) return "origen";
  if (BAJA_DATOS.some((re) => re.test(t))) return "baja";
  return null;
}
