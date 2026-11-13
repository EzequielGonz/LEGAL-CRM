/**
 * Herramientas del asistente del panel (18/10).
 *
 * Dos tipos:
 *  - Consulta: leen y responden en el momento (cifras, captados, bots).
 *  - Propuesta: preparan una acción y la dejan en `asistente_acciones` como
 *    «propuesta». Nada se ejecuta hasta que la responsable confirma en el
 *    panel (botón «Confirmar»). Ninguna envía mensajes ni inicia nada por sí sola;
 *    las que pueden contactar personas piden confirmación reforzada.
 */
import type { SlugPerfil } from "@/lib/marca";
import { DECLARACIONES_CHATS } from "@/lib/asistente/chats-declaraciones";

export const DECLARACIONES = [
  {
    name: "resumen_perfil",
    description: "Cifras actuales del perfil: captados, captados sin derivar, conversaciones que piden una persona, en conversación, seguimiento, campañas y publicaciones programadas.",
    parametersJsonSchema: { type: "object", properties: {} },
  },
  {
    name: "listar_captados",
    description: "Últimos captados del perfil con nombre, fecha, si ya se derivó y la próxima cita (si hay).",
    parametersJsonSchema: {
      type: "object",
      properties: {
        solo_sin_derivar: { type: "boolean", description: "true para mostrar solo los que falta derivar" },
        limite: { type: "integer", description: "Cantidad (1 a 30)" },
      },
    },
  },
  {
    name: "estado_bots",
    description: "Puntaje (0 a 100) del bot del perfil calculado con resultados reales, sus componentes y qué conviene mejorar.",
    parametersJsonSchema: { type: "object", properties: {} },
  },
  {
    name: "comparar_versiones_bot",
    description:
      "Compara el conocimiento del bot del perfil: v1 (bot del 24/10) contra v2 (biblioteca de ventas), con resultados reales del período: conversaciones, cuántas siguieron la charla, captación, pasaron a una persona, bajas, qué fichas de objeción usó la v2 y un veredicto que no declara ganador con pocos datos. Usala cuando pregunten si el bot nuevo funciona mejor o qué versión conviene.",
    parametersJsonSchema: { type: "object", properties: { dias: { type: "integer", description: "Período en días (7, 14 o 30). Por defecto 14." } } },
  },
  {
    name: "proponer_publicaciones",
    description:
      "Arma un calendario de publicaciones para Instagram y/o Facebook del perfil (posteos con imagen, carruseles e historias; sin videos) y lo deja como PROPUESTA para que la responsable confirme. Usala cuando pidan programar publicaciones, historias o carruseles.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        dias: { type: "integer", description: "Cantidad de días del calendario (1 a 31)" },
        desde: { type: "string", description: "Primer día, formato AAAA-MM-DD (hora de Argentina). Si no lo dicen, mañana." },
        posts_por_dia: { type: "integer", description: "Posteos con imagen por día (0 a 3)" },
        historias_por_dia: { type: "integer", description: "Historias por día (0 a 3)" },
        carrusel_cada_dias: { type: "integer", description: "Un carrusel cada N días (0 = ninguno)" },
        redes: { type: "array", items: { type: "string", enum: ["instagram", "facebook"] }, description: "Redes donde publicar" },
        temas: { type: "string", description: "Temas, enfoque u objetivo que pidieron (opcional)" },
      },
      required: ["dias"],
    },
  },
  {
    name: "proponer_cambio_bot",
    description:
      "Prepara un cambio en las instrucciones del bot del perfil a partir de lo que pidió la responsable (tono, preguntas, cuándo derivar, etc.) y lo deja como PROPUESTA con el antes y el después. No cambia nada hasta que se confirma.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        pedido: { type: "string", description: "Qué hay que cambiar, en palabras de la responsable" },
        area: { type: "string", description: "Solo Jurídico: civil o penal (por defecto civil)" },
      },
      required: ["pedido"],
    },
  },
  {
    name: "proponer_pausa_campana",
    description: "Deja como PROPUESTA pausar la campaña en curso del perfil (pausar nunca envía mensajes). Para reanudarla, usá proponer_lanzamiento.",
    parametersJsonSchema: {
      type: "object",
      properties: { motivo: { type: "string" } },
    },
  },
  {
    name: "opciones_campana",
    description: "Lista lo que hay para armar una campaña en este perfil: bases cargadas, líneas de WhatsApp habilitadas (con su estado real en Meta) y las plantillas aprobadas de cada línea. Usala antes de proponer una campaña.",
    parametersJsonSchema: { type: "object", properties: {} },
  },
  {
    name: "analizar_base",
    description: "Resume una base cargada: columnas y distribución de categorías (por ejemplo tipo de consulta o diagnóstico), sin datos personales. Usala para recomendar la plantilla y el enfoque de la campaña según el tipo de base.",
    parametersJsonSchema: { type: "object", properties: { base: { type: "string", description: "Nombre de la base" } }, required: ["base"] },
  },
  {
    name: "listar_campanas",
    description: "Campañas del perfil con su estado y cuántos destinatarios hay en cada estado.",
    parametersJsonSchema: { type: "object", properties: {} },
  },
  {
    name: "proponer_campana",
    description:
      "Deja como PROPUESTA crear una campaña en BORRADOR sobre una base (no envía nada). Necesita nombre, base, línea y plantilla; si falta algo, consultá opciones_campana y preguntale a la responsable. Los detenidos y los ya contactados quedan afuera automáticamente.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        nombre: { type: "string", description: "Nombre de la campaña" },
        base: { type: "string", description: "Nombre de la base" },
        linea: { type: "string", description: "Nombre de la línea de WhatsApp" },
        plantilla: { type: "string", description: "Nombre de la plantilla aprobada de esa línea" },
        dias: { type: "array", items: { type: "integer" }, description: "Días de envío, 1=lunes a 6=sábado (vacío = lunes a sábado)" },
        limite_diario: { type: "integer", description: "Máximo de mensajes por día (opcional)" },
      },
      required: ["nombre", "base", "linea", "plantilla"],
    },
  },
  {
    name: "proponer_lanzamiento",
    description:
      "Deja como PROPUESTA lanzar o reanudar una campaña en borrador o pausada. Es la acción que puede enviar mensajes a personas: la responsable debe marcar la confirmación reforzada. Si la campaña no está lista (línea no conectada en Meta, plantilla, pausa general) devuelve qué falta y NO propone.",
    parametersJsonSchema: {
      type: "object",
      properties: { campana: { type: "string", description: "Nombre de la campaña" } },
      required: ["campana"],
    },
  },
  {
    name: "proponer_asignar_linea",
    description: "Deja como PROPUESTA cambiar la línea (y opcionalmente la plantilla) de una campaña en borrador o pausada. No envía nada.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        campana: { type: "string" },
        linea: { type: "string" },
        plantilla: { type: "string", description: "Opcional: plantilla aprobada de esa línea" },
      },
      required: ["campana", "linea"],
    },
  },
  {
    name: "proponer_limite_diario",
    description: "Deja como PROPUESTA cambiar el máximo de mensajes por día de una campaña, en cualquier estado (también en curso). Vacío o null = sin límite propio. No lanza ni reanuda nada.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        campana: { type: "string" },
        limite: { type: "integer", description: "Mensajes por día, entre 1 y 1000. Omitir para sacar el límite." },
      },
      required: ["campana"],
    },
  },
  {
    name: "listar_agentes",
    description: "Agentes IA del perfil (derivados), su versión, si está publicada, y qué agente responde hoy en cada área.",
    parametersJsonSchema: { type: "object", properties: {} },
  },
  {
    name: "proponer_asignar_agente",
    description: "Deja como PROPUESTA activar, pausar o apagar un agente en un área del perfil. Activar pide además el PIN.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        agente: { type: "string", description: "Nombre o clave del agente" },
        estado: { type: "string", enum: ["activa", "pausada", "apagada"] },
        area: { type: "string", description: "Área del perfil (en Jurídico: civil o penal)" },
      },
      required: ["agente", "estado"],
    },
  },
  {
    name: "listar_roles",
    description: "Roles o comportamientos guardados del agente en este perfil (nombre, objetivo, tono, instrucciones) y en qué bases están cargados.",
    parametersJsonSchema: { type: "object", properties: {} },
  },
  {
    name: "proponer_rol",
    description:
      "Deja como PROPUESTA crear o editar un rol del agente para abordar un tipo de cliente (por ejemplo «Inmobiliarias: cierre rápido con reunión»). Para editar, pasá el nombre o id del rol existente en «rol». Queda guardado para reutilizarlo en otras bases.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        rol: { type: "string", description: "Opcional: nombre o id del rol a editar. Vacío = rol nuevo." },
        nombre: { type: "string" },
        objetivo: { type: "string", description: "Qué tiene que lograr con esta base (captar, agendar llamada, vender…)." },
        tono: { type: "string" },
        instrucciones: { type: "string", description: "Cómo abordar a este cliente: apertura, argumentos, objeciones y cierre. Sin datos personales." },
      },
      required: ["nombre", "instrucciones"],
    },
  },
  {
    name: "proponer_rol_base",
    description: "Deja como PROPUESTA cargar un rol guardado a una base del perfil (o sacarlo con rol vacío). Desde ahí el agente aborda a los contactos de esa base con ese rol.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        base: { type: "string", description: "Nombre o id de la base" },
        rol: { type: "string", description: "Nombre o id del rol; vacío = volver al agente del perfil" },
      },
      required: ["base"],
    },
  },
  // 13/11 · «dale permisos a TODO»: cualquier operación del panel, el menú del perfil y los pedidos de código.
  {
    name: "operaciones_del_panel",
    description:
      "Busca en el catálogo de operaciones del panel (todo lo que se puede hacer desde las pantallas: personas, chats, seguimiento, campañas, bases, plantillas, líneas, bot, agenda, redes, incidencias, marketing y ajustes). Devuelve la clave de cada operación, qué hace, qué datos pide y qué confirmación lleva. Usala SIEMPRE antes de proponer_operacion, y cuando te pregunten qué podés hacer. Solo lectura.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        buscar: { type: "string", description: "Palabras de lo que se quiere hacer (por ejemplo: «archivar base», «reprogramar cita», «horario de atención»)" },
        grupo: { type: "string", description: "Opcional: personas, chats, seguimiento, campañas, bases, plantillas, líneas, bot, agenda, redes y contenido, incidencias, marketing, ajustes del perfil, ajustes generales, pedidos a Claude" },
      },
    },
  },
  {
    name: "proponer_operacion",
    description:
      "Deja como PROPUESTA una operación del catálogo (la clave sale de operaciones_del_panel). No ejecuta nada: se hace cuando la responsable confirma, con las mismas validaciones que la pantalla. El perfil es siempre el que está abierto: no lo mandes. Si una herramienta específica cubre el pedido (campañas, chats, bot, publicaciones), usá esa.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        clave: { type: "string", description: "Clave exacta de la operación" },
        sobre: { type: "string", description: "Sobre qué cosa, si la operación pide identificar una sola: nombre o teléfono de la persona, nombre de la campaña, la base, la línea o la plantilla, o su identificador" },
        identificar: { type: "object", description: "Solo si la operación pide identificar más de una cosa: un dato por cada una, con el nombre que figura en «necesita_identificar»" },
        parametros: { type: "object", description: "Datos de la operación, con los nombres exactos que devolvió operaciones_del_panel" },
      },
      required: ["clave"],
    },
  },
  {
    name: "proponer_menu",
    description:
      "Deja como PROPUESTA cambios en el menú de ESTE perfil: renombrar una sección o una pestaña, ocultar o volver a mostrar una sección, o moverla de lugar. No toca otros perfiles. Hoy y Ajustes no se pueden ocultar. Se puede deshacer.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        cambios: {
          type: "array",
          description: "Uno o más cambios",
          items: {
            type: "object",
            properties: {
              seccion: { type: "string", description: "Sección del menú (por su nombre: Hoy, Chats, Contactos, Campañas, Bot IA, Líneas y plantillas, Redes, Ajustes)" },
              nombre: { type: "string", description: "Nombre nuevo de la sección (vacío = volver al original)" },
              oculta: { type: "boolean", description: "true para ocultarla, false para volver a mostrarla" },
              posicion: { type: "integer", description: "Lugar dentro de su grupo, empezando en 1" },
              pestana: { type: "string", description: "Nombre actual de una pestaña de esa sección, para renombrarla" },
              nombre_pestana: { type: "string", description: "Nombre nuevo de la pestaña (vacío = volver al original)" },
            },
            required: ["seccion"],
          },
        },
        restablecer: { type: "boolean", description: "true para volver al menú original del perfil" },
      },
    },
  },
  {
    name: "pedir_cambio_de_codigo",
    description:
      "Para lo que no se puede hacer desde el panel porque hay que programarlo (una pantalla nueva, cambiar cómo funciona algo, un diseño, un arreglo): deja como PROPUESTA una tarea en la Bandeja para Claude con el pedido completo. Al confirmar queda anotada; Claude la toma cuando la responsable le avisa. No cambia nada en el momento.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        pantalla: { type: "string", description: "Qué pantalla o parte del panel" },
        que_cambiar: { type: "string", description: "Qué hay que cambiar, con el detalle que dio la responsable" },
        como_se_comprueba: { type: "string", description: "Cómo se ve que quedó bien hecho" },
      },
      required: ["que_cambiar"],
    },
  },
  {
    name: "ir_a_pantalla",
    description:
      "Devuelve un botón para abrir una pantalla del panel. Destinos: campanas (cargar o revisar campañas), bases (cargar una base), contactos (clientes, citas y seguimiento), prospectos (base fría por base), revision (seguimientos caídos y perdidos), citas, conversaciones (oportunidades activas), publicaciones, contenido, plantillas, perfil_whatsapp, publicidad, agentes, configuracion, estadisticas.",
    parametersJsonSchema: {
      type: "object",
      properties: { destino: { type: "string" } },
      required: ["destino"],
    },
  },
  // 24/10: chats (leer, responder, tomar o soltar, captar y derivar).
  ...DECLARACIONES_CHATS,
];

