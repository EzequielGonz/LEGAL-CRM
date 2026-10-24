/**
 * Plantillas y botones en el historial del bot (24/10, aprobado por la
 * responsable). Puro: sin datos de personas ni acceso a la base.
 *
 * Antes el bot veía cada plantilla como «[Plantilla de campaña …] Primer
 * contacto automático…»: no sabía qué le preguntamos ni qué botones tenía,
 * y un «Ahora no» le llegaba suelto. Ahora:
 *  - la plantilla se muestra con su texto real y sus botones;
 *  - la respuesta con botón se marca como tal;
 *  - cada botón se clasifica por lo que dice (sirve para cualquier plantilla,
 *    también las que se carguen después) y el bot recibe la instrucción de
 *    ese caso.
 */

export interface AnalisisPlantilla {
  bodyText?: string | null;
  buttons?: { text?: string | null; type?: string | null }[] | null;
}

/** Texto de la plantilla con sus botones, como lo vio la persona. Las variables sin dato quedan como «…». Pura. */
export function textoDePlantilla(a: AnalisisPlantilla | null | undefined): string | null {
  const cuerpo = (a?.bodyText ?? "").replace(/\{\{\s*[\w.]+\s*\}\}/g, "…").trim();
  if (!cuerpo) return null;
  const botones = (a?.buttons ?? []).map((b) => (b?.text ?? "").trim()).filter(Boolean);
  return botones.length ? `${cuerpo}\nBotones: ${botones.map((b) => `«${b}»`).join(" / ")}` : cuerpo;
}

/** Cómo se ve en el historial del bot un mensaje de plantilla que mandamos. Pura. */
export function bloquePlantillaEnviada(texto: string): string {
  return `[Le mandamos esta plantilla de WhatsApp. Es lo que la persona leyó:]\n${texto}`;
}

/** Cómo se ve en el historial una respuesta tocando un botón. Pura. */
export function bloqueBoton(texto: string): string {
  return `«${texto}» (tocó este botón de la plantilla)`;
}

export type ClaseRespuesta = "baja" | "reprogramar" | "posterga" | "resuelto" | "rechaza" | "acepta" | "otro";

