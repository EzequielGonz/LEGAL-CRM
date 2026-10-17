/**
 * Contexto de regreso (rediseño 17/10, bloque 1). Toda la cadena
 * lista → ficha → conversación lleva en la dirección `?volver=<origen>`,
 * así «Volver» devuelve exactamente a la lista (con filtros, orden y
 * página), a la ficha o a la conversación desde la que se abrió.
 * Funciones puras, sin dependencias del navegador.
 */
import type { SlugPerfil } from "@/lib/marca";

/** Solo rutas internas (nunca otra web ni rutas con barra invertida). */
export function volverSeguro(v: unknown): string | null {
  return typeof v === "string" && v.startsWith("/") && !v.startsWith("//") && !v.includes("\\") ? v : null;
}

/** Agrega (o reemplaza) `volver` en un enlace interno. */
export function conVolver(href: string, volver: string | null | undefined): string {
  const destino = volverSeguro(volver);
  if (!destino) return href;
  const [ruta, hash = ""] = href.split("#");
  const [camino, query = ""] = ruta.split("?");
  const p = new URLSearchParams(query);
  p.set("volver", destino);
  return `${camino}?${p.toString()}${hash ? `#${hash}` : ""}`;
}

/** Texto del enlace de regreso según adónde lleva. */
export function etiquetaVolver(volver: string | null | undefined): string {
  const v = volverSeguro(volver);
  if (!v) return "Volver";
  const camino = v.split("?")[0];
  if (camino.startsWith("/ficha/") || /^\/prospectos\/[^/]+$/.test(camino) || /^\/panel\/marketing\/lead\//.test(camino)) return "Volver a la ficha";
  if (camino.startsWith("/inbox/") || camino.startsWith("/conversacion/")) return "Volver a la conversación";
  if (camino === "/inicio" || camino === "/perfiles") return "Volver al inicio";
  if (camino === "/comparacion-agentes") return "Volver a la comparación";
  if (camino === "/revision") return "Volver a Revisión";
  if (camino === "/telefono" || /^\/telefono\/[^/]+$/.test(camino)) return "Volver al teléfono";
  if (camino === "/" || /^\/panel\/[^/]+$/.test(camino)) return "Volver al panel";
  return "Volver a la lista";
}

/** Pantalla principal de cada perfil (Jurídico conserva sus rutas sin prefijo). */
export function inicioDePerfil(slug: SlugPerfil): string {
  return slug === "juridico" ? "/" : `/panel/${slug}`;
}

/** Perfil al que pertenece un área de contacto (civil y penal son Jurídico). */
export function perfilDeArea(area: unknown): SlugPerfil {
  if (area === "coberturas_medicas" || area === "agencia_0km" || area === "marketing") return area;
  return "juridico";
}

/** Ficha completa de un contacto según su perfil. */
export function fichaDe(contactId: string, area: unknown): string {
  return perfilDeArea(area) === "juridico" ? `/prospectos/${contactId}` : `/ficha/${contactId}`;
}
