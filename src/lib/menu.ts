/**
 * Menú del panel (reorganización 18/10). Seis secciones iguales en los
 * cuatro perfiles; cada sección agrupa sus vistas en pestañas:
 *
 * 24/10: dos grupos. Trabajo (Hoy · Chats · Contactos · Campañas) y
 * Configurar (Bot IA · Línea y plantillas · Redes · Ajustes).
 *
 *  1. Inicio          — resumen (captados primero), estadísticas y salud.
 *  2. Conversaciones  — chats y lo que pide una persona.
 *  3. Contactos       — oportunidades, citas, seguimiento y cerrados.
 *  4. Captación       — campañas y bases.
 *  5. Redes y contenido — publicaciones, contenido, perfiles de WhatsApp,
 *                       plantillas y publicidad.
 *  6. Configuración   — ajustes del perfil y agentes IA.
 *
 * Jurídico conserva sus direcciones históricas (sin prefijo); los demás
 * perfiles viven bajo /panel/<slug>. Las páginas comunes reciben
 * ?perfil=<slug>. Puro: sin dependencias del navegador ni de la base.
 */
import type { SlugPerfil } from "@/lib/marca";

export interface ItemMenu {
  href: string;
  label: string;
  /** Prefijo que marca el ítem como activo (por defecto, la ruta del href). */
  match?: string;
  /** Activo solo con coincidencia exacta. */
  exacto?: boolean;
  /** Además de la ruta, uno de estos valores de ?indicador= (vistas filtradas). */
  indicadores?: string[];
  /** Marca la sección como activa pero no se muestra como pestaña (listas completas, vistas viejas). */
  oculto?: boolean;
}

export type ClaveSeccion = "inicio" | "conversaciones" | "contactos" | "captacion" | "bot" | "linea" | "redes" | "configuracion";

export interface SeccionMenu {
  clave: ClaveSeccion;
  /** 24/10: «trabajo» (lo diario) o «configurar». */
  grupo: "trabajo" | "configurar";
  label: string;
  /** Nombre del ícono (ver `Icono`). */
  icono: string;
  /** Primera pestaña: a dónde lleva el ítem del menú. */
  href: string;
  tabs: ItemMenu[];
}

/** Compatibilidad: un grupo por sección, con sus pestañas como ítems. */
export interface GrupoMenu {
  titulo: string;
  items: ItemMenu[];
}

const INDICADORES_CONVERSACION = ["en_conversacion", "requiere_humano", "humano_en_curso", "piden_persona", "captado_sin_derivar", "seguimiento_caido", "dejaron_de_responder", "perdido_comercial", "detencion_reciente"];

function comun(slug: SlugPerfil, ruta: string, extra?: Record<string, string>): string {
  const p = new URLSearchParams({ perfil: slug, ...(extra ?? {}) });
  return `/${ruta}?${p.toString()}`;
}

function seccion(clave: ClaveSeccion, label: string, icono: string, tabs: ItemMenu[], grupo: SeccionMenu["grupo"] = "trabajo"): SeccionMenu {
  return { clave, label, icono, href: tabs[0].href, tabs, grupo };
}

