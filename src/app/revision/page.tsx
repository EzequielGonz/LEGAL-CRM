import { redirect } from "next/navigation";

/**
 * Dirección anterior de Incidencias (era una pantalla del panel de Jurídico
 * que mostraba a los cuatro perfiles). Desde el 13/11 cada perfil tiene la
 * suya en /incidencias?perfil=…; esta dirección queda para no romper enlaces
 * y avisos viejos, y lleva al perfil en el que se está.
 */
export default function RevisionAnterior({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const p = new URLSearchParams(Object.entries(searchParams ?? {}).filter((e): e is [string, string] => typeof e[1] === "string"));
  const q = p.toString();
  redirect(`/incidencias${q ? `?${q}` : ""}`);
}
