/**
 * Oficina por sectores (22/11). Pedido del dueño: «que cada empleado sea una oficina entera, con
 * agentes para tareas específicas: el que escribe el guion, el que renderiza, el que analiza…».
 *
 * Cada área de la Oficina (`ESCRITORIOS` en reglas.ts) es ahora un SECTOR del edificio, con sus
 * puestos. Cada puesto dice qué hace y con qué motor corre:
 *  - «claude»: lo trabajan los agentes de Claude cuando la tarea arranca (código, textos largos,
 *    revisión, diseño). Se pagan con el plan de Claude, no por mensaje.
 *  - «gemini»: corre dentro del panel con la clave de Gemini (rápido y barato: clasificar, resumir,
 *    ordenar pedidos, analizar cifras). Cuenta para el tope de gasto de IA.
 *  - «panel»: no usa IA; es una función del panel (programar, medir, enviar con confirmación).
 * Funciones puras: se prueban sin base.
 */
import { ESCRITORIOS, type Area, type TareaOficina } from "@/lib/oficina/reglas";

export type Motor = "claude" | "gemini" | "panel";

export const NOMBRE_MOTOR: Record<Motor, string> = { claude: "Claude", gemini: "Gemini", panel: "Panel" };

export interface Puesto {
  id: string;
  nombre: string;
  /** Qué hace, en una frase simple. */
  tarea: string;
  motor: Motor;
}

export interface Sector {
  area: Area;
  titulo: string;
  /** Para qué sirve el sector, en una línea. */
  bajada: string;
  /** Pedido de ejemplo para Jarvis (se precarga, no se envía solo). */
  ejemplo: string;
  puestos: Puesto[];
}

const p = (id: string, nombre: string, tarea: string, motor: Motor): Puesto => ({ id, nombre, tarea, motor });

