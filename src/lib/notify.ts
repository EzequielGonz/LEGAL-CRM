import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppText } from "@/lib/whatsapp/client";
import { normalizePhoneAR } from "@/lib/phone";
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

  // Lista de teléfonos de administradores que reciben la notificación,
  // separados por coma (ej: "5491139435473,5492235223906"). Se acepta
  // ADMIN_WHATSAPP_PHONE (singular) como alias por compatibilidad con
  // configuraciones anteriores que solo tenían un teléfono.
  const rawPhones = process.env.ADMIN_WHATSAPP_PHONES ?? process.env.ADMIN_WHATSAPP_PHONE ?? "";
  const adminPhones = rawPhones
    .split(",")
    .map((p) => normalizePhoneAR(p.trim()).phone)
    .filter((p): p is string => Boolean(p));

  if (adminPhones.length === 0) {
    console.warn(
      "ADMIN_WHATSAPP_PHONES no está configurado (o no tiene teléfonos válidos): no se pudo notificar a ningún administrador."
    );
    return;
  }

  // Mandamos a todos los administradores configurados. Si alguno falla (por
  // ejemplo, un número mal cargado) no queremos que eso le impida al resto
  // enterarse: intentamos con cada uno por separado y juntamos los errores.
  const sendErrors: string[] = [];
  let anySent = false;
  for (const phone of adminPhones) {
    try {
      await sendWhatsAppText(area, phone, messageBody);
      anySent = true;
    } catch (err: any) {
      sendErrors.push(`${phone}: ${String(err.message ?? err)}`);
    }
  }

  await supabase
    .from("admin_notifications")
    .update({
      sent: anySent,
      error: sendErrors.length > 0 ? sendErrors.join(" | ") : null,
    })
    .eq("id", notification!.id);

  if (anySent) {
    await supabase
      .from("appointments")
      .update({ admin_notified_at: new Date().toISOString() })
      .eq("id", appointment.id);
  }

  if (sendErrors.length > 0 && !anySent) {
    throw new Error(sendErrors.join(" | "));
  }
}
