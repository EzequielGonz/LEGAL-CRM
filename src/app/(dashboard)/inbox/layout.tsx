import { createClient } from "@/lib/supabase/server";
import { ConversationList, type ConversationListItem } from "@/components/inbox/conversation-list";

export const dynamic = "force-dynamic";

async function getConversations(searchParams: { area?: string; canal?: string }) {
  const supabase = createClient();

  let query = supabase
    .from("conversations")
    .select(
      "id, area, status, last_message_at, ai_enabled, contacts(full_name), channels(type)"
    )
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(100);

  if (searchParams.area) query = query.eq("area", searchParams.area);

  const { data } = await query;

  let items: ConversationListItem[] = (data ?? []).map((c: any) => ({
    id: c.id,
    area: c.area,
    status: c.status,
    last_message_at: c.last_message_at,
    ai_enabled: c.ai_enabled,
    contact_name: c.contacts?.full_name ?? null,
    channel_type: c.channels?.type ?? "whatsapp",
    last_message_preview: null,
  }));

  if (searchParams.canal) {
    items = items.filter((i) => i.channel_type === searchParams.canal);
  }

  return items;
}

export default async function InboxLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams: { area?: string; canal?: string };
}) {
  const items = await getConversations(searchParams);

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-8">
      <ConversationList items={items} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
