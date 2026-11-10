import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Por dónde sale un mensaje de WhatsApp de una conversación (10/11).
 *
 * Regla: se responde por la línea por la que la persona escribió por última
 * vez. Si ese mensaje llegó por una línea de Wasender, sale por esa línea; si
 * llegó por Meta, sale exactamente como siempre. Si la persona todavía no
 * escribió y la conversación la empezó Wasender (campaña o envío desde su
 * sección), sale por esa línea. Nunca se pasa sola de una línea a otra.
 */

export interface FilaSalida {
  direction: string;
  metadata?: Record<string, unknown> | null;
}

export type Salida = { proveedor: "meta" } | { proveedor: "wasender"; lineaId: string };

function lineaWasender(fila: FilaSalida | null): string | null {
  const md = fila?.metadata ?? null;
  if (!md || md.proveedor !== "wasender") return null;
  const id = md.wasender_line_id;
  return typeof id === "string" && id ? id : null;
}

/** Decisión pura a partir del último mensaje de la persona y del último que salió. */
export function decidirSalida(ultimoEntrante: FilaSalida | null, ultimoSaliente: FilaSalida | null): Salida {
  if (ultimoEntrante) {
    const id = lineaWasender(ultimoEntrante);
    return id ? { proveedor: "wasender", lineaId: id } : { proveedor: "meta" };
  }
  const id = lineaWasender(ultimoSaliente);
  return id ? { proveedor: "wasender", lineaId: id } : { proveedor: "meta" };
}

/**
 * Consulta la conversación y decide. Si la consulta falla, sigue como siempre
 * (Meta): lo de Meta nunca queda frenado por Wasender.
 */
export async function salidaDeConversacion(conversationId: string, supabase = createAdminClient()): Promise<Salida> {
  try {
    const ultimo = async (direction: "entrante" | "saliente") => {
      const { data, error } = await supabase
        .from("messages")
        .select("direction, metadata")
        .eq("conversation_id", conversationId)
        .eq("direction", direction)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as FilaSalida | null) ?? null;
    };
    const entrante = await ultimo("entrante");
    if (entrante) return decidirSalida(entrante, null);
    return decidirSalida(null, await ultimo("saliente"));
  } catch (err) {
    console.error("[wasender] No se pudo decidir por dónde sale el mensaje; sale como siempre:", err);
    return { proveedor: "meta" };
  }
}
