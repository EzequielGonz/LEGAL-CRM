/**
 * Jarvis · parte del día (22/11). Funciones puras: arman el saludo, las
 * frases, los tres anillos y la lista «para decidir» con datos de la base
 * (sin gastar tokens). Si hay presupuesto, Gemini solo redacta las frases
 * (`prompt.ts`); si no, queda este texto por reglas.
 *
 * Nada acá lee la hora ni usa azar: la hora de Argentina y el día llegan
 * como datos, así el servidor y el navegador muestran lo mismo.
 */

export interface DatosParte {
  /** Nombre del perfil para hablar («Coberturas médicas»). */
  perfil: string;
  /** Hora de Argentina, 0 a 23. */
  hora: number;
  /** Día en Argentina, AAAA-MM-DD. */
  dia: string;
  captadosHoy: number;
  captadosAyer: number;
  /** Personas que piden que alguien les responda (definición única de «Esperan a una persona»). */
  esperandoPersona: number;
  enConversacion: number;
  sinDerivar: number;
  /** Propuestas (de Jarvis o del asistente) que esperan el OK y se pueden confirmar desde Jarvis. */
  tareasParaOk: number;
  tareasResueltasHoy: number;
  /** Líneas con problema; null si no se pudo comprobar. */
  lineasCaidas: number | null;
  /** Contactos nuevos desde la última visita; null si es la primera vez. */
  nuevosDesdeUltimaVisita: number | null;
  /** Días desde la última visita; null si es la primera vez. */
  diasDesdeUltimaVisita: number | null;
}

export interface AnilloParte {
  clave: "captados" | "chats" | "tareas";
  etiqueta: string;
  valor: number;
  /** Total de referencia para llenar el anillo (0 = anillo vacío). */
  meta: number;
  nota: string;
}

export type AccionParte = { tipo: "ir"; href: string } | { tipo: "jarvis"; pedido: string };

export interface DecisionParte {
  texto: string;
  boton: string;
  accion: AccionParte;
}

export interface ParteDelDia {
  dia: string;
  saludo: string;
  frases: string[];
  anillos: AnilloParte[];
  decisiones: DecisionParte[];
  /** Cómo se armó el texto. */
  fuente: "reglas" | "ia";
}

export function saludoPorHora(hora: number): string {
  if (hora >= 5 && hora < 12) return "Buen día";
  if (hora >= 12 && hora < 20) return "Buenas tardes";
  return "Buenas noches";
}

const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);

/** Meta de referencia del anillo de captados: lo de ayer o 5, lo que sea mayor, y nunca menos que lo de hoy. */
export function metaCaptados(hoy: number, ayer: number): number {
  return Math.max(5, ayer, hoy);
}

/** Frases del parte armadas por reglas (2 o 3, cortas y sin jerga). */
export function frasesPorReglas(d: DatosParte): string[] {
  const frases: string[] = [];

  // 1) Qué pasó.
  if (d.captadosHoy > 0) {
    const ayer = d.captadosAyer > 0 ? ` (ayer fueron ${d.captadosAyer})` : "";
    frases.push(`Hoy ya ${plural(d.captadosHoy, "se captó", "se captaron")} ${d.captadosHoy} ${plural(d.captadosHoy, "persona", "personas")}${ayer}.`);
  } else if (d.nuevosDesdeUltimaVisita !== null && d.nuevosDesdeUltimaVisita > 0) {
    const cuando = d.diasDesdeUltimaVisita !== null && d.diasDesdeUltimaVisita >= 2 ? `en estos ${d.diasDesdeUltimaVisita} días` : "desde tu última visita";
    frases.push(`${cuando.charAt(0).toUpperCase()}${cuando.slice(1)} se ${plural(d.nuevosDesdeUltimaVisita, "sumó", "sumaron")} ${d.nuevosDesdeUltimaVisita} ${plural(d.nuevosDesdeUltimaVisita, "contacto nuevo", "contactos nuevos")}.`);
  } else {
    frases.push("Todavía no hay captados hoy.");
  }

  // 2) Qué espera una decisión.
  const espera: string[] = [];
  if (d.tareasParaOk > 0) espera.push(`${d.tareasParaOk} ${plural(d.tareasParaOk, "tarea espera", "tareas esperan")} tu OK`);
  if (d.esperandoPersona > 0) espera.push(`${d.esperandoPersona} ${plural(d.esperandoPersona, "persona espera", "personas esperan")} que le respondan`);
  if (espera.length > 0) frases.push(`${espera.join(" y ")}.`.replace(/^./, (c) => c.toUpperCase()));

  // 3) Qué conviene mirar hoy.
  if (d.lineasCaidas !== null && d.lineasCaidas > 0) frases.push(`Conviene mirar primero las líneas: ${d.lineasCaidas} ${plural(d.lineasCaidas, "tiene un problema", "tienen problemas")}.`);
  else if (d.esperandoPersona > 0) frases.push("Conviene arrancar por los chats.");
  else if (d.sinDerivar > 0) frases.push(`Hay ${d.sinDerivar} ${plural(d.sinDerivar, "captado", "captados")} sin derivar.`);
  else if (espera.length === 0) frases.push("Está todo al día.");

  return frases.slice(0, 3);
}

