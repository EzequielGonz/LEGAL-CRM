/**
 * Etapa 3 · Brief de marca y generador de piezas (contenido para Instagram,
 * Facebook y landing). Puro: produce texto y una imagen SVG a partir del
 * brief aprobado y de los hechos autorizados; nada se publica desde acá.
 * Cada pieza pasa después por `evaluarPieza` (política por canal) y entra
 * en la cola como «lista» o «retenida» con su motivo.
 *
 * Reglas (cap. 20–21 del Word, R07): sin precios, plazos, resultados ni
 * testimonios inventados; sin afirmar «mejor», «garantizado» o «líder»; el
 * CTA sale de la política del canal; el logo y los colores vienen del brief
 * (si faltan, se marca «brief incompleto» y la pieza queda retenida).
 */

import type { Canal, Formato, PiezaContenido } from "@/lib/contenido/politica";

export interface BriefMarca {
  rubro: "juridico" | "coberturas_medicas" | "agencia_0km" | "marketing";
  nombre_publico: string | null;
  logo_ref: string | null;
  colores: { primario?: string; secundario?: string; texto?: string };
  servicios: string[];
  publico: string | null;
  zonas: string | null;
  tono: string | null;
  contacto: { whatsapp?: string; web?: string; direccion?: string };
  objetivos: string | null;
  afirmaciones_autorizadas: string[];
  prohibido: string[];
}

export const CAMPOS_OBLIGATORIOS: (keyof BriefMarca)[] = ["nombre_publico", "servicios", "publico", "tono"];

export function faltantesDelBrief(b: Partial<BriefMarca>): string[] {
  const f: string[] = [];
  if (!b.nombre_publico?.trim()) f.push("nombre público");
  if (!b.servicios?.length) f.push("servicios (al menos uno)");
  if (!b.publico?.trim()) f.push("público al que se habla");
  if (!b.tono?.trim()) f.push("tono");
  if (!b.logo_ref) f.push("logo (se usa un marcador neutro hasta recibirlo)");
  if (!b.colores?.primario) f.push("color primario");
  return f;
}

export function briefCompleto(b: Partial<BriefMarca>): boolean {
  return faltantesDelBrief(b).filter((x) => !x.startsWith("logo") && !x.startsWith("color")).length === 0;
}

/** Pilares editoriales por rubro: sobre qué se habla y qué nunca se afirma. */
export const PILARES: Record<BriefMarca["rubro"], { pilar: string; ejemplo: string }[]> = {
  juridico: [
    { pilar: "Orientación general", ejemplo: "Qué documentación conviene guardar después de un accidente de tránsito." },
    { pilar: "Cómo trabajamos", ejemplo: "Primero escuchamos tu caso; un profesional lo revisa antes de cualquier paso." },
    { pilar: "Derechos y plazos en general", ejemplo: "Los plazos dependen de cada caso: consultá antes de que pase el tiempo." },
    { pilar: "Preguntas frecuentes", ejemplo: "¿Se puede consultar por WhatsApp? Sí, y una persona te responde." },
  ],
  coberturas_medicas: [
    { pilar: "Cómo elegir una cobertura", ejemplo: "Tres preguntas antes de cambiar de prepaga: cartilla, zona y grupo familiar." },
    { pilar: "Trámites y requisitos", ejemplo: "Qué datos pedimos para comparar opciones (sin compromiso)." },
    { pilar: "Cómo trabajamos", ejemplo: "Comparamos opciones según tu zona y tu clínica de preferencia." },
    { pilar: "Preguntas frecuentes", ejemplo: "¿Puedo mantener mi médico? Depende de la cartilla: lo revisamos juntos." },
  ],
  agencia_0km: [
    { pilar: "Cómo funciona la compra", ejemplo: "Qué documentación lleva reservar un 0 km (sin cifras)." },
    { pilar: "Modelos y usos", ejemplo: "Auto chico para ciudad o familiar para ruta: qué mirar." },
    { pilar: "Cómo trabajamos", ejemplo: "Un vendedor te explica opciones por mensaje, sin apuro." },
    { pilar: "Preguntas frecuentes", ejemplo: "¿Hay que tener anticipo? Depende del plan: consultá sin compromiso." },
  ],
  marketing: [
    { pilar: "Mejoras concretas en webs", ejemplo: "Tres cosas que alejan consultas desde el celular." },
    { pilar: "Cómo trabajamos", ejemplo: "Revisamos tu web y te mostramos qué cambiar, con ejemplos." },
    { pilar: "Casos genéricos (sin nombres)", ejemplo: "Cuando el botón de contacto se esconde, las consultas bajan." },
    { pilar: "Preguntas frecuentes", ejemplo: "¿Hace falta rehacer todo? Casi nunca: se empieza por lo que más pesa." },
  ],
};

