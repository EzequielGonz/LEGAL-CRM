import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractRowFields } from "@/lib/bases/mapping";
import { normalizePhoneAR } from "@/lib/phone";

const UNIQUE_VIOLATION = "23505";

// Mismo motivo que en /api/bases: procesar en lotes en vez de fila por fila,
// para no agotar el tiempo máximo de la función con archivos grandes.
const CHUNK_SIZE = 500;
export const maxDuration = 60;

function chunkArray<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

interface ParsedRow {
  phone: string;
  fullName: string | null;
  tipoDeConsulta: string | null;
  fechaDeConsulta: string | null;
  observaciones: string | null;
  localidad: string | null;
}

/**
 * Recibe filas CRUDAS (tal como las devuelve parseSpreadsheetFile, con los
 * headers originales del CSV/Excel como claves — no ya mapeadas a
 * full_name/phone) y las agrega como destinatarios de una campaña ya
 * creada.
 *
 * Antes esta ruta esperaba que el cliente ya hubiera adivinado las columnas
 * buscando literalmente las claves "nombre"/"telefono", y guardaba el
 * teléfono tal cual venía en la planilla (sin normalizar al formato
 * 549+área+número que espera WhatsApp). Ahora usa exactamente el mismo
 * reconocimiento de columnas por alias (`extractRowFields`) y la misma
 * normalización de teléfono (`normalizePhoneAR`) que la sección de Bases,
 * y procesa todo en lotes en vez de fila por fila por el mismo motivo que
 * se corrigió ahí: con archivos de miles de filas, ir de a una agotaba el
 * tiempo máximo de la función en Vercel.
 *
 * También excluye automáticamente de la cola a cualquier contacto que ya
 * haya recibido un mensaje de campaña en el pasado (de esta campaña o de
 * cualquier otra, aunque ya esté borrada) — así, subir el mismo archivo a
 * una campaña nueva no le vuelve a mandar el "primer contacto" a alguien
 * que ya lo recibió.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { campaign_id, rows } = body as {
    campaign_id?: string;
    rows?: unknown;
  };

  if (!campaign_id || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Faltan campaign_id o filas para importar" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaign_id)
    .single();

  if (!campaign) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });

  // --- Paso 1: interpretar y normalizar todas las filas en memoria.
  const parsedRows: ParsedRow[] = [];
  let skipped = 0;
  const firstIndexByPhone = new Map<string, number>();

  for (const rawRow of rows as Record<string, unknown>[]) {
    const fields = extractRowFields(rawRow);
    const { phone } = normalizePhoneAR(fields.phone_raw);

    if (!phone) {
      skipped++;
      continue;
    }

    if (!firstIndexByPhone.has(phone)) firstIndexByPhone.set(phone, parsedRows.length);

    parsedRows.push({
      phone,
      fullName: fields.full_name ?? null,
      tipoDeConsulta: fields.tipo_de_consulta ?? null,
      fechaDeConsulta: fields.fecha_de_consulta ?? null,
      observaciones: fields.observaciones ?? null,
      localidad: fields.localidad ?? null,
    });
  }

  const uniquePhones = [...firstIndexByPhone.keys()];

  // --- Paso 2: buscar en lote cuáles de esos teléfonos ya son contactos
  // existentes (por identidad de WhatsApp, o por teléfono en la misma área).
  const contactIdByPhone = new Map<string, string>();

  for (const phones of chunkArray(uniquePhones, CHUNK_SIZE)) {
    const { data: identities } = await supabase
      .from("contact_identities")
      .select("contact_id, external_user_id")
      .eq("area", campaign.area)
      .eq("channel_type", "whatsapp")
      .in("external_user_id", phones);
    for (const row of identities ?? []) {
      contactIdByPhone.set(row.external_user_id, row.contact_id);
    }
  }

  const phonesWithoutIdentity = uniquePhones.filter((p) => !contactIdByPhone.has(p));
  for (const phones of chunkArray(phonesWithoutIdentity, CHUNK_SIZE)) {
    const { data: contactsByPhone } = await supabase
      .from("contacts")
      .select("id, phone")
      .eq("area", campaign.area)
      .in("phone", phones);
    for (const c of contactsByPhone ?? []) {
      if (c.phone) contactIdByPhone.set(c.phone, c.id);
    }
  }

  // --- Paso 3: crear en lote los contactos que todavía no existían.
  const newPhones = uniquePhones.filter((p) => !contactIdByPhone.has(p));

  for (const phones of chunkArray(newPhones, CHUNK_SIZE)) {
    const rowsToInsert = phones.map((phone) => {
      const row = parsedRows[firstIndexByPhone.get(phone)!];
      const qualification_data: Record<string, unknown> = {};
      if (row.tipoDeConsulta) qualification_data.tipo_de_consulta = row.tipoDeConsulta;
      if (row.fechaDeConsulta) qualification_data.fecha_de_consulta_base = row.fechaDeConsulta;
      if (row.observaciones) qualification_data.observaciones_base = row.observaciones;
      if (row.localidad) qualification_data.localidad = row.localidad;
      return {
        area: campaign.area,
        full_name: row.fullName,
        phone,
        source: "base_de_datos" as const,
        first_channel_id: campaign.channel_id ?? null,
        campaign_id: campaign.id,
        qualification_data,
      };
    });

    let { data: inserted, error: insertError } = await supabase
      .from("contacts")
      .insert(rowsToInsert)
      .select("id, phone");

    if (insertError) {
      // Carrera rara: alguien escribió por WhatsApp con ese mismo teléfono
      // justo mientras se importaba. Buscamos quién ganó la carrera e
      // insertamos solo los que de verdad siguen faltando.
      if (insertError.code !== UNIQUE_VIOLATION) {
        return NextResponse.json(
          { error: `No se pudieron crear los contactos: ${insertError.message}` },
          { status: 500 }
        );
      }
      const { data: nowExisting } = await supabase
        .from("contacts")
        .select("id, phone")
        .eq("area", campaign.area)
        .in("phone", phones);
      const wonRace = new Set((nowExisting ?? []).map((c) => c.phone));
      const stillMissing = rowsToInsert.filter((r) => !wonRace.has(r.phone));

      inserted = [...(nowExisting ?? [])];
      if (stillMissing.length > 0) {
        const { data: retryInserted, error: retryError } = await supabase
          .from("contacts")
          .insert(stillMissing)
          .select("id, phone");
        if (retryError) {
          return NextResponse.json(
            { error: `No se pudieron crear los contactos: ${retryError.message}` },
            { status: 500 }
          );
        }
        inserted = [...inserted, ...(retryInserted ?? [])];
      }
    }

    for (const c of inserted ?? []) {
      if (c.phone) contactIdByPhone.set(c.phone, c.id);
    }
  }

  // --- Paso 4: asociar la identidad de WhatsApp a todos los contactos
  // (nuevos y existentes). Si ya existía, el `upsert` con `ignoreDuplicates`
  // no hace nada.
  for (const phones of chunkArray(uniquePhones, CHUNK_SIZE)) {
    const identityRows = phones.map((phone) => ({
      contact_id: contactIdByPhone.get(phone)!,
      area: campaign.area,
      channel_type: "whatsapp" as const,
      external_user_id: phone,
    }));
    const { error } = await supabase
      .from("contact_identities")
      .upsert(identityRows, {
        onConflict: "area,channel_type,external_user_id",
        ignoreDuplicates: true,
      });
    if (error) {
      return NextResponse.json(
        { error: `No se pudieron asociar las identidades: ${error.message}` },
        { status: 500 }
      );
    }
  }

  // --- Paso 4.5: no volver a agregar a la cola a quien YA recibió alguna
  // vez un mensaje de campaña (de esta campaña o de cualquier otra
  // anterior, aunque esa campaña ya se haya borrado). Sin este paso,
  // reimportar el mismo archivo en una campaña nueva le manda un "primer
  // contacto" de nuevo a gente que ya lo recibió — pedido explícito para
  // no volver a molestar a los ~100 que ya se contactaron en la tanda
  // anterior. La fuente de verdad es el registro de mensajes salientes
  // (`messages`, filtrado por `metadata.campaign_id`), no el estado del
  // contacto ni de `campaign_contacts` — esas filas se borran junto con la
  // campaña, pero el mensaje ya se mandó igual y eso no se puede deshacer.
  const allContactIds = [...new Set(contactIdByPhone.values())];
  const alreadyContactedIds = new Set<string>();

  for (const ids of chunkArray(allContactIds, CHUNK_SIZE)) {
    const { data: convRows } = await supabase
      .from("conversations")
      .select("id, contact_id")
      .in("contact_id", ids);
    if (!convRows || convRows.length === 0) continue;

    const convIdToContactId = new Map(convRows.map((c) => [c.id, c.contact_id]));
    const conversationIds = convRows.map((c) => c.id);

    for (const convIdsChunk of chunkArray(conversationIds, CHUNK_SIZE)) {
      const { data: msgRows } = await supabase
        .from("messages")
        .select("conversation_id, metadata")
        .in("conversation_id", convIdsChunk)
        .eq("direction", "saliente");
      for (const m of msgRows ?? []) {
        const metadata = m.metadata as any;
        if (metadata && metadata.campaign_id) {
          const cId = convIdToContactId.get(m.conversation_id);
          if (cId) alreadyContactedIds.add(cId);
        }
      }
    }
  }

  let yaContactados = 0;
  const phonesToQueue: string[] = [];
  for (const phone of uniquePhones) {
    const contactId = contactIdByPhone.get(phone)!;
    if (alreadyContactedIds.has(contactId)) {
      yaContactados++;
    } else {
      phonesToQueue.push(phone);
    }
  }

  // --- Paso 5: agregar como destinatarios pendientes de la campaña a
  // todos menos a los que ya se contactaron antes (paso 4.5).
  for (const phones of chunkArray(phonesToQueue, CHUNK_SIZE)) {
    const campaignContactRows = phones.map((phone) => ({
      campaign_id: campaign.id,
      contact_id: contactIdByPhone.get(phone)!,
      status: "pendiente",
    }));
    const { error } = await supabase
      .from("campaign_contacts")
      .upsert(campaignContactRows, {
        onConflict: "campaign_id,contact_id",
        ignoreDuplicates: true,
      });
    if (error) {
      return NextResponse.json(
        { error: `No se pudieron agregar los destinatarios a la campaña: ${error.message}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    imported: parsedRows.length,
    skipped,
    agregados: phonesToQueue.length,
    yaContactados,
  });
}