export function anillosDe(d: DatosParte): AnilloParte[] {
  return [
    { clave: "captados", etiqueta: "Captados hoy", valor: d.captadosHoy, meta: metaCaptados(d.captadosHoy, d.captadosAyer), nota: d.captadosAyer > 0 ? `ayer ${d.captadosAyer}` : "meta del día" },
    { clave: "chats", etiqueta: "Chats esperando", valor: d.esperandoPersona, meta: Math.max(d.esperandoPersona, d.enConversacion), nota: d.enConversacion > 0 ? `de ${Math.max(d.esperandoPersona, d.enConversacion)} charlas` : "sin charlas abiertas" },
    { clave: "tareas", etiqueta: "Tareas para tu OK", valor: d.tareasParaOk, meta: d.tareasParaOk + d.tareasResueltasHoy, nota: d.tareasResueltasHoy > 0 ? `${d.tareasResueltasHoy} resuelta${d.tareasResueltasHoy === 1 ? "" : "s"} hoy` : "esperando" },
  ];
}

/** Hasta tres cosas para decidir, en orden de urgencia. */
export function decisionesDe(d: DatosParte, hrefChats: string): DecisionParte[] {
  const lista: DecisionParte[] = [];
  if (d.esperandoPersona > 0) {
    lista.push({ texto: `Responder a ${d.esperandoPersona} ${plural(d.esperandoPersona, "persona", "personas")}`, boton: "Ver chats", accion: { tipo: "ir", href: hrefChats } });
  }
  if (d.lineasCaidas !== null && d.lineasCaidas > 0) {
    lista.push({ texto: `Revisar ${d.lineasCaidas} ${plural(d.lineasCaidas, "línea con problema", "líneas con problemas")}`, boton: "Ver estado", accion: { tipo: "jarvis", pedido: "Decime el estado de las líneas y cómo arreglo la que falla" } });
  }
  if (d.sinDerivar > 0) {
    lista.push({ texto: `Derivar ${d.sinDerivar} ${plural(d.sinDerivar, "captado", "captados")}`, boton: "Ver quiénes", accion: { tipo: "jarvis", pedido: "Mostrame los captados que falta derivar" } });
  }
  return lista.slice(0, 3);
}

/** Parte completo por reglas, sin IA. */
export function armarParte(d: DatosParte, hrefChats: string): ParteDelDia {
  return {
    dia: d.dia,
    saludo: saludoPorHora(d.hora),
    frases: frasesPorReglas(d),
    anillos: anillosDe(d),
    decisiones: decisionesDe(d, hrefChats),
    fuente: "reglas",
  };
}

/** Días enteros entre dos instantes (≥ 0), o null si falta alguno o la fecha no es válida. */
export function diasEntre(desdeIso: string | null | undefined, ahoraMs: number): number | null {
  if (!desdeIso) return null;
  const t = Date.parse(desdeIso);
  if (!Number.isFinite(t) || t > ahoraMs) return null;
  return Math.floor((ahoraMs - t) / 86_400_000);
}

/** La «última visita» que manda el navegador: solo vale si es una fecha ISO de los últimos 30 días. */
export function ultimaVisitaValida(v: unknown, ahoraMs: number): string | null {
  if (typeof v !== "string" || v.length > 40) return null;
  const t = Date.parse(v);
  if (!Number.isFinite(t) || t > ahoraMs || ahoraMs - t > 30 * 86_400_000) return null;
  return new Date(t).toISOString();
}

/** Cuánto se llena un anillo (0 a 1). Sin meta o sin valor, vacío; nunca pasa de 1. */
export function proporcionAnillo(valor: number, meta: number): number {
  if (!(meta > 0) || !(valor > 0)) return 0;
  return Math.min(1, valor / meta);
}
