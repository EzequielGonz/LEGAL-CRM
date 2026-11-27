/**
 * Oficina (27/11): qué tipo de trabajo es cada tarea. Decide quién puede
 * hacerla: Gemini hace texto, análisis, investigación y propuestas de
 * configuración (siempre en borrador); el código, las publicaciones y los
 * envíos quedan siempre para Claude (orden del dueño y revisión final del
 * 27/11). En la duda, gana Claude. Puro.
 */

export const CLASES = ["texto", "analisis", "investigacion", "configuracion", "codigo", "publicacion", "envio"] as const;
export type Clase = (typeof CLASES)[number];

export const ETIQUETA_CLASE: Record<Clase, string> = {
  texto: "Texto o borrador",
  analisis: "Análisis",
  investigacion: "Investigación",
  configuracion: "Propuesta de configuración",
  codigo: "Cambio de código",
  publicacion: "Publicación",
  envio: "Envío de mensajes",
};

export function esClase(v: unknown): v is Clase {
  return typeof v === "string" && (CLASES as readonly string[]).includes(v);
}

/** Las que Gemini nunca hace (cambian el panel, publican o le escriben a personas). */
export const SOLO_CLAUDE: readonly Clase[] = ["codigo", "publicacion", "envio"];

// Ojo: en JavaScript «\b» no ve las vocales con tilde como letras; por eso los
// verbos se cortan con (\s|$|signo) y no con «\b».
const FIN = String.raw`(?=\s|$|[.,;:!?)])`;
const PISTAS: [Clase, RegExp][] = [
  ["envio", new RegExp(String.raw`(^|\s)(mand|envi|lanz|dispar)(á|a|ar|ale|ales|alo|ala|alos|alas|ále|áles|álo|ála)${FIN}.*(mensaje|campa[ñn]a|whatsapp|plantilla|prospecto|contacto)`, "i")],
  ["publicacion", new RegExp(String.raw`(^|\s)(public|program)(á|a|ar|alo|ala|alos|alas|álo|ála|álos|álas)${FIN}|(^|\s)sub(í|i|ir)(lo|la|los|las)? (a|en) (instagram|redes|tiktok|facebook|youtube)|metricool`, "i")],
  ["codigo", /c[oó]digo|\bbug\b|migraci[oó]n|\bdeploy|despleg|\bPR\b|pull request|(arregl|cambi|correg)(á|a|ar) (el|la|los|las) (bot[oó]n|botones|pantalla|men[uú]|error|panel)|no (anda|funciona)/i],
  ["investigacion", /investig|busc(á|a|ar) en internet|tendencia|competencia|referencias?/i],
  ["analisis", /analiz|estad[ií]stic|m[eé]tric|informe|reporte|cifra|rendimiento|conversi[oó]n/i],
  ["configuracion", /configur|(ajust|cambi)(á|a|ar) (el|la) (rol|prompt|horario|tope)/i],
];

/** Clase por palabras clave (conservadora: lo que cambia o sale afuera se detecta primero). */
export function claseDePalabras(pedido: string, ruta: readonly string[] = []): Clase {
  for (const [c, re] of PISTAS) if (re.test(pedido)) return c;
  if (ruta.includes("ingenieria")) return "codigo";
  return "texto";
}

/**
 * La clase final de una tarea. Si las palabras dicen que cambia código,
 * publica o envía, eso manda aunque Gemini haya dicho otra cosa (en la
 * duda, gana Claude).
 */
export function claseFinal(deGemini: Clase | null | undefined, pedido: string, ruta: readonly string[] = []): Clase {
  const porPalabras = claseDePalabras(pedido, ruta);
  if (SOLO_CLAUDE.includes(porPalabras)) return porPalabras;
  if (deGemini && esClase(deGemini)) return deGemini;
  return porPalabras;
}

export function puedeGemini(clase: Clase | null | undefined): { ok: true } | { ok: false; motivo: string } {
  if (!clase) return { ok: true };
  if (clase === "codigo") return { ok: false, motivo: "Cambia el código del panel: lo hace Claude." };
  if (clase === "publicacion") return { ok: false, motivo: "Publica o programa en redes: lo hace Claude y lo lanzan ustedes." };
  if (clase === "envio") return { ok: false, motivo: "Manda mensajes o campañas: lo hace Claude y lo lanzan ustedes." };
  return { ok: true };
}