export const SECTORES: Record<Area, Sector> = {
  direccion: {
    area: "direccion",
    titulo: "Cerebro (dirección)",
    bajada: "El cerebro recibe tus órdenes, las reparte entre los sectores, revisa todo y decide qué llega a vos.",
    ejemplo: "Qué tareas de la oficina están trabadas y qué necesitan de mí",
    puestos: [
      p("director", "Orquestador", "Lee la orden, consulta la memoria del cerebro y reparte entre los sectores", "claude"),
      p("memoria", "Memoria del cerebro", "Guarda lo aprendido y el mapa del código (Graphify)", "panel"),
      p("estratega", "Estratega", "Prioriza según lo que más capta esta semana", "claude"),
      p("abogado-diablo", "Abogado del diablo", "Busca riesgos y lo que puede salir mal", "claude"),
      p("recepcion", "Recepción", "Ordena tu pedido al instante y elige la ruta", "gemini"),
      p("control", "Control de calidad", "Revisa la entrega final antes de mostrártela", "claude"),
    ],
  },
  analisis: {
    area: "analisis",
    titulo: "Marketing y análisis",
    bajada: "Cifras de bots, campañas, redes y landings, en palabras simples.",
    ejemplo: "Analizá qué campaña captó más esta semana y por qué",
    puestos: [
      p("datos", "Analista de datos", "Lee captación, respuestas y derivaciones por perfil", "gemini"),
      p("campanas", "Analista de campañas", "Compara bases, horarios y plantillas", "gemini"),
      p("medios", "Analista de medios", "Mide publicidad y costo por consulta", "claude"),
      p("informes", "Redactor de informes", "Arma el informe semanal para los dueños", "claude"),
      p("alertas", "Vigía de cifras", "Avisa cuando algo baja de golpe", "panel"),
    ],
  },
  redes: {
    area: "redes",
    titulo: "Redes y contenido",
    bajada: "Del guion a la pieza publicada, con tu voz.",
    ejemplo: "Armá 3 reels para la semana del perfil Jurídico",
    puestos: [
      p("estratega-contenido", "Estratega de contenido", "Elige temas y ángulos de la semana", "claude"),
      p("guionista", "Guionista", "Escribe guiones de reels y carruseles", "claude"),
      p("redactor-voz", "Redactor con tu voz", "Textos y copys con el tono de la marca", "claude"),
      p("disenador-piezas", "Diseñador de piezas", "Arma la pieza visual con la dirección de arte", "claude"),
      p("animador", "Animador y render", "Anima y exporta el video final", "claude"),
      p("analista-redes", "Analista de redes", "Lee alcance y guardados en Metricool", "gemini"),
      p("programador", "Programador de posteos", "Deja todo en el calendario (publica con tu OK)", "panel"),
    ],
  },
  diseno: {
    area: "diseno",
    titulo: "Panel y diseño",
    bajada: "Pantallas del panel, landings y piezas con calidad visual.",
    ejemplo: "Mejorá la pantalla de Resultados para que se entienda de un vistazo",
    puestos: [
      p("investigador", "Investigador de diseño", "Busca referencias reales y medidas", "claude"),
      p("interfaz", "Diseñador de interfaz", "Propone la pantalla con la estética del panel", "claude"),
      p("motion", "Animación", "Movimiento sobrio y sombras en capas", "claude"),
      p("accesibilidad", "Accesibilidad", "Contraste, teclado y lector de pantalla", "claude"),
      p("maquetador", "Maquetador", "Lo lleva a código y lo prueba", "claude"),
    ],
  },
  seo: {
    area: "seo",
    titulo: "Landings y SEO",
    bajada: "Que te encuentren en Google y en las IA, y que la landing convierta.",
    ejemplo: "Auditá la landing de Coberturas y decime qué mejorar primero",
    puestos: [
      p("auditor-seo", "Auditor SEO", "Revisa títulos, velocidad e indexación", "claude"),
      p("redactor-seo", "Redactor de landings", "Textos que responden lo que busca la gente", "claude"),
      p("conversion", "Especialista en conversión", "Formularios, botones y pruebas A/B", "claude"),
      p("competencia", "Analista de competencia", "Qué hacen los que aparecen arriba", "gemini"),
      p("ia-visibilidad", "Visibilidad en IA", "Que ChatGPT y Gemini te recomienden", "claude"),
    ],
  },
  bots: {
    area: "bots",
    titulo: "Agentes y bots",
    bajada: "Los bots que atienden WhatsApp: roles, plantillas y laboratorio.",
    ejemplo: "Creá un rol para el bot de Autos 0 km que agende pruebas de manejo",
    puestos: [
      p("prompts", "Ingeniero de prompts", "Escribe y ajusta los roles del bot", "claude"),
      p("evaluador", "Evaluador de bots", "Compara versiones con charlas reales", "gemini"),
      p("plantillas", "Plantillas de Meta", "Arma plantillas y las manda a revisión", "panel"),
      p("conocimiento", "Bibliotecario", "Suma la ficha y el conocimiento del rubro", "claude"),
      p("calidad-charlas", "Revisor de charlas", "Marca respuestas flojas para corregir", "gemini"),
    ],
  },
  ingenieria: {
    area: "ingenieria",
    titulo: "Ingeniería del panel",
    bajada: "Errores, pruebas, seguridad y cambios de código del panel.",
    ejemplo: "Agregá en Hoy un botón para ver las citas de mañana",
    puestos: [
      p("desarrollador", "Desarrollador", "Hace los cambios de código que pedís", "claude"),
      p("revisor", "Revisor de código", "Revisa cada cambio antes de publicarlo", "claude"),
      p("seguridad", "Seguridad", "Claves, accesos y rubros separados", "claude"),
      p("pruebas", "Pruebas", "Corre las pruebas y prueba las pantallas", "claude"),
      p("guardia", "Guardia de errores", "Mira los errores de Vercel y avisa", "panel"),
      p("lineas", "Técnico de líneas", "Vigila que los teléfonos estén conectados", "panel"),
    ],
  },
  asistente: {
    area: "asistente",
    titulo: "Secretaría (Jarvis)",
    bajada: "Te pone al día, arma recordatorios y ejecuta lo que pidas con tu OK.",
    ejemplo: "¿Qué tengo pendiente hoy en los cuatro perfiles?",
    puestos: [
      p("jarvis", "Jarvis", "Tu secretario: propone y ejecuta con tu confirmación", "gemini"),
      p("agenda", "Agenda", "Citas, recordatorios y avisos", "panel"),
      p("parte", "Parte del día", "Resumen de cada mañana por perfil", "gemini"),
      p("enlace-claude", "Enlace con Claude", "Pasa a la Bandeja lo que necesita código", "claude"),
    ],
  },
};

export const ORDEN_SECTORES: Area[] = ESCRITORIOS.map((e) => e.area);

export function esSector(v: unknown): v is Area {
  return typeof v === "string" && (ORDEN_SECTORES as string[]).includes(v);
}

export interface EstadoSector {
  trabajando: number;
  enCola: number;
  paraAprobar: number;
}

/** Cuántas tareas tiene el sector en marcha, en cola o esperando tu OK. */
export function estadoSector(area: Area, tareas: Pick<TareaOficina, "estado" | "decision" | "ruta" | "area" | "recorrido">[]): EstadoSector {
  const r: EstadoSector = { trabajando: 0, enCola: 0, paraAprobar: 0 };
  for (const t of tareas) {
    const pasa = t.area === area || t.ruta.includes(area);
    if (!pasa) continue;
    const hecho = t.recorrido.some((x) => x.area === area);
    if (t.estado === "en_curso" && !hecho) r.trabajando++;
    else if (t.estado === "pendiente") r.enCola++;
    else if (t.estado === "lista" && t.decision === null) r.paraAprobar++;
  }
  return r;
}

/** Cuántos puestos del sector se ven trabajando: uno por tarea en marcha, sin pasarse del total. */
export function puestosOcupados(sector: Sector, estado: EstadoSector): number {
  return Math.min(sector.puestos.length, estado.trabajando * 2);
}

/** Cuántos puestos usa cada motor (para el cartel del sector). */
export function cuentaMotores(sector: Sector): Record<Motor, number> {
  const c: Record<Motor, number> = { claude: 0, gemini: 0, panel: 0 };
  for (const x of sector.puestos) c[x.motor]++;
  return c;
}
