/**
 * Lectura de los mensajes de un hilo de chat (15/11, rendimiento). Solo lee.
 *
 * - Columnas: solo las que dibuja el hilo (`ConversationThread` y `AudioTexto`),
 *   en lugar de `*` (evita traer columnas que el hilo no usa).
 * - Cantidad: los últimos `LIMITE_HILO` mensajes, pedidos del más nuevo al más
 *   viejo y dados vuelta, para que el hilo siga en orden cronológico. Antes se
 *   traían todos los mensajes de la conversación.
 */
import type { Message } from "@/lib/supabase/database.types";

export const LIMITE_HILO = 300;

/** Columnas que usa el hilo: texto, tipo, adjuntos (metadata), entrega, duplicados y audio pasado a texto. */
export const COLUMNAS_HILO =
  "id, conversation_id, direction, sender_type, body, message_type, metadata, created_at, delivery_status, delivery_status_at, delivery_error, duplicate_of, audio_texto, audio_texto_estado, audio_texto_detalle";

/** Pone en orden cronológico una lista que llegó del más nuevo al más viejo. Pura. */
export function enOrdenCronologico<T>(desc: T[] | null | undefined): T[] {
  return (desc ?? []).slice().reverse();
}

/** Últimos mensajes de una conversación, en orden cronológico. Sirve con el cliente de servidor o el de servicio. */
export async function ultimosMensajes(supabase: { from: (t: string) => any }, conversationId: string, limite = LIMITE_HILO): Promise<Message[]> {
  const { data } = await supabase
    .from("messages")
    .select(COLUMNAS_HILO)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limite);
  return enOrdenCronologico((data ?? []) as Message[]);
}
