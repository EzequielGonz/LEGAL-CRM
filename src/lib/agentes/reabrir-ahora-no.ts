/**
 * Corrección del 24/10 (pedida por la responsable): con la regla nueva, un
 * «Ahora no» no detiene al contacto. Antes el bot a veces lo detenía y
 * cerraba el chat. Esto revisa las respuestas con botón «Ahora no» / «No por
 * ahora» y, si la persona no pidió después que no le escriban, levanta la
 * detención que puso el bot (con motivo), vuelve la oportunidad a «En
 * conversación» y reactiva el bot en ese chat. No envía ningún mensaje.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { liftDetention } from "@/lib/detention";
import { setOpportunityState } from "@/lib/opportunities";
import { clasificarRespuesta } from "./plantillas-en-historial";

const MOTIVO = "Corrección 24/10: tocó «Ahora no» en la plantilla; con la regla nueva un «ahora no» no detiene.";

export interface CandidatoAhoraNo {
  conversationId: string;
  contactId: string;
  area: string;
  detenciones: { id: string; motive: string }[];
  /** la persona escribió algo después; si fue una baja, no se reabre */
  pidioBajaDespues: boolean;
}

export async function candidatosAhoraNo(dias = 30): Promise<CandidatoAhoraNo[]> {
  const s = createAdminClient();
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
  const { data: botones } = await (s.from("messages") as any)
    .select("conversation_id, body, created_at, conversations!inner(contact_id, area)")
    .eq("direction", "entrante")
    .eq("metadata->>provider_type", "button")
    .gte("created_at", desde)
    .limit(3000);
  const porConv = new Map<string, { contactId: string; area: string; desde: string }>();
  for (const b of (botones ?? []) as any[]) {
    if (clasificarRespuesta(String(b.body ?? "")) !== "posterga") continue;
    const prev = porConv.get(b.conversation_id);
    if (!prev || b.created_at < prev.desde) porConv.set(b.conversation_id, { contactId: b.conversations.contact_id, area: b.conversations.area, desde: b.created_at });
  }
  const salida: CandidatoAhoraNo[] = [];
  for (const [conversationId, c] of Array.from(porConv.entries())) {
    const { data: dets } = await s
      .from("contact_detentions")
      .select("id, motive, created_by, created_at, status")
      .eq("contact_id", c.contactId)
      .eq("status", "vigente");
    const delBot = ((dets ?? []) as any[]).filter((d) => d.created_by === "agente" && d.created_at >= c.desde);
    if (!delBot.length) continue;
    const { data: despues } = await s
      .from("messages")
      .select("body")
      .eq("conversation_id", conversationId)
      .eq("direction", "entrante")
      .gt("created_at", c.desde);
    const pidioBajaDespues = ((despues ?? []) as any[]).some((m) => clasificarRespuesta(String(m.body ?? "")) === "baja");
    salida.push({ conversationId, contactId: c.contactId, area: c.area, detenciones: delBot.map((d) => ({ id: d.id, motive: d.motive })), pidioBajaDespues });
  }
  return salida;
}

/** Aplica la corrección a los candidatos que no pidieron la baja. No envía nada. */
export async function reabrirAhoraNo(actor = "operador"): Promise<{ reabiertos: number; omitidos: number }> {
  const s = createAdminClient();
  const lista = await candidatosAhoraNo();
  let reabiertos = 0;
  let omitidos = 0;
  for (const c of lista) {
    if (c.pidioBajaDespues) {
      omitidos++;
      continue;
    }
    for (const d of c.detenciones) await liftDetention(d.id, MOTIVO, actor);
    const { data: opps } = await s.from("opportunities").select("id, capture_state").eq("contact_id", c.contactId).eq("capture_state", "perdido");
    for (const o of (opps ?? []) as any[]) {
      await setOpportunityState({ opportunityId: o.id, dimension: "captacion", field: "capture_state", value: "en_conversacion", actor: "operador", reason: MOTIVO, extra: { capture_reason: null } });
    }
    await s.from("conversations").update({ ai_enabled: true, status: "en_conversacion" }).eq("id", c.conversationId).eq("status", "cerrado_perdido");
    await s.from("conversations").update({ ai_enabled: true }).eq("id", c.conversationId);
    reabiertos++;
  }
  await (s.from("ops_change_log") as any).insert({ actor, action: "reabrir_ahora_no", target: "contactos", before: { candidatos: lista.length }, after: { reabiertos, omitidos } });
  return { reabiertos, omitidos };
}
