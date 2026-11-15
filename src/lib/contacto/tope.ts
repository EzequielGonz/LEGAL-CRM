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
 * Cuenta los automáticos sin respuesta de la persona (todas sus fichas con el
 * mismo teléfono). Si no se puede leer, devuelve null y quien llama frena.
 */
export async function automaticosSinRespuesta(contactId: string, supabase: any = createAdminClient()): Promise<number | null> {
  // Revisión 15/11: «por persona» es por teléfono (hay un contacto por perfil con el mismo número).
  const { data: yo, error: e0 } = await supabase.from("contacts").select("phone").eq("id", contactId).maybeSingle();
  if (e0) return null;
  let contactos = [contactId];
  if (yo?.phone) {
    const { data: mismos, error: e1 } = await supabase.from("contacts").select("id").eq("phone", yo.phone).limit(20);
    if (e1) return null;
    contactos = Array.from(new Set([contactId, ...((mismos ?? []) as { id: string }[]).map((c) => c.id)]));
  }
  const { data: convs, error } = await supabase.from("conversations").select("id").in("contact_id", contactos);
  if (error) return null;
  const ids = ((convs ?? []) as { id: string }[]).map((c) => c.id);
  if (!ids.length) return 0;
  const { data: ultimo, error: ultimoError } = await supabase
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
  if (ultimoError) return null;
  if (ultimo?.created_at) q = q.gt("created_at", ultimo.created_at);
  const { count, error: e2 } = await q;
  if (e2) return null;
  return count ?? 0;
}

/** ¿Hay que frenar este envío automático por el tope? Revisión 15/11: si no se puede leer, se frena (se prefiere no escribir). */
export async function frenaPorTope(contactId: string, supabase?: any): Promise<boolean> {
  const n = await automaticosSinRespuesta(contactId, supabase);
  return n === null || topeAlcanzado(n);
}

export const TEXTO_TOPE = `Ya recibió ${TOPE_SIN_RESPUESTA} mensajes automáticos sin contestar: no se le escribe más hasta que responda.`;
