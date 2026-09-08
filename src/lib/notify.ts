import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppText } from "@/lib/whatsapp/client";
import type { Area } from "@/lib/supabase/database.types";

const SOURCE_LABEL: Record<string, string> = {
  organico_instagram: "Instagram",
  organico_facebook: "Facebook",
  organico_whatsapp: "WhatsApp",
  anuncio_instagram: "Anuncio Instagram",
  anuncio_facebook: "Anuncio Facebook",
  landing: "Landing",
  base_de_datos: "Base de prospectos",
};

function formatQualificationData(data: Record<string, unknown>): string {
  const entries = Object.entries(data ?? {});
  if (entries.length === 0) return "- (sin datos adicionales)";
  return entries.map(([key, value]) => `- ${key.replaceAll("_", " ")}: ${value}`).join("\n");
}

/**
 * Arma el mensaje de "nuevo cliente agendado" con el formato pedido y lo
 * envía por WhatsApp al teléfono del administrador, usando la línea de
 * WhatsApp del área correspondiente. Queda registrado en admin_notifications
 * para poder auditar envíos fallidos.
 */
export async function notifyAdminOfClosedAppointment(appointmentId: string) {
  const supabase = createAdminClient();

  const { data: appointment } = await supabase
    .from("appointments")
    .select("*, contacts(*)")
    .eq("id", appointmentId)
    .single();

  if (!appointment) throw new Error(`Cita ${appointmentId} no encontrada`);

  const contact = (appointment as any).contacts;
  const area: Area = appointment.area;
  const startsAt = new Date(appointment.starts_at);

  const messageBody = [
    "🆕 NUEVO CLIENTE AGENDADO",
    "",
    `Área: ${area.toUpperCase()}`,
    "",
    "Nombre:",
    contact.full_name ?? "(no informado)",
    "",
    "Teléfono:",
    contact.phone ?? "(no informado)",
    "",
    "Email:",
    contact.email ?? "(no informado)",
    "",
    "Origen:",
    SOURCE_LABEL[contact.source] ?? contact.source,
    "",
    "Tipo de consulta:",
    (contact.qualification_data?.tipo_de_consulta as string) ?? appointment.consultation_type ?? "(no informado)",
    "",
    "Información recopilada:",
    formatQualificationData(contact.qualification_data ?? {}),
    "",
    "Fecha de consulta:",
    startsAt.toLocaleDateString("es-AR"),
    "",
    "Hora:",
    startsAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
  ].join("\n");

  const { data: notification } = await supabase
    .from("admin_notifications")
    .insert({
      appointment_id: appointment.id,
      contact_id: contact.id,
      area,
      message_body: messageBody,
      sent: false,
    })
    .select()
    .single();

  const adminPhone = process.env.ADMIN_WHATSAPP_PHONE;
  if (!adminPhone) {
    console.warn("ADMIN_WHATSAPP_PHONE no está configurado: no se pudo notificar al admin.");
    return;
  }

  try {
    await sendWhatsAppText(area, adminPhone, messageBody);
    await supabase
      .from("admin_notifications")
      .update({ sent: true })
      .eq("id", notification!.id);
    await supabase
      .from("appointments")
      .update({ admin_notified_at: new Date().toISOString() })
      .eq("id", appointment.id);
  } catch (err: any) {
    await supabase
      .from("admin_notifications")
      .update({ error: String(err.message ?? err) })
      .eq("id", notification!.id);
    throw err;
  }
}
