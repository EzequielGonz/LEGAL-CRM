import { createAdminClient } from "@/lib/supabase/admin";
import { findOrCreateContact } from "@/lib/contacts";
import { normalizePhoneAR } from "@/lib/phone";
import { extractRowFields } from "./mapping";
import type { Area } from "@/lib/supabase/database.types";

export interface ImportBaseInput {
  area: Area;
  name: string;
  sourceLabel: string;
  fileName?: string | null;
  rows: Record<string, unknown>[];
  importedBy?: string | null;
}

export interface ImportBaseSummary {
  base_id: string;
  total: number;
  creados: number;
  duplicados: number;
  invalidos: number;
  filas_a_revisar: number; // duplicado o creado pero con teléfono de confianza "revisar"
}

/**
 * Procesa una base recién subida: por cada fila cruda, valida y normaliza el
 * teléfono, deduplica (contra contactos ya existentes Y contra otras filas
 * del mismo archivo) y crea/asocia el contacto correspondiente. La fila
 * original (`raw_data`) se guarda intacta en `imported_base_rows` para
 * quedar como registro auditable — nunca se modifica ni se borra desde acá
 * en adelante.
 */
export async function importBase(input: ImportBaseInput): Promise<ImportBaseSummary> {
  const supabase = createAdminClient();

  const { data: base, error: baseError } = await supabase
    .from("imported_bases")
    .insert({
      area: input.area,
      name: input.name,
      source_label: input.sourceLabel,
      file_name: input.fileName ?? null,
      imported_by: input.importedBy ?? null,
      total_rows: input.rows.length,
    })
    .select()
    .single();

  if (baseError || !base) {
    throw new Error(`No se pudo registrar la base: ${baseError?.message}`);
  }

  let creados = 0;
  let duplicados = 0;
  let invalidos = 0;
  let filasARevisar = 0;

  // Dedup dentro del propio archivo: mismo teléfono normalizado repetido dos
  // veces en la misma base no debe crear dos contactos.
  const seenInFile = new Map<string, string>(); // phone -> contact_id

  for (let i = 0; i < input.rows.length; i++) {
    const rawRow = input.rows[i];
    const fields = extractRowFields(rawRow);
    const { phone, confidence } = normalizePhoneAR(fields.phone_raw);

    if (!phone) {
      invalidos++;
      await supabase.from("imported_base_rows").insert({
        base_id: base.id,
        row_number: i + 1,
        raw_data: rawRow,
        status: "invalido",
        error: "Sin teléfono o formato irreconocible",
      });
      continue;
    }

    if (confidence === "revisar") filasARevisar++;

    if (seenInFile.has(phone)) {
      duplicados++;
      await supabase.from("imported_base_rows").insert({
        base_id: base.id,
        row_number: i + 1,
        raw_data: rawRow,
        status: "duplicado",
        error: "Teléfono repetido dentro de la misma base",
        contact_id: seenInFile.get(phone),
      });
      continue;
    }

    const { contact, created } = await findOrCreateContact({
      area: input.area,
      channelType: "whatsapp",
      externalUserId: phone,
      phone,
      fullName: fields.full_name,
      email: fields.email,
      source: "base_de_datos",
      campaignId: null,
    });

    seenInFile.set(phone, contact.id);

    if (created) {
      creados++;
      // Solo completamos estos campos al crear el contacto: si ya existía
      // (por ejemplo, llegó antes por Instagram) no pisamos su historial.
      const mergedQualification = {
        ...(contact.qualification_data ?? {}),
        ...(fields.tipo_de_consulta ? { tipo_de_consulta: fields.tipo_de_consulta } : {}),
        ...(fields.fecha_de_consulta ? { fecha_de_consulta_base: fields.fecha_de_consulta } : {}),
        ...(fields.observaciones ? { observaciones_base: fields.observaciones } : {}),
      };
      await supabase
        .from("contacts")
        .update({
          dni_cuil: fields.dni_cuil,
          imported_base_id: base.id,
          qualification_data: mergedQualification,
        })
        .eq("id", contact.id);
    } else {
      duplicados++;
    }

    await supabase.from("imported_base_rows").insert({
      base_id: base.id,
      row_number: i + 1,
      raw_data: rawRow,
      status: created ? "creado" : "duplicado",
      error: confidence === "revisar" ? "Teléfono normalizado con baja confianza: revisar" : null,
      contact_id: contact.id,
    });
  }

  await supabase
    .from("imported_bases")
    .update({
      created_rows: creados,
      duplicate_rows: duplicados,
      invalid_rows: invalidos,
    })
    .eq("id", base.id);

  return {
    base_id: base.id,
    total: input.rows.length,
    creados,
    duplicados,
    invalidos,
    filas_a_revisar: filasARevisar,
  };
}
