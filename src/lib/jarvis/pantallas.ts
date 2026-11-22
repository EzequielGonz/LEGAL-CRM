/**
 * Jarvis · dónde está la persona y qué se le sugiere (22/11). Funciones
 * puras: sin navegador, sin base y sin reloj. Las usan el panel (cliente),
 * la ruta del servidor y las pruebas.
 *
 * Cada rubro va separado: el perfil sale de la ruta (`/panel/<perfil>/…` o
 * `?perfil=`) y, si la ruta no lo dice, del marco que envuelve la pantalla.
 */
import { SLUGS_PERFIL, type SlugPerfil } from "@/lib/marca";

export type PantallaId =
  | "hoy"
  | "chats"
  | "contactos"
  | "campanas"
  | "bases"
  | "agenda"
  | "agentes"
  | "configuracion"
  | "estadisticas"
  | "redes"
  | "seguimiento"
  | "salud"
  | "lineas"
  | "cerebro"
  | "perfiles"
  | "bandeja"
  | "asistente"
  | "otra";

export interface PantallaActual {
  pantalla: PantallaId;
  /** Perfil que dice la ruta; null si la ruta no lo dice (Jurídico en sus direcciones históricas). */
  perfilEnRuta: SlugPerfil | null;
}

const PRIMER_TRAMO: Record<string, PantallaId> = {
  "": "hoy",
  hoy: "hoy",
  inicio: "hoy",
  inbox: "chats",
  chats: "chats",
  conversaciones: "chats",
  conversacion: "chats",
  contactos: "contactos",
  oportunidades: "contactos",
  prospectos: "contactos",
  "prospectos-por-base": "contactos",
  ficha: "contactos",
  "casos-cerrados": "contactos",
  descartados: "contactos",
  derivar: "contactos",
  "consultas-directas": "contactos",
  lead: "contactos",
  campanas: "campanas",
  captacion: "campanas",
  wasender: "campanas",
  bases: "bases",
  extraer: "bases",
  agenda: "agenda",
  agentes: "agentes",
  "biblioteca-agentes": "agentes",
  "comparacion-agentes": "agentes",
  configuracion: "configuracion",
  estadisticas: "estadisticas",
  resultados: "estadisticas",
  redes: "redes",
  contenido: "redes",
  piezas: "redes",
  "redes-pieza": "redes",
  seguimiento: "seguimiento",
  revision: "seguimiento",
  recuperar: "seguimiento",
  salud: "salud",
  incidencias: "salud",
  meta: "lineas",
  cerebro: "cerebro",
  perfiles: "perfiles",
  bandeja: "bandeja",
  asistente: "asistente",
};

