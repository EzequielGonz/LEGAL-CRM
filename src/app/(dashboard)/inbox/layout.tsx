import { ConversationList } from "@/components/inbox/conversation-list";

export const dynamic = "force-dynamic";

// La lista se pide al servidor desde el cliente (/api/inbox) con filtros,
// búsqueda y páginas; así se mantiene al día sin recargar la página.
export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-4rem)] -m-8">
      <ConversationList />
      <div className="flex-1">{children}</div>
    </div>
  );
}
