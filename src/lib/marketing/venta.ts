/**
 * Marketing · reglas puras de Extraer negocios y de la venta consultiva
 * (16/10). Sin base ni red; probadas en tests/unitarias/marketing-venta.test.ts.
 */

export const TODA_ARGENTINA = "Toda Argentina";

/** Las 24 jurisdicciones, para repartir una búsqueda nacional. */
export const PROVINCIAS_AR = [
  "Ciudad Autónoma de Buenos Aires",
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

/** Zonas normalizadas: «Toda Argentina» se reparte en las 24 jurisdicciones; sin repetidos. */
export function zonasDeExtraccion(zonas: string[]): string[] {
  const limpias = zonas.map((z) => z.replace(/\s+/g, " ").trim()).filter(Boolean);
  if (limpias.length === 0 || limpias.some((z) => z.toLowerCase() === TODA_ARGENTINA.toLowerCase())) return [...PROVINCIAS_AR];
  const vistas = new Set<string>();
  return limpias.filter((z) => {
    const k = z.toLowerCase();
    if (vistas.has(k)) return false;
    vistas.add(k);
    return true;
  });
}

/** Consulta de Outscraper para una zona: siempre acotada a Argentina. */
export function consultaZona(tipo: string, zona: string): string {
  const z = /argentina/i.test(zona) ? zona : `${zona}, Argentina`;
  return `${tipo.trim()} en ${z}`;
}

/** Máximo por consulta que trae el cliente de Outscraper. */
export const MAX_POR_CONSULTA = 60;

/** Cuántos resultados pedir en la próxima zona sin pasarse del tope total. */
export function cantidadParaZona(input: { maxTotal: number; encontrados: number; zonasRestantes: number }): number {
  const resta = Math.max(0, input.maxTotal - input.encontrados);
  if (resta === 0 || input.zonasRestantes <= 0) return 0;
  return Math.min(MAX_POR_CONSULTA, Math.max(1, Math.ceil(resta / input.zonasRestantes)));
}

/** Nombre de base sugerido (editable): «Pizzerías · Córdoba y Rosario · 16/10/2026». */
export function nombreBaseSugerido(tipo: string, zonas: string[], fecha = new Date()): string {
  const t = tipo.trim().replace(/\s+/g, " ");
  const tipoCap = t ? t.charAt(0).toUpperCase() + t.slice(1) : "Negocios";
  const zs = zonas.map((z) => z.trim()).filter(Boolean);
  const zona =
    zs.length === 0 || zs.some((z) => z.toLowerCase() === TODA_ARGENTINA.toLowerCase())
      ? TODA_ARGENTINA
      : zs.length <= 2
        ? zs.join(" y ")
        : `${zs[0]} y ${zs.length - 1} zonas más`;
  const d = `${String(fecha.getDate()).padStart(2, "0")}/${String(fecha.getMonth() + 1).padStart(2, "0")}/${fecha.getFullYear()}`;
  return `${tipoCap} · ${zona} · ${d}`.slice(0, 120);
}

export interface LimitesOutscraper {
  por_extraccion: number;
  por_dia: number;
}

/** Valida un pedido de extracción contra los topes de gasto. */
export function validarExtraccion(input: { tipo: string; zonas: string[]; cantidad: number; nombre: string }, limites: LimitesOutscraper, usadosHoy: number): string[] {
  const errores: string[] = [];
  if (input.tipo.trim().length < 2) errores.push("Indicá el tipo de negocio.");
  if (input.nombre.trim().length < 3) errores.push("Indicá un nombre de base.");
  if (!Number.isInteger(input.cantidad) || input.cantidad < 1) errores.push("La cantidad tiene que ser un número entero mayor a cero.");
  if (input.cantidad > limites.por_extraccion) errores.push(`El tope por extracción es ${limites.por_extraccion} negocios.`);
  if (usadosHoy + input.cantidad > limites.por_dia) errores.push(`Hoy quedan ${Math.max(0, limites.por_dia - usadosHoy)} negocios disponibles del tope diario (${limites.por_dia}).`);
  if (zonasDeExtraccion(input.zonas).length > 60) errores.push("Elegí como máximo 60 zonas.");
  return errores;
}

// ---------------------------------------------------------------------
// Venta consultiva
// ---------------------------------------------------------------------
export const ETAPAS_VENTA = ["apertura", "acepto", "analisis", "propuesta", "presupuesto_pedido", "presupuesto_enviado", "cerrado"] as const;
export type EtapaVenta = (typeof ETAPAS_VENTA)[number] | "no_interesado";

export const ETAPA_LABEL: Record<EtapaVenta, string> = {
  apertura: "Contactado (apertura)",
  acepto: "Aceptó escuchar",
  analisis: "Análisis hecho",
  propuesta: "Propuesta presentada",
  presupuesto_pedido: "Pidió presupuesto",
  presupuesto_enviado: "Presupuesto enviado",
  cerrado: "Cerrado (aprobado)",
  no_interesado: "No interesado",
};

/** Solo se avanza (nunca se retrocede); «no interesado» puede llegar en cualquier momento salvo después del cierre. */
export function avanzarEtapa(actual: EtapaVenta | null | undefined, nueva: EtapaVenta): EtapaVenta {
  const a = actual ?? "apertura";
  if (a === "cerrado") return a;
  if (nueva === "no_interesado") return nueva;
  if (a === "no_interesado") return nueva === "cerrado" || nueva === "presupuesto_pedido" ? nueva : a;
  return ETAPAS_VENTA.indexOf(nueva as any) > ETAPAS_VENTA.indexOf(a as any) ? nueva : a;
}

const FIN = "(?=$|[^a-záéíóúñü])";
const ACEPTA = new RegExp(`^\\s*(s[ií]+${FIN}|dale${FIN}|cont[aá]me|ok${FIN}|okey|bueno${FIN}|de una|claro|adelante|me interesa|por supuesto|obvio|sip${FIN}|va${FIN}|perfecto|genial)`, "i");
const NIEGA = /(ahora no|no puedo|no me interesa|no gracias|no tengo tiempo|despu[eé]s|m[aá]s tarde|otro momento|ocupad[oa]|no me escrib)/i;

/** ¿La respuesta a la apertura acepta escuchar la propuesta? (incluye el botón «Sí, contame»). */
export function esAceptacion(texto: string | null | undefined): boolean {
  const t = (texto ?? "").trim();
  if (!t || t.length > 160) return false;
  if (/^s[ií],? contame/i.test(t)) return true;
  if (/^\s*no(?=$|[^a-záéíóúñü])/i.test(t) || NIEGA.test(t)) return false;
  return ACEPTA.test(t);
}

export interface DatosVenta {
  necesidad?: string;
  servicios_conversados?: string[];
  precios_mencionados?: string[];
  objeciones?: string[];
  plazo_deseado?: string;
  presupuesto_cliente?: string;
  notas?: string[];
}

/** Suma lo nuevo a lo que ya había, sin perder nada (listas sin repetidos). */
export function fusionarDatosVenta(prev: DatosVenta | null | undefined, nuevo: DatosVenta): DatosVenta {
  const p = prev ?? {};
  const lista = (a?: string[], b?: string[]) => {
    const out = [...(a ?? [])];
    for (const x of b ?? []) if (x && !out.some((y) => y.toLowerCase() === x.toLowerCase())) out.push(x);
    return out.slice(-20);
  };
  return {
    ...p,
    ...(nuevo.necesidad ? { necesidad: nuevo.necesidad } : {}),
    ...(nuevo.plazo_deseado ? { plazo_deseado: nuevo.plazo_deseado } : {}),
    ...(nuevo.presupuesto_cliente ? { presupuesto_cliente: nuevo.presupuesto_cliente } : {}),
    servicios_conversados: lista(p.servicios_conversados, nuevo.servicios_conversados),
    precios_mencionados: lista(p.precios_mencionados, nuevo.precios_mencionados),
    objeciones: lista(p.objeciones, nuevo.objeciones),
    notas: lista(p.notas, nuevo.notas),
  };
}

/** Ventana de 24 h de WhatsApp abierta (último mensaje de la persona hace menos de 24 h). */
export function ventanaAbierta(ultimoEntrante: string | null | undefined, ahora = new Date()): boolean {
  if (!ultimoEntrante) return false;
  return ahora.getTime() - new Date(ultimoEntrante).getTime() < 24 * 3600 * 1000 - 5 * 60 * 1000;
}

/** Texto con el que sale el archivo del presupuesto. */
export function textoEnvioPresupuesto(input: { nombre?: string | null; monto?: number | null; moneda?: string | null; plazo?: string | null }): string {
  const partes = [`${input.nombre ? `${input.nombre.split(" ")[0]}, ` : ""}te paso el presupuesto que nos pediste.`];
  if (input.monto != null && input.moneda) partes.push(`Total: ${input.moneda} ${input.monto.toLocaleString("es-AR")}.`);
  if (input.plazo) partes.push(`Plazo de entrega: ${input.plazo}.`);
  partes.push("Cualquier duda la vemos por acá.");
  return partes.join(" ");
}

/**
 * Guía de la venta para el agente según la etapa. No afirma investigación
 * previa en la apertura; el análisis profundo llega recién al aceptar.
 */
export function guiaVenta(input: {
  etapa: EtapaVenta;
  origen: "scraper" | "directa";
  presentacion: string;
  marca: string;
  analisisListo: boolean;
  presupuesto?: { estado: string; monto?: number | null; moneda?: string | null; alcance?: string | null; plazo?: string | null } | null;
}): string[] {
  const l: string[] = [];
  if (input.origen === "scraper" && input.etapa === "apertura") {
    l.push(
      `La apertura que recibió fue: "Hola, ¿cómo estás? Soy ${input.presentacion || "el asesor"}, de ${input.marca || "la agencia"}. Tengo una propuesta para tu negocio. ¿Tenés cinco minutos para que te cuente?". NO digas que ya analizaste o investigaste su negocio: todavía no se hizo. Respondé a lo que escribió y preguntá si tiene cinco minutos.`
    );
  }
  if (input.etapa === "acepto" || input.etapa === "analisis") {
    l.push(
      input.analisisListo
        ? "Aceptó escuchar. Ya tenés el análisis con fuentes reales (abajo): presentá 1 o 2 hallazgos concretos, explicá de dónde salen y preguntá por su objetivo antes de proponer. Venta consultiva: escuchá, diagnosticá, proponé."
        : "Aceptó escuchar. El análisis de su negocio se está haciendo ahora: mientras tanto hacé 1 o 2 preguntas para entender su negocio y su objetivo (clientes, canales, qué le gustaría mejorar). No inventes hallazgos."
    );
  }
  if (input.etapa === "propuesta") {
    l.push("Ya le presentaste la propuesta. Resolvé dudas y objeciones con honestidad. Cuando muestre interés, preguntale si quiere que le preparemos un presupuesto.");
  }
  if (input.etapa === "presupuesto_pedido") {
    l.push("Ya pidió presupuesto y está en preparación (menos de 24 h). Si escribe, decile que ya lo están preparando y que se lo mandás apenas esté. No des precios ni armes el presupuesto vos.");
  }
  if (input.etapa === "presupuesto_enviado" && input.presupuesto) {
    const p = input.presupuesto;
    l.push(
      `Ya recibió el presupuesto${p.monto != null && p.moneda ? ` (total ${p.moneda} ${p.monto.toLocaleString("es-AR")})` : ""}${p.alcance ? `; alcance: ${p.alcance}` : ""}${p.plazo ? `; plazo de entrega: ${p.plazo}` : ""}. Tu objetivo es cerrarlo: respondé dudas, recordá el valor y preguntá si lo aprobamos. Si lo aprueba, usá presupuesto_aprobado. No cambies montos ni condiciones: si pide cambios, usá escalar_a_humano.`
    );
  }
  l.push(
    "Cierre: cuando haya interés, preguntá SIEMPRE si quiere que le preparemos un presupuesto. Si dice que sí, usá pedir_presupuesto y decile que va a estar listo en menos de 24 horas. Nunca armes ni estimes el presupuesto vos.",
    "Registrá lo que vayas sabiendo con registrar_venta (necesidad, servicios conversados, precios mencionados, objeciones, plazo deseado y etapa)."
  );
  return l;
}