/** Pantallas a las que el asistente puede llevar (rutas internas, sin datos). Pura. */
export function rutaDestino(slug: SlugPerfil, destino: string): { href: string; texto: string } | null {
  const base = slug === "juridico" ? "" : `/panel/${slug}`;
  const p = `perfil=${slug}`;
  const mapa: Record<string, { href: string; texto: string }> = {
    campanas: { href: `${base}/campanas`, texto: "Abrir Campañas" },
    bases: { href: `${base}/bases`, texto: "Cargar una base" },
    contactos: { href: `/contactos?${p}`, texto: "Ver contactos" },
    prospectos: { href: `/prospectos-por-base?${p}`, texto: "Ver prospectos por base" },
    revision: { href: `/recuperar?${p}`, texto: "Ver qué se cayó" },
    citas: { href: `${base}/agenda`, texto: "Ver citas" },
    conversaciones: { href: `/conversaciones?${p}`, texto: "Ver conversaciones" },
    publicaciones: { href: `/redes?${p}`, texto: "Ver publicaciones" },
    contenido: { href: `/contenido?${p}`, texto: "Abrir Contenido" },
    plantillas: { href: `/redes/plantillas?${p}`, texto: "Abrir Plantillas" },
    perfil_whatsapp: { href: `/redes/perfiles?${p}`, texto: "Editar perfiles de redes" },
    perfiles_redes: { href: `/redes/perfiles?${p}`, texto: "Editar perfiles de Facebook, Instagram y WhatsApp" },
    publicidad: { href: `/redes/publicidad?${p}`, texto: "Abrir Publicidad" },
    agentes: { href: `${base}/agentes`, texto: "Ver agentes IA" },
    configuracion: { href: `${base}/configuracion`, texto: "Abrir Configuración" },
    estadisticas: { href: `${base}/estadisticas`, texto: "Ver estadísticas" },
  };
  return mapa[destino] ?? null;
}

