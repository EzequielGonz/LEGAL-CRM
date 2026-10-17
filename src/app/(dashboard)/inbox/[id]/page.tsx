import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConversationThread } from "@/components/inbox/conversation-thread";
import { FichaSection } from "@/components/ficha/ficha-section";
import { volverSeguro, fichaDe } from "@/lib/navegacion";
import { EnlaceVolver } from "@/components/ui/enlaces-navegacion";

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
  // Conversaciones de Coberturas, Autos 0 km y Marketing: se abren con el
  // marco (menú y colores) de su propio perfil.
  const areaConv = (conversation.contacts as any)?.area as string | undefined;
  if (areaConv && areaConv !== "civil" && areaConv !== "penal") {
    redirect(`/conversacion/${conversation.id}${volver ? `?volver=${encodeURIComponent(volver)}` : ""}`);
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", params.id)
    .order("created_at", { ascending: true });

  const contact = conversation.contacts as any;

  return (
    <>
      {volver && <EnlaceVolver volver={volver} respaldo="/inbox" className="tactil mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:underline" />}
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
      ficha={<FichaSection contactId={contact.id} compact fullHref={fichaDe(contact.id, contact.area)} />}
    />
    </>
  );
}
