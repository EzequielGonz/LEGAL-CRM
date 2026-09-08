import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConversationThread } from "@/components/inbox/conversation-thread";

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: { id: string } }) {
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
    />
  );
}
