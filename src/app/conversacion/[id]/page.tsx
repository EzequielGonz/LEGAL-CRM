import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePageSession } from "@/lib/acceso/pagina";
import { volverSeguro } from "@/lib/navegacion";

export const dynamic = "force-dynamic";

/**
 * Dirección vieja de las conversaciones de Coberturas, Autos 0 km y
 * Marketing. Desde el 24/10 hay un solo chat: se abre en la lista del perfil
 * (/panel/<perfil>/chats/<id>), igual que el Inbox de Jurídico.
 */
export default async function ConversacionPerfilPage({ params, searchParams }: { params: { id: string }; searchParams?: { volver?: string } }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const volver = volverSeguro(searchParams?.volver);
  const { data: conversation } = await createClient().from("conversations").select("id, contacts(area)").eq("id", params.id).single();
  if (!conversation) notFound();
  const area = (conversation.contacts as any)?.area as string | undefined;
  const extra = volver ? `?volver=${encodeURIComponent(volver)}` : "";
  if (!area || area === "civil" || area === "penal") redirect(`/inbox/${conversation.id}${extra}`);
  redirect(`/panel/${area}/chats/${conversation.id}${extra}`);
}
