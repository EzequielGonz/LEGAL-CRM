import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Colas de «Hoy» (12/11). Dos listas que antes no estaban a la vista:
 *  - «Esperan tu respuesta»: la persona escribió último y el chat está en manos
 *    de una persona (el bot no le va a contestar). Antes solo se veían en
 *    «Todos los chats».
 *  - «Captados para derivar»: ya aceptaron el siguiente paso y nadie los pasó.
 * Solo lectura.
 */

export interface ChatDeCola {
  id: string;
  contact_id: string | null;
  last_message_at: string | null;
}

export interface MensajeDeCola {
  conversation_id: string;
  direction: string;
  created_at: string;
  body?: string | null;
}

export interface FilaEspera {
  conversationId: string;
  contactId: string | null;
  desde: string;
  texto: string | null;
}

/**
 * De los chats tomados por una persona, cuáles tienen como último mensaje uno
 * de la persona de afuera. Pura: se prueba sola. Los más viejos primero (son
 * los que más esperaron). `excluidos` = chats detenidos o perdidos.
 */
export function chatsQueEsperan(chats: ChatDeCola[], mensajes: MensajeDeCola[], excluidos: Set<string> = new Set()): FilaEspera[] {
  const ultimo = new Map<string, MensajeDeCola>();
  for (const m of mensajes) {
    const previo = ultimo.get(m.conversation_id);
    if (!previo || Date.parse(m.created_at) > Date.parse(previo.created_at)) ultimo.set(m.conversation_id, m);
  }
  const filas: FilaEspera[] = [];
  for (const c of chats) {
    if (excluidos.has(c.id)) continue;
    const m = ultimo.get(c.id);
    if (!m || m.direction !== "entrante") continue;
    filas.push({ conversationId: c.id, contactId: c.contact_id, desde: m.created_at, texto: m.body ? String(m.body).slice(0, 90) : null });
  }
  return filas.sort((a, b) => Date.parse(a.desde) - Date.parse(b.desde));
}

const DIAS_VENTANA = 21;

export interface ColasHoy {
  esperan: (FilaEspera & { nombre: string | null })[];
  captadosSinDerivar: number | null;
}

export async function colasDeHoy(rubroId: string, areas: string[]): Promise<ColasHoy> {
  const s = createAdminClient();
  const desde = new Date(Date.now() - DIAS_VENTANA * 24 * 3600 * 1000).toISOString();
  const [{ data: chats }, { count: captados, error: errorCaptados }] = await Promise.all([
    s
      .from("conversations")
      .select("id, contact_id, last_message_at")
      .in("area", areas as any)
      .eq("ai_enabled", false)
      .gte("last_message_at", desde)
      .order("last_message_at", { ascending: false })
      .limit(150),
    s.from("opportunities").select("id", { count: "exact", head: true }).eq("rubro_id", rubroId).eq("capture_state", "captado").eq("derivation_state", "no_derivado"),
  ]);
  const lista = (chats ?? []) as ChatDeCola[];
  const captadosSinDerivar = errorCaptados ? null : captados ?? 0;
  if (!lista.length) return { esperan: [], captadosSinDerivar };

  const ids = lista.map((c) => c.id);
  const [{ data: mensajes }, { data: opps }] = await Promise.all([
    s.from("messages").select("conversation_id, direction, created_at, body").in("conversation_id", ids).gte("created_at", desde).is("duplicate_of", null).order("created_at", { ascending: false }).limit(1500),
    s.from("opportunities").select("conversation_id, attention_category, capture_state").in("conversation_id", ids),
  ]);
  const excluidos = new Set<string>(
    ((opps ?? []) as any[]).filter((o) => o.attention_category === "detencion" || o.capture_state === "perdido").map((o) => o.conversation_id as string)
  );
  const filas = chatsQueEsperan(lista, (mensajes ?? []) as MensajeDeCola[], excluidos).slice(0, 30);
  const contactos = Array.from(new Set(filas.map((f) => f.contactId).filter(Boolean))) as string[];
  const { data: nombres } = contactos.length ? await s.from("contacts").select("id, full_name").in("id", contactos) : { data: [] as any[] };
  const porId = new Map(((nombres ?? []) as any[]).map((c) => [c.id as string, (c.full_name as string | null) ?? null]));
  return { esperan: filas.map((f) => ({ ...f, nombre: f.contactId ? porId.get(f.contactId) ?? null : null })), captadosSinDerivar };
}
