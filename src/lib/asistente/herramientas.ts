/**
 * Herramientas del asistente del panel (18/10).
 *
 * Dos tipos:
 *  - Consulta: leen y responden en el momento (cifras, captados, bots).
 *  - Propuesta: preparan una acción y la dejan en `asistente_acciones` como
 *    «propuesta». Nada se ejecuta hasta que la responsable confirma en el
 *    panel (botón «Confirmar»). Nunca envían mensajes a personas ni inician
 *    campañas.
 */
import type { SlugPerfil } from "@/lib/marca";

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
    description: "Deja como PROPUESTA pausar la campaña en curso del perfil (pausar nunca envía mensajes). Para cargar o reanudar una campaña, usá ir_a_pantalla.",
    parametersJsonSchema: {
      type: "object",
      properties: { motivo: { type: "string" } },
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
