/**
 * Cada rubro separado (13/11, pedido de la responsable: «que cada rubro sea
 * separado […] que no se mezcle nada con nada»).
 *
 * El panel de Jurídico vive en la raíz (/inbox, /campanas…) y el de los demás
 * perfiles bajo /panel/<perfil>/…; las pantallas comunes llevan ?perfil=.
 * Estas funciones son la única fuente para saber de qué perfil es una
 * dirección y para armar la dirección equivalente en otro perfil. Puras: las
 * usan el middleware, las pantallas y las pruebas.
 */
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";

export const COOKIE_PERFIL = "perfil_activo";

/** Secciones que Jurídico tiene en la raíz y los demás perfiles bajo /panel/<perfil>/. */
const RAIZ_A_PANEL: Record<string, string> = {
  inbox: "chats",
  campanas: "campanas",
  bases: "bases",
  seguimiento: "seguimiento",
  agenda: "agenda",
  agentes: "agentes",
  estadisticas: "estadisticas",
  "casos-cerrados": "casos-cerrados",
  configuracion: "configuracion",
};

/** Rutas de la raíz que son solo de Jurídico (además de las de arriba). */
const SOLO_RAIZ = ["prospectos"];

export type SeccionPerfil = "chats" | "campanas" | "bases" | "seguimiento" | "agenda" | "agentes" | "estadisticas" | "casos-cerrados" | "configuracion";

const PANEL_A_RAIZ: Record<string, string> = Object.fromEntries(Object.entries(RAIZ_A_PANEL).map(([raiz, panel]) => [panel, raiz]));

/** Dirección de una sección (y, si hace falta, de un elemento) dentro del perfil pedido. */
export function rutaDePerfil(slug: SlugPerfil, seccion: SeccionPerfil, id?: string | null): string {
  const base = slug === "juridico" ? `/${PANEL_A_RAIZ[seccion]}` : `/panel/${slug}/${seccion}`;
  return id ? `${base}/${id}` : base;
}

/** Primer tramo de una ruta ("/inbox/123" → "inbox"). */
function tramo(pathname: string): string {
  return pathname.split("/")[1] ?? "";
}

/** ¿Es una pantalla del panel de Jurídico en la raíz? */
export function esRutaRaizJuridico(pathname: string): boolean {
  const t = tramo(pathname);
  return t in RAIZ_A_PANEL || SOLO_RAIZ.includes(t);
}

/**
 * Perfil al que pertenece una dirección, o null si la dirección sola no lo
 * dice (una ficha, un chat por id, una pantalla común sin ?perfil=).
 */
export function perfilDeRuta(pathname: string, perfilParam?: string | null): SlugPerfil | null {
  const enPanel = /^\/panel\/([a-z0-9_]+)(\/|$)/.exec(pathname)?.[1];
  if (enPanel) return esSlugPerfil(enPanel) ? enPanel : null;
  if (esRutaRaizJuridico(pathname)) return "juridico";
  return esSlugPerfil(perfilParam) ? perfilParam : null;
}

/**
 * Una pantalla de la raíz (de Jurídico) pedida desde otro perfil: devuelve la
 * misma pantalla dentro de ese perfil, para no sacar a la persona de donde
 * está. Devuelve null si no hay que redirigir (ya es Jurídico, la ruta no es
 * de la raíz, o es un elemento por id, que resuelve su propia pantalla).
 */
export function equivalenteEnPerfil(pathname: string, search: string, origen: SlugPerfil | null): string | null {
  if (!origen || origen === "juridico") return null;
  const partes = pathname.split("/").filter(Boolean);
  if (partes.length !== 1) return null;
  const t = partes[0];
  const q = search && search !== "?" ? search : "";
  if (t in RAIZ_A_PANEL) return `/panel/${origen}/${RAIZ_A_PANEL[t]}${q}`;
  if (t === "prospectos") return origen === "marketing" ? `/panel/marketing/prospectos${q}` : `/contactos?perfil=${origen}`;
  return null;
}

/** Perfil de la página desde la que se navega (encabezado Referer), si es del mismo sitio. */
export function perfilDeReferente(referer: string | null | undefined, origin: string): SlugPerfil | null {
  if (!referer) return null;
  try {
    const u = new URL(referer);
    if (u.origin !== origin) return null;
    return perfilDeRuta(u.pathname, u.searchParams.get("perfil"));
  } catch {
    return null;
  }
}
