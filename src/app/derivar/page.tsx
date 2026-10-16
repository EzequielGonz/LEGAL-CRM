import { redirect } from "next/navigation";
import { requirePageSession } from "@/lib/acceso/pagina";

export const dynamic = "force-dynamic";

/**
 * La pantalla anterior "Casos listos para derivar" marcaba Derivado al tocar
 * "Enviar a WhatsApp" y mandaba la conversación completa en el texto. Desde
 * la Etapa 1 (bloques 1.7 y 1.9) el modo teléfono es /telefono: Clientes
 * cerrados abre la ficha, compartir no cambia el estado y Derivado se marca
 * a mano. Esta dirección queda como acceso directo para no romper enlaces
 * guardados.
 */
export default async function DerivarPage() {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  redirect("/telefono");
}
