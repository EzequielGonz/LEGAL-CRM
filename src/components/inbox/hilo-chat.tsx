import { entroPor } from "@/lib/inbox/entro-por";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ultimosMensajes } from "@/lib/chat-mensajes";
import { ConversationThread } from "@/components/inbox/conversation-thread";
import { FichaSection } from "@/components/ficha/ficha-section";
import { volverSeguro, fichaDe } from "@/lib/navegacion";
import { EnlaceVolver } from "@/components/ui/enlaces-navegacion";

/** Perfil dueño de una conversación según el área del contacto. */
function perfilDeArea(area: string | null | undefined): string {
  return area === "civil" || area === "penal" || !area ? "juridico" : area;
}

/**
 * Conversación abierta al lado de la lista (24/10, un solo chat): la misma
 * vista que el Inbox de Jurídico, para Coberturas, Autos 0 km y Marketing.
 * Si la conversación es de otro perfil, se abre en el suyo.
 */
export async function HiloChat({ id, slug, searchParams }: { id: string; slug: string; searchParams?: Record<string, string | undefined> }) {
  const volver = volverSeguro(searchParams?.volver);
  const supabase = createClient();
  // 15/11: conversación y mensajes a la vez (antes, uno después del otro). Del contacto, solo lo que se
  // usa; de los mensajes, los últimos 300 con las columnas que dibuja el hilo (src/lib/chat-mensajes.ts).
  const [{ data: conversation }, messages, via] = await Promise.all([
    supabase.from("conversations").select("id, ai_enabled, contacts(id, full_name, phone, email, area, status, source, qualification_data)").eq("id", id).single(),
    ultimosMensajes(supabase, id),
    entroPor(id),
  ]);
  if (!conversation) notFound();
  const contact = conversation.contacts as any;
  const duenio = perfilDeArea(contact?.area);
  if (duenio !== slug) {
    const destino = duenio === "juridico" ? `/inbox/${id}` : `/panel/${duenio}/chats/${id}`;
    redirect(`${destino}${volver ? `?volver=${encodeURIComponent(volver)}` : ""}`);
  }

  const filtrosLista = new URLSearchParams(
    Object.entries(searchParams ?? {}).filter(([k, v]) => k !== "volver" && typeof v === "string") as [string, string][]
  ).toString();
  const lista = `/panel/${slug}/chats${filtrosLista ? `?${filtrosLista}` : ""}`;

  return (
    <>
      {volver ? (
        <EnlaceVolver volver={volver} respaldo={lista} className="tactil mb-2 inline-flex items-center gap-1.5 px-4 text-sm font-medium text-slate-700 hover:underline" />
      ) : (
        // En teléfono la lista y la conversación van de a una: regreso a la lista con sus filtros.
        <EnlaceVolver volver={null} respaldo={lista} textoRespaldo="Volver a la lista" className="tactil mb-2 inline-flex items-center gap-1.5 px-4 text-sm font-medium text-slate-700 hover:underline md:hidden" />
      )}
      <ConversationThread
        conversationId={conversation.id}
        entroPor={via}
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
        initialMessages={messages}
        ficha={
          // 15/11: la ficha llega aparte; el hilo se muestra sin esperarla.
          <Suspense fallback={null}>
            <FichaSection contactId={contact.id} compact fullHref={fichaDe(contact.id, contact.area)} />
          </Suspense>
        }
      />
    </>
  );
}
