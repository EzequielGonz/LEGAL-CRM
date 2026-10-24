import { notFound } from "next/navigation";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { RUBRO_IDS } from "@/lib/rubros";

/**
 * Perfil de las páginas comunes de Redes (?perfil=<slug>). Sin perfil, el de
 * Jurídico (24/10: antes daba 404); un valor que no existe = 404.
 */
export function perfilDePagina(perfil: unknown): { slug: SlugPerfil; rubroId: string } {
  if (perfil === undefined || perfil === null || perfil === "") perfil = "juridico";
  if (!esSlugPerfil(perfil)) notFound();
  return { slug: perfil, rubroId: RUBRO_IDS[perfil] };
}