/** Fechas del calendario pedido (hora de Argentina, UTC−3). Pura. */
export interface PedidoCalendario {
  dias: number;
  desde: string;
  postsPorDia: number;
  historiasPorDia: number;
  carruselCadaDias: number;
  redes: ("instagram" | "facebook")[];
}

export interface Hueco {
  formato: "post" | "historia" | "carrusel";
  fecha: string;
  dia: number;
}

const HORAS_POST = [10, 13, 19];
const HORAS_HISTORIA = [18, 12, 21];
const HORA_CARRUSEL = 15;

export function normalizarPedido(args: Record<string, unknown>, hoyArgentina: string): PedidoCalendario {
  const entero = (v: unknown, min: number, max: number, def: number) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
  };
  const desdeValido = typeof args.desde === "string" && /^\d{4}-\d{2}-\d{2}$/.test(args.desde) && args.desde > hoyArgentina ? args.desde : siguienteDia(hoyArgentina);
  const redes = Array.isArray(args.redes) ? (args.redes.filter((r) => r === "instagram" || r === "facebook") as ("instagram" | "facebook")[]) : [];
  return {
    dias: entero(args.dias, 1, 31, 7),
    desde: desdeValido,
    postsPorDia: entero(args.posts_por_dia, 0, 3, 1),
    historiasPorDia: entero(args.historias_por_dia, 0, 3, 1),
    carruselCadaDias: entero(args.carrusel_cada_dias, 0, 31, 2),
    redes: redes.length ? Array.from(new Set(redes)) : ["instagram", "facebook"],
  };
}

export function siguienteDia(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Huecos del calendario: cada formato a su hora, en hora argentina. */
export function huecosCalendario(p: PedidoCalendario): Hueco[] {
  const out: Hueco[] = [];
  let dia = p.desde;
  for (let i = 0; i < p.dias; i++) {
    const enHora = (h: number) => new Date(`${dia}T${String(h).padStart(2, "0")}:00:00-03:00`).toISOString();
    for (let k = 0; k < p.postsPorDia; k++) out.push({ formato: "post", fecha: enHora(HORAS_POST[k]), dia: i });
    for (let k = 0; k < p.historiasPorDia; k++) out.push({ formato: "historia", fecha: enHora(HORAS_HISTORIA[k]), dia: i });
    if (p.carruselCadaDias > 0 && i % p.carruselCadaDias === 0) out.push({ formato: "carrusel", fecha: enHora(HORA_CARRUSEL), dia: i });
    dia = siguienteDia(dia);
  }
  return out;
}

/** Hoy en la Argentina, AAAA-MM-DD. */
export function hoyEnArgentina(ahora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);
}
