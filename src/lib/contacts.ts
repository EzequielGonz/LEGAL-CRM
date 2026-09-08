import { createAdminClient } from "@/lib/supabase/admin";
import type { Area, ChannelType, SourceType } from "@/lib/supabase/database.types";

const UNIQUE_VIOLATION = "23505";

/**
 * Punto único de deduplicación: busca si ya existe un contacto con esta
 * identidad de canal (mismo wa_id / IGSID / PSID / email) o mismo teléfono,
 * y si no existe lo crea. Lo usan los webhooks de WhatsApp/Instagram/
 * Facebook, el endpoint de la landing y la importación de campañas.
 *
 * Nota sobre concurrencia: si dos mensajes casi simultáneos del mismo
 * teléfono nuevo llegan por canales distintos, ambos pueden pasar el
 * chequeo de "¿existe?" antes de que el otro termine de insertar. Por eso
 * los `insert` de acá confían en los constraints únicos de la base
 * (`idx_contacts_area_phone`, `contact_identities.unique(area, channel_type,
 * external_user_id)`) como última barrera, y si saltan, se recupera el
 * registro que ganó la carrera en vez de fallar.
 *
 * Devuelve `{ contact, created }` — `created` indica si este llamado generó
 * un contacto nuevo o reutilizó uno existente (lo usa el importador de
 * bases para reportar cuántos contactos son nuevos vs. duplicados).
 */
export async function findOrCreateContact({
  area,
  channelType,
  externalUserId,
  phone,
  email,
  fullName,
  source,
  channelId,
  campaignId,
}: {
  area: Area;
  channelType: ChannelType;
  externalUserId: string;
  phone?: string | null;
  email?: string | null;
  fullName?: string | null;
  source: SourceType;
  channelId?: string | null;
  campaignId?: string | null;
}) {
  const supabase = createAdminClient();

  // 1) ¿Ya existe esta identidad exacta (misma área + mismo canal + mismo id
  //    externo)? Se filtra por área porque una misma persona puede tener un
  //    caso Civil y otro Penal por separado: no se fusionan entre áreas.
  const { data: existingIdentity } = await supabase
    .from("contact_identities")
    .select("contact_id")
    .eq("area", area)
    .eq("channel_type", channelType)
    .eq("external_user_id", externalUserId)
    .maybeSingle();

  if (existingIdentity) {
    const { data: contact } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", existingIdentity.contact_id)
      .single();
    return { contact: contact!, created: false };
  }

  // 2) ¿Existe un contacto con el mismo teléfono llegado por otro canal?
  //    (evita duplicar a alguien que primero escribió por Instagram y
  //    después por WhatsApp, por ejemplo).
  if (phone) {
    const { data: byPhone } = await supabase
      .from("contacts")
      .select("*")
      .eq("area", area)
      .eq("phone", phone)
      .maybeSingle();

    if (byPhone) {
      await attachIdentity(byPhone.id, area, channelType, externalUserId);
      return { contact: byPhone, created: false };
    }
  }

  // 3) Contacto nuevo.
  const { data: created, error } = await supabase
    .from("contacts")
    .insert({
      area,
      full_name: fullName ?? null,
      phone: phone ?? null,
      email: email ?? null,
      source,
      first_channel_id: channelId ?? null,
      campaign_id: campaignId ?? null,
    })
    .select()
    .single();

  if (error) {
    // Otro request ganó la carrera insertando el mismo teléfono para esta
    // área justo antes que este: recuperamos ese contacto en vez de fallar.
    if (error.code === UNIQUE_VIOLATION && phone) {
      const { data: winner } = await supabase
        .from("contacts")
        .select("*")
        .eq("area", area)
        .eq("phone", phone)
        .single();
      if (winner) {
        await attachIdentity(winner.id, area, channelType, externalUserId);
        return { contact: winner, created: false };
      }
    }
    throw new Error(`No se pudo crear el contacto: ${error.message}`);
  }

  await attachIdentity(created.id, area, channelType, externalUserId);
  return { contact: created, created: true };
}

async function attachIdentity(
  contactId: string,
  area: Area,
  channelType: ChannelType,
  externalUserId: string
) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("contact_identities").insert({
    contact_id: contactId,
    area,
    channel_type: channelType,
    external_user_id: externalUserId,
  });
  // Si ya existe (carrera concurrente insertando la misma identidad), no es
  // un error real: alguien más ya dejó esa fila.
  if (error && error.code !== UNIQUE_VIOLATION) {
    throw new Error(`No se pudo asociar la identidad del contacto: ${error.message}`);
  }
}

/** Busca o crea la conversación activa de un contacto para un canal dado. */
export async function findOrCreateConversation({
  contactId,
  channelId,
  area,
}: {
  contactId: string;
  channelId: string;
  area: Area;
}) {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("contact_id", contactId)
    .eq("channel_id", channelId)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ contact_id: contactId, channel_id: channelId, area })
    .select()
    .single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      const { data: winner } = await supabase
        .from("conversations")
        .select("*")
        .eq("contact_id", contactId)
        .eq("channel_id", channelId)
        .single();
      if (winner) return winner;
    }
    throw new Error(`No se pudo crear la conversación: ${error.message}`);
  }

  return created;
}
