import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhoneAR } from "@/lib/phone";
import { extractRowFields } from "./mapping";
import type { Area } from "@/lib/supabase/database.types";

const UNIQUE_VIOLATION = "23505";

// Cuántas filas se procesan por consulta a la base en cada lote. No es un
// límite de cuántas filas soporta el importador (eso lo controla
// `rows.length > 5000` en la API) — es solo el tamaño de cada "paquete" de
// inserts/selects para no mandar una sola consulta gigante.
const CHUNK_SIZE = 500;

/**
 * Muchas planillas de bases vienen con el nombre en MAYÚSCULA SOSTENIDA
 * (ej. "RODRIGUEZ AQUINO ANGEL"), que se ve mal en el panel y en los
 * mensajes de WhatsApp (que usan el primer nombre). Lo pasamos a
 * Formato Título antes de guardarlo.
 */
function toTitleCase(name: string): string {
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export interface ImportBaseInput {
  area: Area;
  name: string;
  sourceLabel: string;
  fileName?: string | null;
  rows: Record<string, unknown>[];
  importedBy?: string | null;
  /**
   * Ruta dentro del bucket "bases-originales" donde el archivo original ya
   * quedó guardado. El archivo se sube directo desde el navegador a Storage
   * (con una URL firmada, ver /api/bases/upload-url) ANTES de llamar a esta
   * función — así el archivo pesado nunca pasa por esta función serverless,
   * que en Vercel tiene un límite de ~4.5MB por request (superarlo tiraba
   * "Request Entity Too Large", un error que ni siquiera es JSON y por eso
   * el panel mostraba "Unexpected token 'R'..."). Opcional: si no viene, la
   * base queda igual pero sin archivo descargable.
   */
  storagePath?: string | null;
}

export interface ImportBaseSummary {
  base_id: string;
  total: number;
  creados: number;
  duplicados: number;
  invalidos: number;
  filas_a_revisar: number; // duplicado o creado pero con teléfono de confianza "revisar"
}

interface ParsedRow {
  rowNumber: number;
  rawRow: Record<string, unknown>;
  phone: string;
  confidence: string;
  fullName: string | null;
  email: string | null;
  dniCuil: string | null;
  tipoDeConsulta: string | null;
  fechaDeConsulta: string | null;
  observaciones: string | null;
  localidad: string | null;
  isFirstForPhone: boolean;
}

/**
 * Procesa una base recién subida: por cada fila cruda, valida y normaliza el
 * teléfono, deduplica (contra contactos ya existentes Y contra otras filas
 * del mismo archivo) y crea/asocia el contacto correspondiente. La fila
 * original (`raw_data`) se guarda intacta en `imported_base_rows` para
 * quedar como registro auditable — nunca se modifica ni se borra desde acá
 * en adelante.
 *
 * Todo esto se hace en lotes (`CHUNK_SIZE` filas por consulta) en vez de
 * fila por fila: antes cada fila hacía 3-4 viajes a la base uno por uno, lo
 * que con archivos de miles de filas tardaba varios minutos y Vercel
 * cortaba la función por tiempo ("Task timed out after 300 seconds" — el
 * error "An error o..." al importar un archivo grande). En lotes, un
 * archivo de miles de filas se procesa en segundos.
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
      // El archivo ya se subió a Storage antes de llegar acá (ver
      // storagePath arriba) — solo guardamos la ruta.
      storage_path: input.storagePath ?? null,
    })
    .select()
    .single();

  if (baseError || !base) {
    throw new Error(`No se pudo registrar la base: ${baseError?.message}`);
  }

  // --- Paso 1: parsear y normalizar todas las filas en memoria (sin
  // pegarle todavía a la base de datos).
  const parsedRows: ParsedRow[] = [];
  const invalidRowInserts: Record<string, unknown>[] = [];
  const firstIndexByPhone = new Map<string, number>();
  let invalidos = 0;
  let filasARevisar = 0;

  for (let i = 0; i < input.rows.length; i++) {
    const rawRow = input.rows[i];
    const rowNumber = i + 1;
    const fields = extractRowFields(rawRow);
    const { phone, confidence } = normalizePhoneAR(fields.phone_raw);

    if (!phone) {
      invalidos++;
      invalidRowInserts.push({
        base_id: base.id,
        row_number: rowNumber,
        raw_data: rawRow,
        status: "invalido",
        error: "Sin teléfono o formato irreconocible",
      });
      continue;
    }

    if (confidence === "revisar") filasARevisar++;

    const isFirstForPhone = !firstIndexByPhone.has(phone);
    if (isFirstForPhone) firstIndexByPhone.set(phone, parsedRows.length);

    parsedRows.push({
      rowNumber,
      rawRow,
      phone,
      confidence,
      fullName: fields.full_name ? toTitleCase(fields.full_name) : fields.full_name ?? null,
      email: fields.email ?? null,
      dniCuil: fields.dni_cuil ?? null,
      tipoDeConsulta: fields.tipo_de_consulta ?? null,
      fechaDeConsulta: fields.fecha_de_consulta ?? null,
      observaciones: fields.observaciones ?? null,
      localidad: fields.localidad ?? null,
      isFirstForPhone,
    });
  }

  const uniquePhones = [...firstIndexByPhone.keys()];

  // --- Paso 2: buscar en lote cuáles de esos teléfonos ya son contactos
  // existentes (por identidad de WhatsApp, o por teléfono dentro de la
  // misma área).
  const contactIdByPhone = new Map<string, string>();

  for (const phones of chunkArray(uniquePhones, CHUNK_SIZE)) {
    const { data: identities } = await supabase
      .from("contact_identities")
      .select("contact_id, external_user_id")
      .eq("area", input.area)
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
      .eq("area", input.area)
      .in("phone", phones);
    for (const c of contactsByPhone ?? []) {
      if (c.phone) contactIdByPhone.set(c.phone, c.id);
    }
  }

  // --- Paso 3: crear en lote los contactos que todavía no existían.
  const newPhones = uniquePhones.filter((p) => !contactIdByPhone.has(p));
  const newPhoneSet = new Set(newPhones);

  for (const phones of chunkArray(newPhones, CHUNK_SIZE)) {
    const rowsToInsert = phones.map((phone) => {
      const row = parsedRows[firstIndexByPhone.get(phone)!];
      const qualification_data: Record<string, unknown> = {};
      if (row.tipoDeConsulta) qualification_data.tipo_de_consulta = row.tipoDeConsulta;
      if (row.fechaDeConsulta) qualification_data.fecha_de_consulta_base = row.fechaDeConsulta;
      if (row.observaciones) qualification_data.observaciones_base = row.observaciones;
      if (row.localidad) qualification_data.localidad = row.localidad;
      return {
        area: input.area,
        full_name: row.fullName,
        phone,
        email: row.email,
        source: "base_de_datos" as const,
        dni_cuil: row.dniCuil,
        imported_base_id: base.id,
        qualification_data,
      };
    });

    let { data: inserted, error: insertError } = await supabase
      .from("contacts")
      .insert(rowsToInsert)
      .select("id, phone");

    if (insertError) {
      // Carrera rara: alguien escribió por WhatsApp con ese mismo teléfono
      // justo mientras se importaba la base. Buscamos quién ganó la carrera
      // e insertamos solo los que de verdad siguen faltando.
      if (insertError.code !== UNIQUE_VIOLATION) {
        throw new Error(`No se pudieron crear los contactos: ${insertError.message}`);
      }
      const { data: nowExisting } = await supabase
        .from("contacts")
        .select("id, phone")
        .eq("area", input.area)
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
          throw new Error(`No se pudieron crear los contactos: ${retryError.message}`);
        }
        inserted = [...inserted, ...(retryInserted ?? [])];
      }
    }

    for (const c of inserted ?? []) {
      if (c.phone) contactIdByPhone.set(c.phone, c.id);
    }
  }

  const creados = newPhones.length;
  const duplicados = parsedRows.length - creados;

  // --- Paso 4: asociar la identidad de WhatsApp a todos los contactos
  // (nuevos y existentes). Si ya existía esa identidad, el `upsert` con
  // `ignoreDuplicates` simplemente no hace nada.
  for (const phones of chunkArray(uniquePhones, CHUNK_SIZE)) {
    const identityRows = phones.map((phone) => ({
      contact_id: contactIdByPhone.get(phone)!,
      area: input.area,
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
      throw new Error(`No se pudieron asociar las identidades: ${error.message}`);
    }
  }

  // --- Paso 5: guardar el registro auditable de cada fila
  // (`imported_base_rows`), en lote.
  const validRowInserts = parsedRows.map((row) => ({
    base_id: base.id,
    row_number: row.rowNumber,
    raw_data: row.rawRow,
    status: row.isFirstForPhone && newPhoneSet.has(row.phone) ? "creado" : "duplicado",
    error: row.confidence === "revisar" ? "Teléfono normalizado con baja confianza: revisar" : null,
    contact_id: contactIdByPhone.get(row.phone) ?? null,
  }));

  for (const rows of chunkArray([...invalidRowInserts, ...validRowInserts], CHUNK_SIZE)) {
    const { error } = await supabase.from("imported_base_rows").insert(rows);
    if (error) {
      throw new Error(`No se pudo guardar el detalle de la importación: ${error.message}`);
    }
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