export function seccionesDePerfil(slug: SlugPerfil): SeccionMenu[] {
  const j = slug === "juridico";
  const base = j ? "" : `/panel/${slug}`;
  const mk = slug === "marketing";

  const inicio: ItemMenu[] = [
    { href: comun(slug, "hoy"), label: "Resumen", match: "/hoy" },
    { href: `${base}/estadisticas`, label: "Historial" },
    { href: comun(slug, "salud"), label: "Salud del sistema", match: "/salud" },
  ];

  // Reorganización 2 (18/10): Conversaciones y Contactos muestran solo lo que
  // vale la pena, agrupado; la base fría vive en Prospectos, por base.
  const conversaciones: ItemMenu[] = [
    { href: comun(slug, "conversaciones"), label: "Oportunidades", match: "/conversaciones" },
    // 21/10: «Todos los chats» en los cuatro perfiles, cada uno con los suyos.
    { href: j ? "/inbox" : `${base}/chats`, label: "Todos los chats" },
    ...(mk ? [{ href: `${base}/consultas-directas`, label: "Consultas directas" }] : []),
    { href: comun(slug, "recuperar"), label: "Para recuperar", match: "/recuperar" },
    ...(j ? [{ href: "/revision", label: "Incidencias" }] : []),
    { href: comun(slug, "oportunidades", { indicador: "en_conversacion" }), label: "Lista", match: "/oportunidades", indicadores: INDICADORES_CONVERSACION, oculto: true },
  ];

  const contactos: ItemMenu[] = [
    { href: comun(slug, "contactos"), label: "Cartera", match: "/contactos" },
    { href: `${base}/agenda`, label: "Citas" },
    { href: `${base}/seguimiento`, label: "Seguimiento" },
    { href: `${base}/casos-cerrados`, label: j ? "Casos" : "Clientes cerrados" },
    ...(mk
      ? [
          { href: `${base}/prospectos`, label: "Prioritarios" },
          { href: `${base}/presupuestos`, label: "Piden presupuesto" },
        ]
      : []),
    { href: comun(slug, "prospectos-por-base"), label: "Prospectos", match: "/prospectos-por-base" },
    ...(j ? [{ href: "/prospectos", label: "Buscar en la base", oculto: true }] : []),
    { href: comun(slug, "oportunidades"), label: "Lista", match: "/oportunidades", oculto: true },
  ];

  const captacion: ItemMenu[] = [
    { href: `${base}/campanas`, label: "Campañas" },
    { href: `${base}/bases`, label: "Bases" },
    ...(mk
      ? [
          { href: `${base}/extraer`, label: "Extraer negocios" },
          // 24/10: el buscador viejo («Análisis») queda dentro de Extraer negocios.
          { href: `${base}/captacion`, label: "Búsquedas anteriores", oculto: true },
        ]
      : []),
  ];

  const redes: ItemMenu[] = [
    { href: comun(slug, "redes"), label: "Publicaciones", match: "/redes", exacto: true },
    { href: comun(slug, "contenido"), label: "Contenido", match: "/contenido" },
    { href: comun(slug, "redes/publicidad"), label: "Publicidad", match: "/redes/publicidad" },
  ];

  // 24/10: la línea de WhatsApp (calidad, plantillas y perfil) tiene sección propia.
  const linea: ItemMenu[] = [
    { href: comun(slug, "redes/plantillas"), label: "Plantillas", match: "/redes/plantillas" },
    { href: comun(slug, "redes/perfiles"), label: "Perfil de WhatsApp y redes", match: "/redes/perfiles" },
    { href: comun(slug, "redes/whatsapp"), label: "Perfil de WhatsApp", match: "/redes/whatsapp", oculto: true },
  ];

  // 24/10: el bot tiene sección propia (antes estaba dentro de Configuración).
  const bot: ItemMenu[] = [{ href: `${base}/agentes`, label: "Bot IA" }];

  const configuracion: ItemMenu[] = [{ href: `${base}/configuracion`, label: "Ajustes" }];

  return [
    seccion("inicio", "Hoy", "inicio", inicio),
    seccion("conversaciones", "Chats", "inbox", conversaciones),
    seccion("contactos", "Contactos", "prospectos", contactos),
    seccion("captacion", "Campañas", "campanas", captacion),
    seccion("bot", "Bot IA", "agentes", bot, "configurar"),
    seccion("linea", "Línea y plantillas", "consultas", linea, "configurar"),
    seccion("redes", "Redes", "redes", redes, "configurar"),
    seccion("configuracion", "Ajustes", "configuracion", configuracion, "configurar"),
  ];
}

/** Compatibilidad con el armado anterior: un grupo por sección. */
export function menuDePerfil(slug: SlugPerfil): GrupoMenu[] {
  return seccionesDePerfil(slug).map((s) => ({ titulo: s.label, items: s.tabs }));
}

function puntaje(it: ItemMenu, pathname: string, params: URLSearchParams | null): number {
  const ruta = it.match ?? it.href.split("?")[0];
  const ok = it.exacto ? pathname === ruta : pathname === ruta || pathname.startsWith(`${ruta}/`);
  if (!ok) return -1;
  if (it.indicadores) {
    const ind = params?.get("indicador") ?? "";
    if (!it.indicadores.includes(ind)) return -1;
    return ruta.length + 1000;
  }
  return ruta.length;
}

function aParams(search?: string | URLSearchParams | null): URLSearchParams | null {
  if (!search) return null;
  return typeof search === "string" ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search) : search;
}

/**
 * Ítem activo: el de prefijo más largo que coincide con la ruta actual; las
 * vistas filtradas (?indicador=) ganan cuando el filtro coincide.
 */
export function itemActivo(grupos: GrupoMenu[], pathname: string, search?: string | URLSearchParams | null): string | null {
  const params = aParams(search);
  let mejor: { href: string; p: number } | null = null;
  for (const g of grupos) {
    for (const it of g.items) {
      const p = puntaje(it, pathname, params);
      if (p >= 0 && (!mejor || p > mejor.p)) mejor = { href: it.href, p };
    }
  }
  return mejor?.href ?? null;
}

/** Sección y pestaña activas para la ruta actual. */
export function seccionActiva(
  secciones: SeccionMenu[],
  pathname: string,
  search?: string | URLSearchParams | null
): { seccion: SeccionMenu; tab: ItemMenu } | null {
  const params = aParams(search);
  let mejor: { seccion: SeccionMenu; tab: ItemMenu; p: number } | null = null;
  for (const s of secciones) {
    for (const t of s.tabs) {
      const p = puntaje(t, pathname, params);
      if (p >= 0 && (!mejor || p > mejor.p)) mejor = { seccion: s, tab: t, p };
    }
  }
  return mejor ? { seccion: mejor.seccion, tab: mejor.tab } : null;
}
