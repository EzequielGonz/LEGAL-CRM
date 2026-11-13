import { type SlugPerfil } from "@/lib/marca";
import { RUBRO_IDS } from "@/lib/rubros";
import { perfilActivo } from "@/lib/perfil-activo";

/**
 * Perfil de las páginas comunes de Redes (?perfil=<slug>). Sin perfil, el
 * último en el que se estuvo (13/11: antes caía en Jurídico); si no hay
 * ninguno, se vuelve a elegir perfil.
 */
export function perfilDePagina(perfil: unknown): { slug: SlugPerfil; rubroId: string } {
  const slug = perfilActivo(perfil);
  return { slug, rubroId: RUBRO_IDS[slug] };
}
