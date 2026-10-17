import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConversationThread } from "@/components/inbox/conversation-thread";
import { FichaSection } from "@/components/ficha/ficha-section";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { requirePageSession } from "@/lib/acceso/pagina";
import { volverSeguro } from "@/lib/navegacion";
import { EnlaceVolver } from "@/components/ui/enlaces-navegacion";
import { esSlugPerfil } from "@/lib/marca";

export const dynamic = "force-dynamic";

/**
 * Conversación de un perfil que no es Jurídico (16/10): la misma vista del
 * Inbox, dentro del menú y los colores de su perfil.
 */
export default async function ConversacionPerfilPage({ params, searchParams }: { params: { id: string }; searchParams?: { volver?: string } }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const volver = volverSeguro(searchParams?.volver);
  const supabase = createClient();
  const { data: conversation } = await supabase.from("conversations").select("id, ai_enabled, contacts(*)").eq("id", params.id).single();
  if (!conversation) notFound();
  const contact = conversation.contacts as any;
  const slug = contact?.area;
  if (!esSlugPerfil(slug) || slug === "juridico") redirect(`/inbox/${conversation.id}`);

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", params.id)
    .order("created_at", { ascending: true });

  return (
    <MarcoPerfil slug={slug}>
      <EnlaceVolver
        volver={volver}
        respaldo={`/ficha/${contact.id}`}
        textoRespaldo="Ver la ficha"
        className="tactil mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:underline"
      />
      <div className="h-[calc(100vh-9rem)] overflow-hidden rounded-xl border border-slate-200 bg-white">
        <ConversationThread
          conversationId={conversation.id}
          aiEnabled={conversation.ai_enabled}
          contact={{
            id: contact.id,
            full_name: contact.full_name,
            phone: contact.phone,
            email: contact.email,
            area: contact.area,
            status: contact.status,
            source: contact.source,
            qualification_data: contact.qualification_data ?? {},
          }}
          initialMessages={messages ?? []}
          ficha={<FichaSection contactId={contact.id} compact fullHref={`/ficha/${contact.id}`} />}
        />
      </div>
    </MarcoPerfil>
  );
}
