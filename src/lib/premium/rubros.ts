import { SLUGS_PERFIL, type SlugPerfil } from "@/lib/marca";

/** Nombre corto de cada rubro, como se lee en el panel. */
export const NOMBRE_RUBRO: Record<SlugPerfil, string> = {
  juridico: "Jurídico",
  coberturas_medicas: "Coberturas médicas",
  agencia_0km: "Autos 0 km",
  marketing: "Marketing",
};

/** Acentos del brief (22/11). Espejo de `--pm-ac-*` en `src/app/premium.css` (una prueba los compara). */
export const ACENTO_RUBRO: Record<SlugPerfil, string> = {
  juridico: "#8B9CFF",
  coberturas_medicas: "#4FD1C5",
  agencia_0km: "#F5B544",
  marketing: "#F47FBF",
};

export const FONDO_PREMIUM = "#0B0D12";
export const TEXTO_PREMIUM = { primario: "#F2F3F5", secundario: "#B8BDCA", terciario: "#868B99" };

export const RUBROS_PREMIUM: readonly SlugPerfil[] = SLUGS_PERFIL;

/** Clase que fija `--pm-acento` para un rubro. */
export function claseRubro(rubro: SlugPerfil): string {
  return `pm-rubro-${rubro}`;
}
