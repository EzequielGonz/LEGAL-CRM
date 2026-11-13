/**
 * Criterio del bot para el seguimiento (13/11, pedido de la responsable):
 * «que no se tenga que activar ni cargar manualmente; el agente que reconozca
 * cuándo hacerlo y cuándo no».
 *
 * El circuito (./circuito) sigue fijando CUÁNDO se podría insistir (plazos,
 * máximo de contactos, horario). Antes de cada contacto 2 o 3, el bot lee la
 * conversación y decide SI corresponde: si la persona ya dijo que no, lo
 * resolvió, tiene quien la atienda, se molestó o nunca mostró interés real,
 * no se insiste y la oportunidad deja de recibir mensajes. Si corresponde y el
 * canal admite texto libre (Wasender), además redacta el mensaje retomando lo
 * que se habló; por Meta sale la plantilla aprobada.
 *
 * Reglas puras, sin dependencias: se prueban solas.
 */

export interface CriterioSeguimiento {
  escribir: boolean;
  motivo: string;
  /** Mensaje redactado por el bot (solo si el canal admite texto libre). */
  texto: string;
}

/** Instrucción interna para el bot antes de un contacto de seguimiento. */
export function instruccionSeguimiento(paso: 2 | 3, horasSinRespuesta: number, textoLibre: boolean): string {
  const dias = Math.max(1, Math.round(horasSinRespuesta / 24));
  const lineas = [
    "[Nota interna del sistema: esto NO lo escribió la persona.]",
    `La persona respondió en su momento y la charla quedó cortada hace unos ${dias} día(s). Toca decidir si se la vuelve a contactar (contacto ${paso} de un máximo de 3).`,
    "Leé toda la conversación y decidí:",
    "- escribir = false si dijo que no le interesa, que ya lo resolvió, que ya tiene abogado, asesor, cobertura, auto o proveedor (y no pidió otra opinión), pidió que no le escriban, se molestó, es un número equivocado o un contestador automático, la charla ya quedó cerrada (ya aceptó el paso siguiente, ya agendó, ya lo atiende una persona) o solo contestó por cortesía sin mostrar interés real.",
    "- escribir = true si mostró interés (contó su situación, preguntó, pidió información o dijo «después», «ahora no puedo», «más tarde») y la charla quedó sin terminar.",
    "Ante la duda entre molestar o perder una consulta con interés real, pesá lo que dijo la persona con sus palabras: una negativa clara manda sobre todo lo demás.",
  ];
  if (textoLibre) {
    lineas.push(
      "Si escribís: español rioplatense, una o dos frases, cálido y sin presión. Retomá lo último concreto que se habló (sin repetirlo textual), no te presentes de nuevo como si fuera el primer mensaje, no inventes datos, plazos, montos ni turnos, y terminá con una sola pregunta fácil de responder."
    );
    if (paso === 3) lineas.push("Es el último contacto: decilo con naturalidad («te escribo por última vez por esto») y dejá la puerta abierta para que escriba cuando quiera. No prometas volver a escribir.");
    lineas.push('Respondé SOLO con JSON: {"escribir": true|false, "motivo": "por qué, en pocas palabras", "texto": "el mensaje para la persona, o vacío si no se escribe"}');
  } else {
    lineas.push('No redactes el mensaje: sale una plantilla aprobada. Respondé SOLO con JSON: {"escribir": true|false, "motivo": "por qué, en pocas palabras"}');
  }
  return lineas.join("\n");
}

/** Lee la respuesta del modelo (JSON, a veces envuelto en ```). Null si no se entiende. */
export function leerCriterio(crudo: string, textoLibre: boolean): CriterioSeguimiento | null {
  const limpio = String(crudo ?? "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  try {
    const j = JSON.parse(limpio);
    if (typeof j !== "object" || j === null || typeof j.escribir !== "boolean") return null;
    const texto = textoLibre && typeof j.texto === "string" ? j.texto.trim().slice(0, 700) : "";
    return { escribir: j.escribir, motivo: typeof j.motivo === "string" ? j.motivo.trim().slice(0, 200) : "", texto };
  } catch {
    return null;
  }
}

/** Motivo que queda en la oportunidad cuando el bot decide no insistir. */
export function motivoNoInsistir(paso: 2 | 3, motivo: string): string {
  const m = motivo.trim().replace(/[.\s]+$/, "");
  return m ? `El bot no insistió (contacto ${paso}): ${m}.` : `El bot no insistió (contacto ${paso}): no vio interés real en la conversación.`;
}

/**
 * La ruta completa, en un solo lugar, para mostrarla en el panel tal cual
 * funciona. Cada paso dice cuándo sale, a quién y cuándo se suelta.
 */
export const RUTA_SEGUIMIENTO = [
  {
    clave: "recontacto",
    titulo: "El mismo día",
    cuando: "A las 2 horas de quedar sin respuesta, y una vez más 2 horas después",
    quien: "Quien venía conversando y dejó de contestar",
    como: "El bot retoma con sus palabras lo último que se habló",
    suelta: "Si dijo que no, pidió «ahora no» o no mostró interés, no escribe",
  },
  {
    clave: "contacto_2",
    titulo: "A los 2 o 3 días",
    cuando: "Entre 48 y 72 horas después del corte, en horario (lunes a sábado de 8 a 21)",
    quien: "Quien respondió alguna vez y la charla quedó sin terminar",
    como: "El bot relee la conversación y decide; si corresponde, escribe una sola vez",
    suelta: "Sin respuesta a este mensaje, no recibe más",
  },
  {
    clave: "contacto_3",
    titulo: "Último intento",
    cuando: "Solo si respondió al anterior y volvió a cortarse, otra vez a los 2 o 3 días",
    quien: "Quien retomó la charla y la dejó de nuevo",
    como: "Un mensaje de despedida que deja la puerta abierta",
    suelta: "Después de este, pasa a «Para recuperar» y no se le escribe más solo",
  },
  {
    clave: "segundo_intento",
    titulo: "Nunca respondió",
    cuando: "Entre 5 y 7 días después del primer mensaje (solo por líneas de Wasender)",
    quien: "Quien recibió la campaña y no contestó nada",
    como: "Un único mensaje más, con otro texto",
    suelta: "Pasados 10 días ya no sale; nunca hay un tercero",
  },
  {
    clave: "descarte",
    titulo: "Cuándo se suelta",
    cuando: "En cuanto la persona lo dice, o a las 6 horas si el bot no lo cerró",
    quien: "Dijo que no le interesa, que ya lo resolvió, que ya tiene quien lo atienda o es un número equivocado",
    como: "Se cierra como perdido con su motivo y sale de Hoy y de los chats activos",
    suelta: "Queda en Chats → Descartados; si vuelve a escribir, el bot la atiende",
  },
] as const;
