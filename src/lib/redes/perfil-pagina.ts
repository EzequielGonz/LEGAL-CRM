import { notFound } from "next/navigation";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { RUBRO_IDS } from "@/lib/rubros";

/** Perfil de las páginas comunes de Redes (?perfil=<slug>); otro valor = 404. */
export function perfilDePagina(perfil: unknown): { slug: SlugPerfil; rubroId: string } {
  if (!esSlugPerfil(perfil)) notFound();
  return { slug: perfil, rubroId: RUBRO_IDS[perfil] };
}
