import { Suspense } from "react";
import { ConversationList } from "@/components/inbox/conversation-list";

export const dynamic = "force-dynamic";
export const metadata = { title: "Chats" };

/**
 * Chats del perfil (24/10, un solo chat): la lista y la conversación lado a lado, igual que en Jurídico.
 * Arriba están las pestañas de la sección y abajo «Más opciones»: el alto descuenta ese espacio
 * para que la pantalla no se corra al abrir una conversación.
 */
export default function ChatsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marco-inbox flex !mt-0 h-[calc(100vh-17rem)] min-h-[26rem]">
      <h1 className="sr-only">Chats</h1>
      <Suspense fallback={null}>
        <ConversationList perfil="agencia_0km" />
      </Suspense>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
