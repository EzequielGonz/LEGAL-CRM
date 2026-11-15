import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Tope único por persona (15/11, decisión de la responsable): como mucho 3
 * mensajes automáticos iniciados por la empresa sin que la persona conteste,
 * sumando todos los caminos (inicio de campaña, segundo intento, seguimiento y
 * recuperación) y todas sus conversaciones. Cuando contesta, vuelve a cero.
 * Las citas (inicio y reagendamiento) y las respuestas a lo que escribió no cuentan.
 */
export const TOPE_SIN_RESPUESTA = 3;
export const ORIGENES_CON_TOPE = ["inicio_campana", "seguimiento", "recuperacion"] as const;

/** Pura: ¿ya se llegó al tope? */
export function topeAlcanzado(automaticosSinRespuesta: number): boolean {
  return automaticosSinRespuesta >= TOPE_SIN_RESPUESTA;
}

/**
 * Cuenta los automáticos sin respuesta de la persona. Si no se puede leer,
 * devuelve null (quien llama decide: no se frena por una falla de lectura,
 * porque cada camino ya tiene sus propios límites).
 */
export async function automaticosSinRespuesta(contactId: string, supabase: any = createAdminClient()): Promise<number | null> {
  const { data: convs, error } = await supabase.from("conversations").select("id").eq("contact_id", contactId);
  if (error) return null;
  const ids = ((convs ?? []) as { id: string }[]).map((c) => c.id);
  if (!ids.length) return 0;
  const { data: ultimo } = await supabase
    .from("messages")
    .select("created_at")
    .in("conversation_id", ids)
    .eq("direction", "entrante")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  let q = supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", ids)
    .eq("direction", "saliente")
    .neq("sender_type", "admin")
    .in("origin", ORIGENES_CON_TOPE as unknown as string[]);
  if (ultimo?.created_at) q = q.gt("created_at", ultimo.created_at);
  const { count, error: e2 } = await q;
  if (e2) return null;
  return count ?? 0;
}

/** ¿Hay que frenar este envío automático por el tope? */
export async function frenaPorTope(contactId: string, supabase?: any): Promise<boolean> {
  const n = await automaticosSinRespuesta(contactId, supabase);
  return n !== null && topeAlcanzado(n);
}

export const TEXTO_TOPE = `Ya recibió ${TOPE_SIN_RESPUESTA} mensajes automáticos sin contestar: no se le escribe más hasta que responda.`;
