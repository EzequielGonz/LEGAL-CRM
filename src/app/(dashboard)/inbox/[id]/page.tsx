import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConversationThread } from "@/components/inbox/conversation-thread";
import { FichaSection } from "@/components/ficha/ficha-section";
import Link from "next/link";
import { volverSeguro } from "@/lib/indicadores";

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params, searchParams }: { params: { id: string }; searchParams?: { volver?: string } }) {
  // Al llegar desde una lista (indicador, búsqueda), «Volver» conserva filtros, orden y página.
  const volver = volverSeguro(searchParams?.volver);
  const supabase = createClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, ai_enabled, contacts(*)")
    .eq("id", params.id)
    .single();

  if (!conversation) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", params.id)
    .order("created_at", { ascending: true });

  const contact = conversation.contacts as any;

  return (
    <>
      {volver && (
        <Link href={volver} className="tactil mb-2 inline-flex items-center text-sm text-slate-700 hover:underline">
          ← Volver a la lista
        </Link>
      )}
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
      ficha={<FichaSection contactId={contact.id} compact />}
    />
    </>
  );
}
