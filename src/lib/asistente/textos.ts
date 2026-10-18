/**
 * Generación de textos del asistente (18/10): publicaciones y cambios de
 * instrucciones del bot. Separado del modelo para poder probarlo: recibe un
 * generador de texto y devuelve datos validados. Puro.
 */
import { frasesSensibles, tienePlaceholder } from "@/lib/contenido/politica";
import type { Hueco } from "@/lib/asistente/herramientas";

export type GeneradorTexto = (prompt: string) => Promise<string>;

export interface PiezaGenerada {
  formato: "post" | "historia" | "carrusel";
  titular: string;
  texto: string;
  diapositivas?: string[];
  tema: string;
}

export interface BriefCorto {
  nombre: string;
  servicios: string[];
  publico: string | null;
  zonas: string | null;
  tono: string | null;
  prohibido: string[];
}

const REGLAS = [
  "Español rioplatense con voseo, claro y cercano.",
  "No inventes precios, cuotas, porcentajes, plazos, resultados, testimonios, casos, promociones ni stock.",
  "No uses las palabras precio, cuotas, financiación, promoción, descuento, garantizado, plazo, stock, testimonio ni indemnización.",
  "No prometas resultados ni digas que sos el mejor o líder.",
  "Sin datos por completar, sin corchetes, sin llaves y sin enlaces (el enlace lo agrega el panel).",
  "Como mucho 3 hashtags al final del texto, solo si suman.",
];

export function promptPublicaciones(brief: BriefCorto, huecos: Hueco[], temas: string | null): string {
  const pedido = huecos.map((h, i) => ({ n: i + 1, formato: h.formato, dia: h.dia + 1 }));
  return [
    `Sos el redactor de redes de «${brief.nombre}».`,
    `Servicios: ${brief.servicios.join(", ") || "los del perfil"}. Público: ${brief.publico ?? "general"}. Zona: ${brief.zonas ?? "sin especificar"}. Tono: ${brief.tono ?? "profesional y cercano"}.`,
    brief.prohibido.length ? `Nunca hables de: ${brief.prohibido.join(", ")}.` : "",
    temas ? `Enfoque pedido: ${temas}.` : "Variá los temas: educativos, preguntas frecuentes, cómo trabajamos, señales de que conviene consultar, mitos y verdades.",
    "Reglas:",
    ...REGLAS.map((r) => `- ${r}`),
    "Formatos:",
    "- post: titular (máx. 70 caracteres, va en la imagen) y texto del posteo (300 a 700 caracteres).",
    "- historia: titular corto (máx. 60 caracteres, va en la imagen); el texto es una frase.",
    "- carrusel: titular de portada (máx. 70), 3 a 5 diapositivas (máx. 120 caracteres cada una) y texto del posteo (300 a 700).",
    `Escribí exactamente ${huecos.length} piezas, en este orden: ${JSON.stringify(pedido)}.`,
    'Respondé SOLO un JSON: [{"n":1,"formato":"post","tema":"…","titular":"…","texto":"…","diapositivas":["…"]}]',
  ]
    .filter(Boolean)
    .join("\n");
}

function extraerJson(texto: string): unknown {
  const limpio = texto.replace(/```(?:json)?/g, "").trim();
  const ini = limpio.indexOf("[");
  const fin = limpio.lastIndexOf("]");
  if (ini < 0 || fin < ini) return null;
  try {
    return JSON.parse(limpio.slice(ini, fin + 1));
  } catch {
    return null;
  }
}

const corto = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

/**
 * Valida lo que devolvió el modelo contra los huecos pedidos. Lo que no
 * cumple (vacío, datos por completar, afirmaciones sensibles) se descarta:
 * mejor una pieza menos que una que no se puede publicar.
 */
export function validarPiezas(salida: string, huecos: Hueco[]): { piezas: (PiezaGenerada & { hueco: Hueco })[]; descartadas: number } {
  const crudo = extraerJson(salida);
  const lista = Array.isArray(crudo) ? (crudo as any[]) : [];
  const piezas: (PiezaGenerada & { hueco: Hueco })[] = [];
  let descartadas = 0;
  huecos.forEach((h, i) => {
    const x = lista.find((y) => Number(y?.n) === i + 1) ?? lista[i];
    const titular = corto(x?.titular, 90);
    const texto = typeof x?.texto === "string" ? x.texto.trim().slice(0, 2000) : "";
    const diapositivas = Array.isArray(x?.diapositivas) ? x.diapositivas.map((d: unknown) => corto(d, 140)).filter(Boolean).slice(0, 6) : [];
    const todo = `${titular}\n${texto}\n${diapositivas.join("\n")}`;
    const valida =
      titular.length >= 6 &&
      (h.formato === "historia" || texto.length >= 40) &&
      (h.formato !== "carrusel" || diapositivas.length >= 2) &&
      !tienePlaceholder(todo) &&
      frasesSensibles(todo).length === 0;
    if (!valida) {
      descartadas++;
      return;
    }
    piezas.push({ formato: h.formato, titular, texto: h.formato === "historia" ? texto || titular : texto, diapositivas: h.formato === "carrusel" ? diapositivas : undefined, tema: corto(x?.tema, 60) || "General", hueco: h });
  });
  return { piezas, descartadas };
}

export function promptCambioBot(actual: string, pedido: string): string {
  return [
    "Sos el responsable de las instrucciones de un bot de WhatsApp que atiende prospectos.",
    "Aplicá el cambio pedido a las instrucciones actuales. Conservá todo lo demás: reglas, límites, datos, herramientas y el formato.",
    "No agregues precios, plazos, promesas ni datos que no estén en las instrucciones actuales.",
    `Cambio pedido: ${pedido}`,
    "Instrucciones actuales:",
    "<<<",
    actual,
    ">>>",
    'Respondé SOLO un JSON: {"instrucciones":"…texto completo nuevo…","resumen":"qué cambió, en 1 a 3 frases"}',
  ].join("\n");
}

export function validarCambioBot(salida: string, actual: string): { instrucciones: string; resumen: string } | null {
  const limpio = salida.replace(/```(?:json)?/g, "").trim();
  const ini = limpio.indexOf("{");
  const fin = limpio.lastIndexOf("}");
  if (ini < 0 || fin < ini) return null;
  let x: any;
  try {
    x = JSON.parse(limpio.slice(ini, fin + 1));
  } catch {
    return null;
  }
  const instrucciones = typeof x?.instrucciones === "string" ? x.instrucciones.trim() : "";
  const resumen = typeof x?.resumen === "string" ? x.resumen.trim().slice(0, 600) : "";
  // Un cambio que borra la mayor parte de las instrucciones no se acepta.
  if (instrucciones.length < Math.min(200, actual.length * 0.5) || instrucciones === actual.trim()) return null;
  return { instrucciones: instrucciones.slice(0, 40000), resumen: resumen || "Instrucciones actualizadas según el pedido." };
}