const normalizar = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[¡!¿?.,;:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Clasifica la respuesta (botón o texto corto) por lo que dice. Pura.
 * El orden importa: primero la baja, después reprogramar, posterga,
 * resuelto, rechazo y aceptación.
 */
export function clasificarRespuesta(texto: string): ClaseRespuesta {
  const t = normalizar(texto);
  if (!t) return "otro";
  if (/\b(no me escrib\w*|no escrib\w* mas|dejen de escrib\w*|no me (contacten|molesten|llamen)|dar(me)? de baja|darme de baja|de baja)\b/.test(t)) return "baja";
  if (/\b(otro horario|otro dia|cambiar (el )?horario|reprogram\w*)\b/.test(t) && !/^no\b/.test(t)) return "reprogramar";
  if (/^(ahora no|no por ahora|por ahora no|ahora no puedo|ahora estoy ocupad[oa]|estoy ocupad[oa])\b/.test(t) || /\b(mas adelante|en otro momento|otro momento|despues (lo veo|te escribo|hablamos|te aviso)|ahora no puedo|no tengo tiempo (ahora)?)\b/.test(t)) return "posterga";
  if (/\b(ya compre|ya lo compre|ya lo resolvi|ya (esta|quedo) resuelto|mi caso ya esta resuelto|ya lo arregle|ya cobre|ya contrate|ya tengo)\b/.test(t) || /^ya no\b/.test(t)) return "resuelto";
  if (/^(no gracias|no$|no me interesa|no nos interesa|no quiero|no estoy interesad[oa])/.test(t)) return "rechaza";
  if (/^(si\b|dale\b|me interesa|nos interesa|quiero|contame|cuentenme|cuentame|sigue pendiente|sigo|todavia|mi caso esta pendiente|perfecto|ok\b|de una)/.test(t)) return "acepta";
  return "otro";
}

/** Instrucción del sistema para la respuesta con botón (o texto equivalente). Pura. */
export function instruccionRespuesta(clase: ClaseRespuesta, texto: string, esBoton: boolean): string {
  const que = esBoton ? `La persona tocó el botón «${texto}» de la plantilla que le mandamos.` : `La persona respondió «${texto}».`;
  switch (clase) {
    case "baja":
      return `${que} Pidió no recibir más mensajes: usá detener_contacto con el motivo que corresponda y respondé SOLO una disculpa breve (por ejemplo «Disculpá la molestia, no te vamos a escribir más. Que tengas un buen día.»). No insistas ni ofrezcas nada.`;
    case "posterga":
      return `${que} Es un «ahora no»: NO insistas, no preguntes qué día u horario le queda mejor y no ofrezcas mandarle nada. Respondé UNA sola vez, corto y cálido, que no hay problema y que quedás a disposición por acá cuando quiera retomarlo. No prometas volver a escribirle.`;
    case "reprogramar":
      return `${que} Quiere otro momento: preguntale qué día y horario le queda mejor y seguí desde ahí.`;
    case "resuelto":
      return `${que} Dice que ya lo resolvió o ya no lo necesita: seguí la regla del sistema sobre insistir (UNA sola vez, breve y con algo útil); si vuelve a decir que no, usá detener_contacto y despedite con una disculpa breve.`;
    case "rechaza":
      return `${que} Es un «no, gracias»: seguí la regla del sistema sobre insistir (UNA sola vez, breve y con algo útil); si vuelve a decir que no, usá detener_contacto y despedite con una disculpa breve.`;
    case "acepta":
      return `${que} Respondió que sí a la pregunta de la plantilla: agradecé en una frase y seguí con tu guion desde ahí (no repitas la pregunta de la plantilla).`;
    default:
      return esBoton ? `${que} Interpretalo según el texto de la plantilla y del botón, y respondé a eso.` : "";
  }
}

export interface FilaHistorial {
  direction: string;
  body: string | null;
  metadata?: Record<string, any> | null;
}

/** Referencia a la plantilla de un mensaje saliente (id o nombre), si la tiene. Pura. */
export function refPlantilla(f: FilaHistorial): { id: string | null; nombre: string | null } | null {
  if (f.direction !== "saliente") return null;
  const m = f.metadata ?? {};
  const id = typeof m.template_id === "string" ? m.template_id : null;
  const nombre = typeof m.template === "string" ? m.template : typeof m.plantilla === "string" ? m.plantilla : null;
  return id || nombre ? { id, nombre } : null;
}

export interface UltimaRespuesta {
  texto: string;
  esBoton: boolean;
  /** el mensaje anterior nuestro fue una plantilla */
  aPlantilla: boolean;
  clase: ClaseRespuesta;
}

/**
 * Reemplaza en el historial los mensajes de plantilla por su texto real y
 * marca las respuestas con botón. Devuelve además la última respuesta de la
 * persona clasificada. Pura (las plantillas vienen ya leídas).
 */
export function prepararHistorial<T extends FilaHistorial>(
  filas: T[],
  plantillaDe: (ref: { id: string | null; nombre: string | null }) => AnalisisPlantilla | null
): { filas: T[]; ultima: UltimaRespuesta | null } {
  const salida = filas.map((f) => {
    const ref = refPlantilla(f);
    if (ref) {
      const texto = textoDePlantilla(plantillaDe(ref));
      if (texto) return { ...f, body: bloquePlantillaEnviada(texto) };
      return f;
    }
    if (f.direction === "entrante" && f.metadata?.provider_type === "button" && f.body) {
      return { ...f, body: bloqueBoton(f.body) };
    }
    return f;
  });
  let ultima: UltimaRespuesta | null = null;
  for (let i = filas.length - 1; i >= 0; i--) {
    const f = filas[i];
    if (f.direction !== "entrante" || !f.body) continue;
    const anterior = filas.slice(0, i).reverse().find((x) => x.direction === "saliente");
    ultima = {
      texto: f.body,
      esBoton: f.metadata?.provider_type === "button",
      aPlantilla: !!anterior && !!refPlantilla(anterior),
      clase: clasificarRespuesta(f.body),
    };
    break;
  }
  return { filas: salida, ultima };
}

/**
 * Instrucción para la última respuesta, si corresponde. Con botón siempre;
 * con texto, solo si responde a una plantilla y es una baja o un «ahora no»
 * (lo demás lo resuelven las reglas generales). Pura.
 */
export function instruccionUltimaRespuesta(u: UltimaRespuesta | null): string {
  if (!u) return "";
  if (u.esBoton) return instruccionRespuesta(u.clase, u.texto, true);
  if (u.aPlantilla && (u.clase === "baja" || u.clase === "posterga")) return instruccionRespuesta(u.clase, u.texto, false);
  return "";
}

/** Si la última respuesta es un «ahora no», no corresponde recontactar. Pura. */
export function esPostergaFirme(u: UltimaRespuesta | null): boolean {
  return !!u && u.clase === "posterga" && (u.esBoton || u.aPlantilla);
}
