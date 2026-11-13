/**
 * Accesos a las redes desde el panel (12/11, pedido de la responsable).
 *
 * Instagram, Facebook y WhatsApp no permiten mostrarse dentro de otra página
 * (lo bloquean ellos, no el panel). Lo más cercano es abrir cada uno en una
 * ventana propia, del tamaño de un celular, al lado del panel: queda con la
 * sesión iniciada y se vuelve a ella con un clic. Acá se guardan las
 * direcciones de cada perfil. Reglas puras: se prueban solas.
 */

export type ClaveAcceso = "instagram" | "instagram_mensajes" | "facebook" | "facebook_mensajes" | "whatsapp_web" | "whatsapp_business" | "metricool" | "landing";

export interface Acceso {
  clave: ClaveAcceso;
  grupo: "Instagram" | "Facebook" | "WhatsApp" | "Otros";
  titulo: string;
  detalle: string;
  /** Dirección fija (igual para todos los perfiles) o null si la carga cada perfil. */
  fija: string | null;
  /** Dominios permitidos cuando la dirección la carga la responsable. */
  dominios: string[];
  ejemplo?: string;
}

export const ACCESOS: Acceso[] = [
  { clave: "instagram", grupo: "Instagram", titulo: "Perfil de Instagram", detalle: "Ver el perfil, las publicaciones y las historias.", fija: null, dominios: ["instagram.com"], ejemplo: "https://www.instagram.com/tu_usuario" },
  { clave: "instagram_mensajes", grupo: "Instagram", titulo: "Mensajes de Instagram", detalle: "La bandeja de mensajes directos.", fija: "https://www.instagram.com/direct/inbox/", dominios: [] },
  { clave: "facebook", grupo: "Facebook", titulo: "Página de Facebook", detalle: "Ver la página y sus publicaciones.", fija: null, dominios: ["facebook.com", "fb.com"], ejemplo: "https://www.facebook.com/tu_pagina" },
  { clave: "facebook_mensajes", grupo: "Facebook", titulo: "Bandeja de Meta", detalle: "Mensajes y comentarios de Facebook e Instagram juntos.", fija: "https://business.facebook.com/latest/inbox/all", dominios: [] },
  { clave: "whatsapp_web", grupo: "WhatsApp", titulo: "WhatsApp Web", detalle: "El WhatsApp del celular, en la computadora.", fija: "https://web.whatsapp.com/", dominios: [] },
  { clave: "whatsapp_business", grupo: "WhatsApp", titulo: "Administrador de WhatsApp", detalle: "Calidad de la línea y plantillas de Meta.", fija: "https://business.facebook.com/wa/manage/home/", dominios: [] },
  { clave: "metricool", grupo: "Otros", titulo: "Metricool", detalle: "Calendario de publicaciones y estadísticas.", fija: "https://app.metricool.com/", dominios: [] },
  { clave: "landing", grupo: "Otros", titulo: "Página web", detalle: "La landing del perfil.", fija: null, dominios: [], ejemplo: "https://tu-sitio.com" },
];

export type AccesosGuardados = Partial<Record<ClaveAcceso, string>>;

/**
 * Valida una dirección cargada a mano: solo https, sin usuario ni contraseña,
 * y del dominio que corresponde. Devuelve la dirección limpia o el error.
 */
export function direccionValida(clave: ClaveAcceso, valor: unknown): { ok: true; url: string | null } | { ok: false; error: string } {
  const acceso = ACCESOS.find((a) => a.clave === clave);
  if (!acceso || acceso.fija) return { ok: false, error: "Ese acceso no se puede cambiar." };
  const texto = typeof valor === "string" ? valor.trim() : "";
  if (!texto) return { ok: true, url: null };
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`);
  } catch {
    return { ok: false, error: "No parece una dirección web. Copiala de la barra del navegador." };
  }
  if (u.protocol !== "https:") return { ok: false, error: "La dirección tiene que empezar con https://" };
  if (u.username || u.password) return { ok: false, error: "La dirección no puede incluir usuario ni contraseña." };
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  if (acceso.dominios.length && !acceso.dominios.some((d) => host === d || host.endsWith(`.${d}`))) {
    return { ok: false, error: `Tiene que ser una dirección de ${acceso.dominios[0]}.` };
  }
  return { ok: true, url: u.toString().slice(0, 300) };
}

/** Lista para mostrar: cada acceso con la dirección que abre (o null si falta cargarla). */
export function accesosDe(guardados: AccesosGuardados): (Acceso & { url: string | null })[] {
  return ACCESOS.map((a) => ({ ...a, url: a.fija ?? guardados[a.clave] ?? null }));
}