export const PALABRAS_PROHIBIDAS = ["garantiz", "el mejor", "la mejor", "líder", "lider", "100%", "gratis", "sin riesgo", "asegurado", "indemnización de", "cuotas", "$", "promoción", "descuento", "testimonio"];

export function textoProhibido(texto: string, extra: string[] = []): string[] {
  const t = texto.toLowerCase();
  return [...PALABRAS_PROHIBIDAS, ...extra.map((x) => x.toLowerCase())].filter((p) => p && t.includes(p));
}

export interface PiezaGenerada extends PiezaContenido {
  pilar: string;
  motivosRetencion: string[];
  svg: string;
}

function escapar(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function partirLineas(texto: string, max = 28): string[] {
  const palabras = texto.split(/\s+/);
  const lineas: string[] = [];
  let actual = "";
  for (const p of palabras) {
    if ((actual + " " + p).trim().length > max) {
      if (actual) lineas.push(actual.trim());
      actual = p;
    } else actual = `${actual} ${p}`;
  }
  if (actual.trim()) lineas.push(actual.trim());
  return lineas.slice(0, 5);
}

/** Imagen cuadrada (1080×1080) con el titular, el nombre público y el logo o un marcador neutro. */
export function disenoSvg(input: { titular: string; marca: string; colores: BriefMarca["colores"]; logoRef: string | null; pie?: string }): string {
  const primario = /^#[0-9a-f]{6}$/i.test(input.colores.primario ?? "") ? input.colores.primario! : "#1f2937";
  const textoColor = /^#[0-9a-f]{6}$/i.test(input.colores.texto ?? "") ? input.colores.texto! : "#ffffff";
  const lineas = partirLineas(input.titular);
  const logo = input.logoRef && /^https?:\/\//.test(input.logoRef)
    ? `<image href="${escapar(input.logoRef)}" x="80" y="80" width="160" height="160" preserveAspectRatio="xMidYMid meet"/>`
    : `<rect x="80" y="80" width="160" height="160" rx="24" fill="${textoColor}" fill-opacity="0.15"/><text x="160" y="172" font-family="sans-serif" font-size="28" fill="${textoColor}" text-anchor="middle">logo</text>`;
  const textos = lineas.map((l, i) => `<text x="80" y="${440 + i * 86}" font-family="sans-serif" font-size="68" font-weight="700" fill="${textoColor}">${escapar(l)}</text>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><rect width="1080" height="1080" fill="${primario}"/>${logo}${textos}<text x="80" y="960" font-family="sans-serif" font-size="34" fill="${textoColor}" fill-opacity="0.9">${escapar(input.marca)}</text>${input.pie ? `<text x="80" y="1010" font-family="sans-serif" font-size="26" fill="${textoColor}" fill-opacity="0.75">${escapar(input.pie)}</text>` : ""}</svg>`;
}

/**
 * Genera una pieza a partir del brief y un pilar. Determinista: misma entrada,
 * misma salida. Usa solo afirmaciones autorizadas del brief; el resto del
 * texto es orientación general sin cifras ni promesas.
 */
export function generarPieza(input: { brief: BriefMarca; canal: Canal; formato?: Formato; indicePilar: number; cta?: { tipo: string; url: string } | null; fecha?: string }): PiezaGenerada {
  const { brief, canal } = input;
  const pilares = PILARES[brief.rubro];
  const p = pilares[((input.indicePilar % pilares.length) + pilares.length) % pilares.length];
  const marca = brief.nombre_publico?.trim() || "Marca sin nombre";
  const motivos: string[] = [];
  const faltan = faltantesDelBrief(brief);
  if (!briefCompleto(brief)) motivos.push(`brief incompleto: ${faltan.join(", ")}`);
  const afirmacion = brief.afirmaciones_autorizadas[input.indicePilar % Math.max(1, brief.afirmaciones_autorizadas.length)] ?? null;
  const titular = p.ejemplo.replace(/\.$/, "");
  const cuerpo = [
    titular + ".",
    afirmacion ? afirmacion.replace(/\.$/, "") + "." : `En ${marca} ${brief.servicios[0] ? `trabajamos con ${brief.servicios[0].toLowerCase()}` : "te orientamos"}${brief.zonas ? ` en ${brief.zonas}` : ""}.`,
    input.cta ? `${ctaTexto(input.cta.tipo)}` : "Consultá sin compromiso: una persona te responde.",
  ].join("\n\n");
  const hashtags = canal === "instagram" ? `\n\n#${brief.rubro.replace(/_/g, "")} #${marca.replace(/[^a-záéíóúñ0-9]/gi, "").toLowerCase() || "marca"}` : "";
  const texto = cuerpo + hashtags;
  const prohibidas = textoProhibido(texto, brief.prohibido);
  if (prohibidas.length) motivos.push(`texto con frases no autorizadas: ${prohibidas.join(", ")}`);
  const svg = disenoSvg({ titular, marca, colores: brief.colores, logoRef: brief.logo_ref, pie: brief.contacto?.web ?? undefined });
  return {
    canal,
    formato: input.formato ?? (canal === "landing" ? "articulo" : "post"),
    titulo: titular,
    texto,
    cta_url: input.cta?.url ?? null,
    media: [{ tipo: "imagen", ref: `svg:${Buffer.from(svg).toString("base64").slice(0, 24)}`, alt: titular }],
    afirmaciones: afirmacion ? [{ texto: afirmacion, evidencia: "brief aprobado por la responsable" }] : [],
    pilar: p.pilar,
    motivosRetencion: motivos,
    svg,
  };
}

function ctaTexto(tipo: string): string {
  switch (tipo) {
    case "whatsapp": return "Escribinos por WhatsApp y te orientamos.";
    case "web": return "Más información en nuestra web.";
    case "turno": return "Pedí tu consulta y coordinamos un horario.";
    default: return "Consultá sin compromiso: una persona te responde.";
  }
}

/** Calendario editorial: N piezas por canal, en días y horas fijos, sin fines de semana por defecto. */
export function planCalendario(input: { desde: Date; semanas: number; canales: Canal[]; porSemana: number; hora?: number }): { canal: Canal; fecha: string; indicePilar: number }[] {
  const out: { canal: Canal; fecha: string; indicePilar: number }[] = [];
  const dias = [1, 3, 5].slice(0, Math.max(1, Math.min(3, input.porSemana)));
  let idx = 0;
  for (let w = 0; w < input.semanas; w++) {
    for (const d of dias) {
      const base = new Date(input.desde);
      base.setUTCDate(base.getUTCDate() + w * 7 + ((d - base.getUTCDay() + 7) % 7));
      base.setUTCHours((input.hora ?? 11) + 3, 0, 0, 0); // hora Argentina → UTC
      for (const canal of input.canales) out.push({ canal, fecha: base.toISOString(), indicePilar: idx });
      idx++;
    }
  }
  return out;
}
