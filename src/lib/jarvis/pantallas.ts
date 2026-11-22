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

/**
 * Acciones rápidas (22/11): 3 o 4 pedidos de ACCIÓN por pantalla. Un toque envía el pedido a Jarvis, que
 * vuelve con la tarjeta «¿Lo hago?»: nada cambia sin el Sí. Lo que hace salir mensajes pide confirmación
 * reforzada (ver `seguridad.ts`). Derivar es siempre manual: Jarvis deja el paso listo, no deriva solo.
 */
const RESPONDER = S("Responder a los que esperan", "Revisá los chats de las personas que esperan respuesta y proponeme una respuesta para cada una");
const DERIVAR = S("Derivar captados", "Mostrame los captados que falta derivar y dejame listo el paso para derivarlos");
const RETOMAR = S("Retomar a los que se enfriaron", "Buscá a las personas que dejaron de responder hace varios días y proponeme retomarlas");
const LINEAS = S("Revisar las líneas", "Revisá las líneas de WhatsApp y decime si alguna está caída y cómo la reconecto");
const ARMAR = S("Armar campaña con la última base", "Armá una campaña en borrador con la última base cargada y proponeme el rol y la línea");

export function accionesRapidasDe(pantalla: PantallaId): Sugerencia[] {
  switch (pantalla) {
    case "chats":
      return [RESPONDER, S("Pasar a una persona a los que lo piden", "Proponeme pasar a una persona del equipo los chats donde pidieron hablar con alguien"), S("Dejar un borrador de respuesta", "Dejame un borrador de respuesta para el chat que más espera"), DERIVAR];
    case "campanas":
      return [ARMAR, S("Pausar las que casi no responden", "Proponeme pausar las campañas que envían y casi no reciben respuesta"), S("Bajar el límite diario", "Proponeme un límite diario más bajo para la campaña activa"), S("Lanzar la campaña lista", "Proponeme lanzar la campaña que está lista en borrador")];
    case "bases":
      return [ARMAR, S("Analizar la última base", "Analizá la última base cargada y decime qué rol del bot le conviene"), S("Asignar un rol a la base", "Proponeme un rol del bot para la última base cargada")];
    case "contactos":
      return [DERIVAR, RETOMAR, RESPONDER];
    case "agenda":
      return [S("Confirmar las citas de mañana", "Proponeme un mensaje para confirmar las citas de mañana"), S("Ver citas sin confirmar", "Mostrame las citas sin confirmar o caídas y proponeme qué hacer con cada una"), RESPONDER];
    case "agentes":
      return [S("Que el bot sea más breve", "Proponé que el bot responda más breve y directo"), S("Informe de mejoras del bot", "Armame un informe de mejoras del bot con las conversaciones reales"), S("Crear un rol nuevo", "Ayudame a armar un rol nuevo para el bot de este perfil y proponelo")];
    case "redes":
      return [S("Programar la semana", "Proponeme las publicaciones de esta semana, una por día, para que las revise"), S("Ideas de posteos", "Dejame ideas de posteos para esta semana"), S("Ver lo programado", "Decime qué publicaciones hay programadas")];
    case "seguimiento":
      return [RETOMAR, RESPONDER, DERIVAR];
    case "salud":
    case "lineas":
      return [LINEAS, S("Explicar qué está fallando", "Explicame qué está fallando y cómo lo arreglo"), S("Dejar una tarea para Claude", "Dejá en la Bandeja una tarea para Claude con lo que está fallando")];
    case "cerebro":
    case "bandeja":
      return [S("Dejar una tarea para Claude", "Quiero dejar una tarea en la Bandeja para Claude, ayudame a armarla y proponela"), S("Qué está pendiente", "Decime qué está pendiente en la Bandeja y en el cerebro"), S("Qué se decidió esta semana", "Resumime las órdenes y decisiones más nuevas del cerebro")];
    case "estadisticas":
    case "perfiles":
      return [S("Resumir y decidir", "Resumime cómo viene el día y decime qué tengo que decidir"), DERIVAR, RESPONDER];
    case "hoy":
    case "asistente":
    case "configuracion":
    case "otra":
    default:
      return [DERIVAR, RESPONDER, LINEAS];
  }
}

/** ¿El perfil que pide el navegador coincide con el que dice la ruta? Sin dato en la ruta, no hay conflicto. */
export function perfilCoincideConRuta(perfil: SlugPerfil, ruta: unknown): boolean {
  const enRuta = perfilDeRuta(ruta);
  return enRuta === null || enRuta === perfil;
}
