import { createAdminClient } from "@/lib/supabase/admin";

/** 17/11: texto que dice por dónde entró un chat (Meta o Wasender). Puro: se prueba solo. */
export function textoEntroPor(d: {
  canal: string | null;
  wasenderLineId: string | null;
  lineaMeta: string | null;
  lineaWasender: string | null;
}): string | null {
  if (d.wasenderLineId) return `WhatsApp por QR (Wasender)${d.lineaWasender ? ` · ${d.lineaWasender}` : ""}`;
  if (d.canal && d.canal !== "whatsapp") return null;
  return `WhatsApp oficial (Meta)${d.lineaMeta ? ` · ${d.lineaMeta}` : ""}`;
}

/** Lee la línea del chat en el servidor (las tablas de Wasender no tienen permisos públicos). */
export async function entroPor(conversationId: string): Promise<string | null> {
  try {
    const s = createAdminClient();
    const { data: c } = (await (s.from("conversations") as any)
      .select("line_id, wasender_line_id, channels(type), profile_lines(label)")
      .eq("id", conversationId)
      .maybeSingle()) as { data: any };
    if (!c) return null;
    let lineaWasender: string | null = null;
    if (c.wasender_line_id) {
      const { data: w } = await (s.from("wasender_lineas" as any) as any).select("nombre").eq("id", c.wasender_line_id).maybeSingle();
      lineaWasender = w?.nombre ?? null;
    }
    return textoEntroPor({
      canal: c.channels?.type ?? null,
      wasenderLineId: c.wasender_line_id ?? null,
      lineaMeta: c.profile_lines?.label ?? null,
      lineaWasender,
    });
  } catch {
    return null;
  }
}
