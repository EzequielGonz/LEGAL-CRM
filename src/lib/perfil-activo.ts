/**
 * Perfil en el que está trabajando la persona (13/11). Las pantallas comunes
 * (Hoy, Contactos, Resultados, Salud…) reciben el perfil en ?perfil=. Si un
 * enlace lo pierde, ya no se cae en Jurídico: se usa el último perfil en el
 * que se estuvo (cookie que escribe el middleware) y, si no hay ninguno, se
 * vuelve a elegir perfil. Solo servidor.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { COOKIE_PERFIL } from "@/lib/perfil-ruta";

export async function perfilActivo(pedido: unknown): Promise<SlugPerfil> {
  if (esSlugPerfil(pedido)) return pedido;
  const recordado = (await cookies()).get(COOKIE_PERFIL)?.value;
  if (esSlugPerfil(recordado)) return recordado;
  redirect("/perfiles");
}

/** Igual, para rutas de la API: el perfil pedido o el recordado; null si no hay ninguno. */
export async function perfilActivoApi(pedido: unknown): Promise<SlugPerfil | null> {
  if (esSlugPerfil(pedido)) return pedido;
  const recordado = (await cookies()).get(COOKIE_PERFIL)?.value;
  return esSlugPerfil(recordado) ? recordado : null;
}
