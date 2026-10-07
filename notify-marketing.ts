import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppText } from "@/lib/whatsapp/client";
import { normalizePhoneAR } from "@/lib/phone";

/**
 * Aviso inmediato al equipo humano cuando el asesor de Kocos Marketing pasa
 * una conversación a una persona (lead caliente, pedido de hablar con alguien,
 * pedido de presupuesto o ganas de contratar). SOLO se usa en el área
 * "marketing": el resto de las áreas no cambia.
 *
 * Los destinatarios son los mismos que reciben los demás avisos del sistema:
 * ADMIN_WHATSAPP_PHONES, el teléfono guardado en Configuración → Notificaciones
 * y la tabla notification_phones. Queda registrado en admin_notifications.
 */
async function getAdminPhones(): Promise<string[]> {
  const supabase = createAdminClient();

  const rawEnvPhones = process.env.ADMIN_WHATSAPP_PHONES ?? process.env.ADMIN_WHATSAPP_PHONE ?? "";
  const envPhones = rawEnvPhones
    .split(",")
    .map((p) => normalizePhoneAR(p.trim()).phone)
    .filter((p): p is string => Boolean(p));

  const [{ data: profiles }, { data: extraPhones }] = await Promise.all([
    supabase.from("admin_profiles").select("phone"),
    supabase.from("notification_phones").select("phone"),
  ]);

  const profilePhones = (profiles ?? [])
    .map((p) => (p.phone ? normalizePhoneAR(p.phone).phone : null))
    .filter((p): p is string => Boolean(p));

  const extraPhonesNormalized = (extraPhones ?? [])
    .map((p) => (p.phone ? normalizePhoneAR(p.phone).phone : null))
    .filter((p): p is string => Boolean(p));

  return Array.from(new Set([...envPhones, ...profilePhones, ...extraPhonesNormalized]));
}

function formatQualificationData(data: Record<string, unknown>): string {
  const entries = Object.entries(data ?? {});
  if (entries.length === 0) return "- (sin datos adicionales)";
  return entries.map(([key, value]) => `- ${key.replaceAll("_", " ")}: ${value}`).join("\n");
}

export async function notifyMarketingHandoff(
  contactId: string,
  motivo: string,
  tipo: "atender" | "cierre" = "atender"
) {
  const supabase = createAdminClient();

  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .single();

  if (!contact) throw new Error(`Contacto ${contactId} no encontrado`);

  const data = (contact.qualification_data ?? {}) as Record<string, unknown>;
  const score = data.sales_intent_score;

  const { data: lead } = await supabase
    .from("marketing_leads")
    .select("source_kind, source_detail, lead_score, priority, summary, website, analysis")
    .eq("contact_id", contact.id)
    .maybeSingle();
  const servicios: string[] = Array.isArray((lead as any)?.analysis?.servicios_sugeridos)
    ? (lead as any).analysis.servicios_sugeridos
    : [];

  const messageBody = [
    tipo === "cierre"
      ? "✅ PROYECTO APROBADO — DERIVAR AL EQUIPO TÉCNICO (KOCOS MARKETING)"
      : "🔥 LEAD PARA ATENDER (KOCOS MARKETING)",
    "",
    "Nombre:",
    contact.full_name ?? "(no informado)",
    "",
    "Teléfono:",
    contact.phone ?? "(no informado)",
    "",
    "Origen:",
    lead
      ? `${lead.source_kind === "directa" ? "Consulta directa" : "Dato frío de Google Maps"} — ${lead.source_detail ?? ""}`
      : "(sin dato)",
    "",
    tipo === "cierre" ? "Resultado:" : "Motivo del aviso:",
    motivo || "(sin detalle)",
    "",
    "Puntaje de intención de compra:",
    score !== undefined && score !== null ? String(score) : "(sin calcular)",
    ...(lead?.lead_score != null ? ["", "Puntaje de oportunidad del análisis:", `${lead.lead_score}/100 (${lead.priority})`] : []),
    ...(servicios.length > 0 ? ["", "Servicios sugeridos por el análisis:", servicios.join(", ")] : []),
    ...(lead?.website ? ["", "Sitio web:", lead.website] : []),
    "",
    "Información recopilada:",
    formatQualificationData(data),
  ].join("\n");

  const { data: notification } = await supabase
    .from("admin_notifications")
    .insert({
      contact_id: contact.id,
      area: "marketing",
      message_body: messageBody,
      sent: false,
    })
    .select()
    .single();

  const adminPhones = await getAdminPhones();

  if (adminPhones.length === 0) {
    console.warn(
      "No hay teléfonos de administrador configurados: no se pudo avisar del lead de Marketing."
    );
    return;
  }

  const sendErrors: string[] = [];
  let anySent = false;
  for (const phone of adminPhones) {
    try {
      await sendWhatsAppText("marketing", phone, messageBody);
      anySent = true;
    } catch (err: any) {
      sendErrors.push(`${phone}: ${String(err.message ?? err)}`);
    }
  }

  if (notification) {
    await supabase
      .from("admin_notifications")
      .update({
        sent: anySent,
        error: sendErrors.length > 0 ? sendErrors.join(" | ") : null,
      })
      .eq("id", notification.id);
  }

  if (sendErrors.length > 0 && !anySent) {
    throw new Error(sendErrors.join(" | "));
  }
}
