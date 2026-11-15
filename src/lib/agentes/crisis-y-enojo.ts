/**
 * Crisis, enojo y amenaza (15/11, decisiones de la responsable). Reglas fijas,
 * sin depender del modelo:
 * - Crisis (la persona habla de quitarse la vida o de hacerse daño): se le
 *   mandan las líneas de ayuda, el bot deja de venderle y aparece un cartel de
 *   urgencia en el panel.
 * - Enojo dirigido a nosotros: disculpa breve y se corta (detención).
 * - Amenaza o denuncia: disculpa breve, se corta y se avisa (incidencia).
 * Funciones puras.
 */

function normalizar(t: unknown): string {
  return String(t ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// «Me quiero morir de risa / de vergüenza / con los precios» no es una crisis.
const NO_LITERAL = "(?! de (?:risa|verguenza|amor|calor|frio|hambre|sueno|ganas|aburrimiento|envidia|la risa))(?! con (?:los|las|el|la|este|esta|esos|esas) )";

const SENALES_CRISIS: RegExp[] = [
  /\bsuicid\w*/,
  /\bme (?:voy a|quiero) (?:quitar|sacar) la vida\b/,
  /\b(?:matarme|quitarme la vida|sacarme la vida|terminar con mi vida|acabar con mi vida|terminar con mi existencia)\b/,
  new RegExp(`\\bme (?:voy a|quiero|quisiera|kiero) (?:matar|morir|desaparecer para siempre)\\b${NO_LITERAL}`),
  /\bno (?:quiero|tengo ganas de|aguanto) (?:vivir|seguir viviendo|seguir con vida|estar vivo|estar viva)\b/,
  /\bpienso en (?:morir|matarme|morirme|quitarme|suicid\w*)\b/,
  /\b(?:cortarme las venas|lastimarme a proposito|autolesion\w*|hacerme dano a proposito)\b/,
  /\b(?:ya )?no le encuentro sentido a (?:la|mi) vida\b/,
  /\bseria mejor (?:estar muerto|estar muerta|morirme|no estar)\b/,
];

/** ¿El mensaje habla de quitarse la vida o de hacerse daño? Ante la duda, sí. Pura. */
export function esCrisis(texto: unknown): boolean {
  const t = normalizar(texto);
  if (!t) return false;
  return SENALES_CRISIS.some((re) => re.test(t));
}

/**
 * Texto fijo con las líneas de ayuda. Números confirmados el 15/11 con el
 * Centro de Asistencia al Suicida (135 desde CABA y GBA; 0800 345 1435 y
 * (011) 5275-1135 desde todo el país) y el 911. Sin negritas: WhatsApp no
 * muestra el formato de Markdown.
 */
export const TEXTO_CRISIS = [
  "Lamento mucho que estés pasando por esto. No tenés que atravesarlo en soledad: hay personas preparadas para escucharte ahora mismo, gratis y de forma confidencial.",
  "",
  "• Centro de Asistencia al Suicida: 135 (desde CABA y Gran Buenos Aires), o 0800 345 1435 y (011) 5275-1135 desde todo el país.",
  "• Si estás en peligro ahora, llamá al 911 o acercate a la guardia más cercana.",
  "",
  "Por favor, comunicate con alguna de estas líneas o con alguien de confianza.",
].join("\n");

const ENOJO: RegExp[] = [
  /\b(?:dejen|deja|deje|dejate|dejense) de (?:joder|molestar|escribir|escribirme|mandar|mandarme|romper|hinchar|llenarme)\b/,
  /\bno (?:me )?(?:jodan|molesten|rompan|hinchen|jodas|molestes)\b/,
  /\bbasta de (?:mensajes|escribir|escribirme|molestar|joder|mandar)\b/,
  /\bustedes son (?:unos |unas )?(?:pesad|forr|pelotud|bolud|chant|estafador|chorr|ladron|idiota|imbecil|mentiros)\w*/,
  /^(?:son|sos) (?:unos |unas |un |una )?(?:pesad|forr|pelotud|bolud|chant|estafador|chorr|ladron|idiota|imbecil|mentiros)\w*/,
  /\bme (?:tienen|tenes) (?:re )?(?:podrid|hart|cansad|las bolas llenas)\w*/,
  /\b(?:hdp|hijos? de (?:re)?puta|la concha de (?:tu|su|la) madre|andate a la mierda|vayanse a la mierda|metanse (?:el|los) )/,
  /\b(?:que|son re|son muy) pesad(?:o|a|os|as)\b(?! (?:el|la|los|las) )/,
  /\bdejen de mandarme (?:spam|mensajes)\b|\besto es spam\b|\bson spam\b/,
];

/** ¿Es enojo dirigido a quien le escribe (no el enojo con su ART, su jefe o su prepaga)? Pura. */
export function esEnojoConNosotros(texto: unknown): boolean {
  const t = normalizar(texto);
  if (!t) return false;
  return ENOJO.some((re) => re.test(t));
}

/** Disculpa breve ante el enojo (después se corta). */
export const TEXTO_DISCULPA_ENOJO = "Disculpá la molestia, no te vamos a escribir más. Que tengas un buen día.";

/** Disculpa breve ante una amenaza o denuncia (después se corta y se avisa al equipo). */
export const TEXTO_DISCULPA_AMENAZA = "Disculpá la molestia. Ya registramos tu pedido y no te vamos a volver a escribir.";
