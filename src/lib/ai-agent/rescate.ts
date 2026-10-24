/**
 * Turnos perdidos (24/10). Si un mensaje de texto de la persona quedó sin
 * respuesta y sin ningún turno del bot registrado (por ejemplo, la función
 * del webhook se cortó por tiempo), el latido lo vuelve a intentar UNA vez,
 * con la misma compuerta de siempre: pausa general, chat tomado, contacto
 * detenido, captado, agente activo y horario. Caso real: «Ya compré» quedó
 * cinco horas sin respuesta el 24/10.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { runAgentTurn } from "@/lib/ai-agent/agent";
import { getAutomationPause } from "@/lib/automation-pause";
import { contactBlockReason } from "@/lib/detention";
import { ensureOpportunity } from "@/lib/opportunities";
import { agentReadiness } from "@/lib/profiles";
import { AREA_TO_RUBRO_ID } from "@/lib/rubros";
import { loadContactCalendar } from "@/lib/contacto/calendario";
import { decidirRespuestaEntrante } from "@/lib/contacto/origen";

/** Desde cuándo y hasta cuándo se busca un mensaje sin responder. */
export const RESCATE = { minMin: 2, maxMin: 60 };
const TIPOS_LEGIBLES = ["text", "button", "interactive"];

/** ¿El mensaje está en la franja de rescate? Pura. */
export function enFranjaDeRescate(creado: string, ahora: Date): boolean {
  const edad = ahora.getTime() - Date.parse(creado);
  return edad >= RESCATE.minMin * 60_000 && edad <= RESCATE.maxMin * 60_000;
}

export async function rescatarTurnosPerdidos({ presupuestoMs = 15_000, maximo = 1, ahora = new Date() } = {}): Promise<unknown> {
  const t0 = Date.now();
  const s = createAdminClient();
  const desde = new Date(ahora.getTime() - RESCATE.maxMin * 60_000).toISOString();
  const hasta = new Date(ahora.getTime() - RESCATE.minMin * 60_000).toISOString();
  const { data: entrantes } = await s
    .from("messages")
    .select("conversation_id, created_at")
    .eq("direction", "entrante")
    .gte("created_at", desde)
    .lte("created_at", hasta)
    .order("created_at", { ascending: false })
    .limit(300);
  const vistos = new Set<string>();
  const hechos: string[] = [];
  for (const m of (entrantes ?? []) as { conversation_id: string; created_at: string }[]) {
    if (hechos.length >= maximo || Date.now() - t0 > presupuestoMs) break;
    if (vistos.has(m.conversation_id)) continue;
    vistos.add(m.conversation_id);
    try {
      const r = await rescatarConversacion(m.conversation_id, ahora);
      if (r) hechos.push(r);
    } catch (err) {
      console.error("[rescate] No se pudo revisar la conversación:", err);
    }
  }
  return { revisadas: vistos.size, rescatadas: hechos.length };
}

async function rescatarConversacion(conversationId: string, ahora: Date): Promise<string | null> {
  const s = createAdminClient();
  // 1) El último mensaje del chat tiene que ser de la persona, de texto y en la franja.
  const { data: ultimo } = await s
    .from("messages")
    .select("direction, created_at, message_type")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const u: any = ultimo;
  if (!u || u.direction !== "entrante" || !TIPOS_LEGIBLES.includes(u.message_type ?? "text") || !enFranjaDeRescate(u.created_at, ahora)) return null;
  // 2) Ningún turno del bot registrado después (respondido, retenido, bloqueado o con error ya se ve en el panel).
  const { count } = await (s.from("agent_turn_logs" as any) as any)
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .gte("created_at", u.created_at);
  if (count) return null;
  const { data: conv } = await s.from("conversations").select("*, contacts(*)").eq("id", conversationId).maybeSingle();
  const c: any = conv;
  if (!c || !c.ai_enabled || !c.contacts) return null;
  // 3) Una sola vez por mensaje: se reserva con comparación (dos latidos juntos no lo rescatan dos veces).
  const previo: string | null = c.turn_rescue_at ?? null;
  if (previo && Date.parse(previo) >= Date.parse(u.created_at)) return null;
  let q: any = (s.from("conversations") as any).update({ turn_rescue_at: ahora.toISOString() }).eq("id", conversationId);
  q = previo ? q.eq("turn_rescue_at", previo) : q.is("turn_rescue_at", null);
  const { data: reservada } = await q.select("id").maybeSingle();
  if (!reservada) return null;
  // 4) Misma compuerta que un mensaje recién llegado.
  const contact = c.contacts;
  if (await contactBlockReason(contact.id)) return null;
  try {
    const opp = await ensureOpportunity({ contactId: contact.id, conversationId });
    let captado = opp.row?.capture_state === "captado";
    if (captado && c.area === "marketing") {
      const { data: ml } = await s.from("marketing_leads").select("sale_stage").eq("contact_id", contact.id).maybeSingle();
      if (["presupuesto_pedido", "presupuesto_enviado"].includes((ml as any)?.sale_stage)) captado = false;
    }
    if (captado) return null;
  } catch {
    return null;
  }
  const pause = await getAutomationPause();
  const rubroId = contact.rubro_id ?? AREA_TO_RUBRO_ID[c.area] ?? null;
  const { data: rubro } = rubroId ? await s.from("rubros").select("*").eq("id", rubroId).maybeSingle() : { data: null as any };
  const { data: agente } = await s.from("ai_agents").select("active").eq("area", c.area).maybeSingle();
  const agenteActivo = !!agente?.active && !pause.aiRepliesPaused && (await agentReadiness(c.area)).ready;
  const { calendar } = await loadContactCalendar(ahora);
  const decision = decidirRespuestaEntrante(
    {
      entrante24hHabilitado: (rubro as any)?.inbound_24h_enabled === true,
      agenteActivo,
      pausaIa: pause.aiRepliesPaused,
      chatTomado: !c.ai_enabled,
      legible: true,
      detenido: false,
      captado: false,
      ventanaAbierta: true,
    },
    ahora,
    calendar
  );
  if (!decision.responder) return null;
  await runAgentTurn(conversationId);
  return conversationId;
}