/** Solo caracteres de una ruta interna: lo demás se descarta (la ruta se muestra y se manda como dato). */
export function rutaSegura(ruta: unknown): string {
  if (typeof ruta !== "string") return "/";
  const limpia = ruta.split(/[?#]/)[0].replace(/[^A-Za-z0-9/_\-[\]]/g, "").slice(0, 120);
  return limpia.startsWith("/") ? limpia : `/${limpia}`;
}

/** Perfil que dice la ruta: `/panel/<perfil>/…` o `?perfil=<perfil>`. */
export function perfilDeRuta(ruta: unknown): SlugPerfil | null {
  if (typeof ruta !== "string") return null;
  const [camino, consulta = ""] = ruta.split("#")[0].split("?");
  const m = /^\/panel\/([a-z0-9_]+)/.exec(camino);
  if (m && (SLUGS_PERFIL as readonly string[]).includes(m[1])) return m[1] as SlugPerfil;
  const q = /(?:^|&)perfil=([a-z0-9_]+)/.exec(consulta);
  if (q && (SLUGS_PERFIL as readonly string[]).includes(q[1])) return q[1] as SlugPerfil;
  return null;
}

/** Pantalla a partir de la ruta (con o sin query). */
export function pantallaDeRuta(ruta: unknown): PantallaActual {
  const perfilEnRuta = perfilDeRuta(ruta);
  const limpia = rutaSegura(ruta);
  const tramos = limpia.split("/").filter(Boolean);
  if (tramos[0] === "panel") tramos.splice(0, 2);
  const primero = tramos[0] ?? "";
  return { pantalla: PRIMER_TRAMO[primero] ?? "otra", perfilEnRuta };
}

/** Nombre de la pantalla para hablar con la persona (sin jerga). */
export const NOMBRE_PANTALLA: Record<PantallaId, string> = {
  hoy: "Hoy",
  chats: "Chats",
  contactos: "Contactos",
  campanas: "Campañas",
  bases: "Bases",
  agenda: "Agenda",
  agentes: "Bot IA",
  configuracion: "Ajustes",
  estadisticas: "Estadísticas",
  redes: "Redes y contenido",
  seguimiento: "Seguimiento",
  salud: "Salud",
  lineas: "Líneas",
  cerebro: "Cerebro",
  perfiles: "Perfiles",
  bandeja: "Bandeja",
  asistente: "Asistente",
  otra: "el panel",
};

export interface Sugerencia {
  /** Texto corto del botón. */
  etiqueta: string;
  /** Lo que se le pide a Jarvis al tocarlo. */
  pedido: string;
}

const S = (etiqueta: string, pedido = etiqueta): Sugerencia => ({ etiqueta, pedido });

/** Tres sugerencias de un toque según la pantalla. Siempre devuelve exactamente tres. */
export function sugerenciasDe(pantalla: PantallaId, nombrePerfil = "este perfil"): Sugerencia[] {
  switch (pantalla) {
    case "chats":
      return [S("¿Quién espera respuesta hace más tiempo?"), S("Resumime el último chat que entró", "Resumime el chat que entró más recién"), S("Ayudame a redactar una respuesta", "Ayudame a redactar un borrador de respuesta para el chat que más espera")];
    case "campanas":
      return [S("Resumime cómo va la campaña", "Resumime cómo va la campaña que está en curso"), S("¿Cuál responde mejor?", "¿Qué campaña tiene mejor respuesta y por qué?"), S("Dejame una campaña lista", "Ayudame a dejar lista una campaña en borrador")];
    case "salud":
      return [S("¿Qué está fallando y cómo lo arreglo?"), S("¿Cómo están las líneas?", "Decime el estado de las líneas"), S("Explicame los semáforos", "Explicame en simple qué significa cada semáforo de Salud")];
    case "contactos":
      return [S("¿Quiénes están captados y sin derivar?", "Mostrame los captados que falta derivar"), S("Buscame a una persona", "Quiero buscar a una persona, preguntame el nombre"), S("Explicame qué significa cada estado", "Explicame en simple los estados de los contactos")];
    case "bases":
      return [S("¿Qué bases tengo cargadas?", "Decime qué bases tengo cargadas y cuántas personas tiene cada una"), S("Armá una campaña con una base", "Ayudame a armar una campaña con una de las bases"), S("¿Cómo cargo una base nueva?", "Explicame paso a paso cómo cargar una base nueva")];
    case "agenda":
      return [S("¿Qué citas vienen?", "Decime qué citas tengo próximas"), S("Llevame a las citas", "Llevame a la pantalla de citas"), S("¿Hay citas sin confirmar?", "¿Hay citas sin confirmar o que se cayeron?")];
    case "agentes":
      return [S("¿Cómo viene el bot?", `¿Cómo viene el bot de ${nombrePerfil}?`), S("Que el bot sea más breve", "Proponé que el bot responda más breve y directo"), S("¿Qué pregunta más la gente?", "Armame un informe de mejoras del bot con las conversaciones reales")];
    case "redes":
      return [S("¿Qué hay programado?", "Decime qué publicaciones hay programadas"), S("Dejame ideas de posteos", "Dejame ideas de posteos para esta semana"), S("Llevame a las publicaciones", "Llevame a la pantalla de publicaciones")];
    case "seguimiento":
      return [S("¿A quién conviene retomar?", "¿A quién conviene retomar hoy?"), S("¿Qué seguimientos se cayeron?", "Decime qué seguimientos se cayeron y por qué"), S("Explicame el circuito", "Explicame en simple cómo es el circuito de seguimiento")];
    case "estadisticas":
      return [S("Explicame una cifra", "Quiero que me expliques una cifra de esta pantalla, preguntame cuál"), S("¿Cómo vamos esta semana?", "Resumime cómo vamos esta semana"), S("¿Qué mejoró?", "¿Qué mejoró y qué empeoró respecto de la semana pasada?")];
    case "lineas":
      return [S("¿Cómo están las líneas?", "Decime el estado de las líneas"), S("¿Alguna está caída?", "¿Alguna línea está caída o desconectada?"), S("¿Cómo la reconecto?", "Explicame cómo reconectar una línea caída")];
    case "cerebro":
      return [S("¿Qué sabe el negocio?", "¿Qué sabe el negocio de este perfil?"), S("Dejá una tarea para Claude", "Quiero dejar una tarea en la Bandeja para Claude, ayudame a armarla"), S("¿Qué está pendiente?", "¿Qué está pendiente en la Bandeja y en la Oficina?")];
    case "bandeja":
      return [S("Dejá una tarea para Claude", "Quiero dejar una tarea en la Bandeja para Claude, ayudame a armarla"), S("¿Qué tareas hay?", "¿Qué tareas hay en la Bandeja?"), S("Ayudame a escribir un pedido claro", "Ayudame a escribir un pedido claro para la Bandeja")];
    case "perfiles":
      return [S("¿Cómo está cada rubro?", "Resumime cómo está cada rubro hoy"), S("Llevame a los chats de Coberturas", "Llevame a los chats de Coberturas médicas"), S("¿Dónde hay más para hacer?", "¿En qué rubro hay más cosas esperando?")];
    case "hoy":
    case "asistente":
    case "configuracion":
    case "otra":
    default:
      return [S("¿Qué tengo que decidir hoy?"), S("Resumime el día", "Resumime cómo viene el día"), S(`Llevame a los chats de ${nombrePerfil}`)];
  }
}

/** ¿El perfil que pide el navegador coincide con el que dice la ruta? Sin dato en la ruta, no hay conflicto. */
export function perfilCoincideConRuta(perfil: SlugPerfil, ruta: unknown): boolean {
  const enRuta = perfilDeRuta(ruta);
  return enRuta === null || enRuta === perfil;
}
