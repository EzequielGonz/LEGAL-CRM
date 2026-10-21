import { createAdminClient } from "@/lib/supabase/admin";
import { findOrCreateConversation } from "@/lib/contacts";
import { getAutomationPause } from "@/lib/automation-pause";
import { contactBlockReason } from "@/lib/detention";
import { insertMessageRow } from "@/lib/messaging";
import { sendWhatsAppTemplate } from "@/lib/whatsapp/client";
import type { Area } from "@/lib/supabase/database.types";

/**
 * Formularios de las landings (21/10, pedido de la responsable): a los 5
 * minutos de dejar la consulta en la web, el agente le escribe por WhatsApp
 * con la plantilla aprobada «form_recibido_*» del rubro. Cuando la persona
 * responde, sigue el agente del perfil en la misma conversación.
 *
 * Lo corre el latido. Respeta la pausa general de envíos y las detenciones,
 * no repite (si ya hay un envío de esa plantilla, no vuelve a salir) y solo
 * mira formularios de las últimas 48 h.
 */
export const ESPERA_MS = 5 * 60_000;
const VENTANA_MS = 48 * 3_600_000;

export const PLANTILLA_FORMULARIO: Record<string, string> = {
  civil: "form_recibido_jur",
  penal: "form_recibido_jur",
  coberturas_medicas: "form_recibido_cob",
  agencia_0km: "form_recibido_autos",
  marketing: "form_recibido_mkt",
};

/** ¿Le toca el primer mensaje? Pura. */
export function tocaContactar(creadoAt: string, ahora: Date): boolean {
  const t = new Date(creadoAt).getTime();
  return ahora.getTime() - t >= ESPERA_MS && ahora.getTime() - t <= VENTANA_MS;
}

export function primerNombre(nombre: string | null | undefined): string {
  const n = String(nombre ?? "").trim().split(/\s+/)[0] ?? "";
  return n.slice(0, 40) || "¿cómo estás?";
}

export async function contactarFormulariosDeLanding(ahora = new Date(), limite = 5): Promise<{ enviados: number; pendientes: string[] }> {
  const s = createAdminClient();
  const pausa = await getAutomationPause();
  if (pausa.outboundPaused) return { enviados: 0, pendientes: ["pausa general de envíos"] };

  const desde = new Date(ahora.getTime() - VENTANA_MS).toISOString();
  const hasta = new Date(ahora.getTime() - ESPERA_MS).toISOString();
  const { data: candidatos } = await s
    .from("contacts")
    .select("id, area, full_name, phone, created_at")
    .eq("source", "landing")
    .gte("created_at", desde)
    .lte("created_at", hasta)
    .not("phone", "is", null)
    .order("created_at", { ascending: true })
    .limit(30);

  let enviados = 0;
  const pendientes: string[] = [];
  for (const c of (candidatos ?? []) as { id: string; area: Area; full_name: string | null; phone: string; created_at: string }[]) {
    if (enviados >= limite) break;
    if (!tocaContactar(c.created_at, ahora)) continue;
    const plantilla = PLANTILLA_FORMULARIO[c.area];
    if (!plantilla) continue;

    // ¿Ya le escribimos (con esta plantilla o la persona ya habló por WhatsApp)?
    const { count: yaEscrito } = await s
      .from("messages")
      .select("id, conversations!inner(contact_id, channels!inner(type))", { count: "exact", head: true })
      .eq("conversations.contact_id", c.id)
      .eq("conversations.channels.type", "whatsapp");
    if ((yaEscrito ?? 0) > 0) continue;
    if (await contactBlockReason(c.id)) continue;

    const { data: tpl } = await s.from("whatsapp_templates").select("name, language").eq("name", plantilla).eq("status", "APPROVED").is("missing_since", null).limit(1).maybeSingle();
    if (!tpl) {
      pendientes.push(`${plantilla} todavía no está aprobada en Meta`);
      continue;
    }
    const [{ data: canal }, { data: linea }] = await Promise.all([
      s.from("channels").select("id").eq("area", c.area).eq("type", "whatsapp").limit(1).maybeSingle(),
      s.from("profile_lines").select("id, credential_key").eq("area", c.area).eq("active", true).order("created_at").limit(1).maybeSingle(),
    ]);
    if (!canal) continue;
    try {
      const conv: any = await findOrCreateConversation({ contactId: c.id, channelId: (canal as any).id, area: c.area });
      const r: any = await sendWhatsAppTemplate(c.area, c.phone, (tpl as any).name, (tpl as any).language, [primerNombre(c.full_name)], {
        credentialKey: (linea as any)?.credential_key ?? null,
      });
      await insertMessageRow(s, {
        conversation_id: conv.id,
        sender_type: "agente_ia",
        direction: "saliente",
        body: `[Plantilla ${(tpl as any).name}] Primer mensaje automático por la consulta de la web.`,
        external_message_id: r?.messages?.[0]?.id ?? null,
        delivery_status: "enviado",
        delivery_status_at: new Date().toISOString(),
        origin: "inicio_campana",
      });
      await s.from("conversations").update({ last_message_at: new Date().toISOString(), ...(linea ? { line_id: (linea as any).id } : {}) } as any).eq("id", conv.id);
      enviados++;
    } catch (err: any) {
      pendientes.push(`No se pudo escribir a un formulario de ${c.area}: ${String(err?.message ?? err).slice(0, 120)}`);
    }
  }
  return { enviados, pendientes: Array.from(new Set(pendientes)) };
}
