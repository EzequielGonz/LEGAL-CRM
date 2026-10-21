import { Suspense } from "react";
import { ConversationList } from "@/components/inbox/conversation-list";

export const dynamic = "force-dynamic";
export const metadata = { title: "Todos los chats" };

/** Todos los chats de este perfil (21/10), con filtros por base, respuesta y canal. */
export default function ChatsPerfil() {
  return (
    <div className="marco-inbox mx-auto flex h-[calc(100vh-4rem)] max-w-3xl">
      <h1 className="sr-only">Todos los chats</h1>
      <Suspense fallback={null}>
        <ConversationList perfil="marketing" />
      </Suspense>
    </div>
  );
}
