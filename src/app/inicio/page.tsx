import { redirect } from "next/navigation";
import { requirePageSession } from "@/lib/acceso/pagina";

export const metadata = { title: "Inicio" };

export const dynamic = "force-dynamic";

/**
 * 21/10 (pedido de la responsable): después del PIN se entra directo a los
 * perfiles; ya no se elige «Teléfono o computadora». Esta dirección queda
 * para no romper enlaces viejos y lleva siempre a /perfiles.
 */
export default async function InicioPage() {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  redirect("/perfiles");
}
