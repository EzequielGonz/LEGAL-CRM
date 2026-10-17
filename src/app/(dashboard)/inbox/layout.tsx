import { ConversationList } from "@/components/inbox/conversation-list";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inbox" };

// La lista se pide al servidor desde el cliente (/api/inbox) con filtros,
// búsqueda y páginas; así se mantiene al día sin recargar la página.
export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marco-inbox flex h-[calc(100vh-4rem)]">
      <h1 className="sr-only">Inbox</h1>
      <ConversationList />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
