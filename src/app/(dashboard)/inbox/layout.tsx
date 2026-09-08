import { createClient } from "@/lib/supabase/server";
import { ConversationList, type ConversationListItem } from "@/components/inbox/conversation-list";

export const dynamic = "force-dynamic";

// Nota: los layouts de Next.js (a diferencia de los page.tsx) NO reciben
// `searchParams` como prop — por eso el filtro por área/canal se aplica del
// lado del cliente, dentro de <ConversationList> (que ya es "use client" y
// ya lee los searchParams con el hook useSearchParams para los <select> de
// filtro). Acá simplemente traemos todas las conversaciones recientes.
async function getConversations() {
  const supabase = createClient();

  const { data } = await supabase
    .from("conversations")
    .select(
      "id, area, status, last_message_at, ai_enabled, contacts(full_name), channels(type)"
    )
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(100);

  const items: ConversationListItem[] = (data ?? []).map((c: any) => ({
    id: c.id,
    area: c.area,
    status: c.status,
    last_message_at: c.last_message_at,
    ai_enabled: c.ai_enabled,
    contact_name: c.contacts?.full_name ?? null,
    channel_type: c.channels?.type ?? "whatsapp",
    last_message_preview: null,
  }));

  return items;
}

export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  const items = await getConversations();

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-8">
      <ConversationList items={items} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
