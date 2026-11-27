/**
 * Textos de pantalla (22/11, rediseño del panel). Funciones puras que pasan
 * nombres internos o cantidades a palabras del dueño. No cambian ningún dato:
 * solo cómo se muestra.
 *
 * Lista del recorrido del 20/11: punto (e) nombres internos en pantalla
 * (`WHATSAPP_*`, motivos de pausa «ad», «domingo») y punto (f) plurales «(s)».
 */

/** «1 campaña», «3 campañas», «0 campañas». Con plural irregular, se pasa aparte. */
export function cantidad(n: number | null | undefined, singular: string, plural?: string): string {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  const palabra = v === 1 ? singular : plural ?? pluralDe(singular);
  return `${v.toLocaleString("es-AR")} ${palabra}`;
}

/** Plural simple en castellano para las palabras que usa el panel. */
export function pluralDe(palabra: string): string {
  // Frases («punto para revisar»): se pluraliza la primera palabra.
  const espacio = palabra.indexOf(" ");
  if (espacio > 0) return `${pluralDe(palabra.slice(0, espacio))}${palabra.slice(espacio)}`;
  if (/[aeiouáéó]$/i.test(palabra)) return `${palabra}s`;
  if (/z$/i.test(palabra)) return `${palabra.slice(0, -1)}ces`;
  if (/ión$/i.test(palabra)) return `${palabra.slice(0, -3)}iones`;
  if (/[íú]$/i.test(palabra)) return `${palabra}es`;
  if (/s$/i.test(palabra)) return palabra;
  return `${palabra}es`;
}

/**
 * Motivo de pausa de una campaña, con palabras claras. El motivo se escribe a
 * mano al pausar y a veces queda una sola palabra («ad», «domingo») que en
 * Hoy y en Campañas se leía como un dato del sistema.
 */
export function motivoPausaLegible(motivo: string | null | undefined): string {
  const m = String(motivo ?? "").trim().replace(/\.+$/, "");
  if (!m) return "pausada a mano, sin motivo anotado";
  if (m === "Pausada desde el panel") return "pausada a mano desde el panel";
  // Una palabra suelta o una nota muy corta: es una nota de quien la pausó.
  if (!/\s/.test(m) && m.length <= 14) return `pausada a mano con la nota «${m}»`;
  return m;
}

/**
 * Nombre de una conexión de WhatsApp oficial a partir de su prefijo interno
 * (`WHATSAPP_AGENCIA_0KM` → «Agencia 0km»). El prefijo real sigue visible solo
 * en las opciones avanzadas.
 */
export function nombreConexion(clave: string | null | undefined): string {
  const limpio = String(clave ?? "")
    .trim()
    .replace(/^WHATSAPP_/i, "")
    .replace(/_+/g, " ")
    .trim();
  if (!limpio) return "sin nombre";
  const bajo = limpio.toLowerCase();
  return bajo.charAt(0).toUpperCase() + bajo.slice(1);
}

export type EstadoLuz = "ok" | "aviso" | "mal" | "info" | "apagado";

/** Pasa los tonos que usa el panel («verde», «rojo»…) al estado de la luz. */
export function estadoDeTono(tono: string | null | undefined): EstadoLuz {
  switch (tono) {
    case "verde":
    case "ok":
      return "ok";
    case "amarillo":
    case "aviso":
      return "aviso";
    case "rojo":
    case "mal":
      return "mal";
    case "azul":
    case "info":
      return "info";
    default:
      return "apagado";
  }
}
