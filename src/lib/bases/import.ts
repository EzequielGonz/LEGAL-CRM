import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveRowFields, type ColumnMapping } from "./mapping";
import { checkRow } from "./validate";
import { AREA_TO_RUBRO_ID } from "@/lib/rubros";
import type { Area } from "@/lib/supabase/database.types";

const UNIQUE_VIOLATION = "23505";

// Cuántas filas se procesan por consulta a la base en cada lote. No es un
// límite de cuántas filas soporta el importador (eso lo controla
// `rows.length > 5000` en la API) — es solo el tamaño de cada "paquete" de
// inserts/selects para no mandar una sola consulta gigante.
const CHUNK_SIZE = 500;
// Las listas de identificadores viajan en la dirección de la consulta: con
// lotes más chicos no se supera el largo máximo de la URL.
const ID_CHUNK = 150;

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
  /** Columnas elegidas a mano (si no, se detectan por el nombre del encabezado). */
  mapping?: ColumnMapping;
  /** true = el mismo archivo ya se importó y se confirma importarlo otra vez. */
  allowRepeat?: boolean;
}

export interface ImportBaseSummary {
  base_id: string;
  total: number;
  creados: number;
  /** duplicados_en_archivo + ya_existian */
  duplicados: number;
  invalidos: number;
  filas_a_revisar: number; // duplicado o creado pero con teléfono de confianza "revisar"
  /** filas cuyo contacto ya existía y figura contactado (criterio 5.1) */
  contactados_anteriormente: number;
  /** filas cuyo teléfono está detenido en el perfil */
  detenidos: number;
  /** filas con datos distintos a los del contacto existente (no se pisan) */
  conflictos: number;
  duplicados_en_archivo: number;
  /** filas cuyo teléfono ya era un contacto del perfil (base anterior u otra vía) */
  ya_existian: number;
  /** de las que ya existían: estaban en una base anterior */
  en_bases_anteriores: number;
  /** de las que ya existían: contacto llegado por otra vía (WhatsApp, landing, campaña) */
  contactos_existentes: number;
}

export class RepeatedImportError extends Error {
  constructor(public previous: { id: string; name: string; created_at: string }) {
    super(`Este archivo ya se importó en la base «${previous.name}» el ${new Date(previous.created_at).toLocaleString("es-AR")}.`);
    this.name = "RepeatedImportError";
  }
}

/** Huella estable del contenido (mismas filas y columnas = misma huella). */
export function rowsFingerprint(rows: Record<string, unknown>[]): string {
  const h = createHash("sha256");
  for (const row of rows) {
    const keys = Object.keys(row).sort();
    h.update(JSON.stringify(keys.map((k) => [k, row[k] ?? null])));
    h.update("\n");
  }
  return h.digest("hex");
}

/** Evidencia de contacto, de menor a mayor (criterio de la sección 5.1). */
export const CONTACT_STATE_RANK: Record<string, number> = {
  sin_contactar: 0,
  error_contacto: 1,
  contactado_sin_respuesta: 2,
  respondio: 3,
};

export function normName(n: string | null | undefined): string {
  return (n ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z ]/g, " ")
    .split(" ")
    .filter(Boolean)
    .sort()
    .join(" ");
}

export type MatchKind = "nuevo" | "repetido_en_archivo" | "base_anterior" | "contacto_existente";

export const MATCH_KIND_LABEL: Record<MatchKind, string> = {
  nuevo: "Nuevo",
  repetido_en_archivo: "Repetido en el archivo",
  base_anterior: "Ya estaba en otra base",
  contacto_existente: "Contacto existente",
};

interface ParsedRow {
  rowNumber: number;
  rawRow: Record<string, unknown>;
  phone: string;
  confidence: string;
  reason: string | null;
  fullName: string | null;
  email: string | null;
  dniCuil: string | null;
  tipoDeConsulta: string | null;
  fechaDeConsulta: string | null;
  observaciones: string | null;
  localidad: string | null;
  diagnostico: string | null;
  obraSocialActual: string | null;
  isFirstForPhone: boolean;
  phoneOriginal: string | null;
}

/**
 * Procesa una base recién subida: por cada fila cruda, valida y normaliza el
 * teléfono (con la misma validación que muestra la vista previa), deduplica
 * (contra contactos ya existentes Y contra otras filas del mismo archivo) y
 * crea/asocia el contacto correspondiente. La fila original (`raw_data`) se
 * guarda intacta en `imported_base_rows` con todas sus columnas, también las
 * que el CRM no reconoce — nunca se modifica ni se borra desde acá en
 * adelante. Importar nunca envía mensajes ni agrega a nadie a una campaña.
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

  // Protección contra doble ejecución: el mismo contenido no se importa dos
  // veces salvo que se confirme (y una base archivada no cuenta).
  const fingerprint = rowsFingerprint(input.rows);
  if (!input.allowRepeat) {
    const { data: previous } = await supabase
      .from("imported_bases")
      .select("id, name, created_at")
      .eq("area", input.area)
      .eq("file_fingerprint", fingerprint)
      .is("archived_at", null)
      .maybeSingle();
    if (previous) throw new RepeatedImportError(previous as any);
  }

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
      file_fingerprint: input.allowRepeat ? null : fingerprint,
    })
    .select()
    .single();

  if (baseError || !base) {
    if ((baseError as any)?.code === UNIQUE_VIOLATION) {
      // Dos pedidos iguales al mismo tiempo (doble clic o reintento por
      // conexión): el segundo se rechaza y se informa la base del primero.
      const { data: previous } = await supabase
        .from("imported_bases")
        .select("id, name, created_at")
        .eq("area", input.area)
        .eq("file_fingerprint", fingerprint)
        .is("archived_at", null)
        .maybeSingle();
      if (previous) throw new RepeatedImportError(previous as any);
      throw new Error("Este archivo se está importando o ya se importó recién. Revisá la lista de bases antes de volver a intentar.");
    }
    throw new Error(`No se pudo registrar la base: ${baseError?.message}`);
  }
  try {
    return await processImportRows(supabase, base as { id: string }, input);
  } catch (err: any) {
    // Importación interrumpida (corte de tiempo, error de la base): queda
    // registrada como incompleta, con lo que alcanzó a guardarse, y se libera
    // la huella para poder reintentar. Nada se borra.
    const { count } = await supabase
      .from("imported_base_rows")
      .select("id", { count: "exact", head: true })
      .eq("base_id", base.id);
    await supabase
      .from("imported_bases")
      .update({
        file_fingerprint: null,
        import_summary: {
          incompleta: true,
          error: String(err?.message ?? err),
          filas_guardadas: count ?? 0,
          total: input.rows.length,
        },
      })
      .eq("id", base.id);
    throw err;
  }
}

async function processImportRows(
  supabase: ReturnType<typeof createAdminClient>,
  base: { id: string },
  input: ImportBaseInput
): Promise<ImportBaseSummary> {
  const rubroId = AREA_TO_RUBRO_ID[input.area];

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
    const fields = resolveRowFields(rawRow, input.mapping);
    const check = checkRow(rawRow, rowNumber, input.mapping);

    if (!check.phone) {
      invalidos++;
      invalidRowInserts.push({
        base_id: base.id,
        row_number: rowNumber,
        raw_data: rawRow,
        status: "invalido",
        error: check.reason,
      });
      continue;
    }

    if (check.confidence === "revisar") filasARevisar++;

    const isFirstForPhone = !firstIndexByPhone.has(check.phone);
    if (isFirstForPhone) firstIndexByPhone.set(check.phone, parsedRows.length);

    parsedRows.push({
      rowNumber,
      rawRow,
      phone: check.phone,
      confidence: check.confidence,
      reason: check.reason,
      fullName: fields.full_name ? toTitleCase(fields.full_name) : fields.full_name ?? null,
      email: fields.email ?? null,
      dniCuil: fields.dni_cuil ?? null,
      tipoDeConsulta: fields.tipo_de_consulta ?? null,
      fechaDeConsulta: fields.fecha_de_consulta ?? null,
      observaciones: fields.observaciones ?? null,
      localidad: fields.localidad ?? null,
      diagnostico: fields.diagnostico ?? null,
      obraSocialActual: fields.obra_social_actual ?? null,
      isFirstForPhone,
      phoneOriginal: check.phoneOriginal,
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

  // --- Paso 2.5: para los que ya existían, "contactado anteriormente" con
  // el criterio de la sección 5.1 (su oportunidad figura contactada o con
  // respuesta, o hay mensajes salientes), con fecha, campaña y línea del
  // último contacto ANTERIOR a esta carga; conflictos de nombre (no se pisa
  // nada); si ya estaban en otra base; y detenciones por teléfono.
  const existingIds = [...new Set([...contactIdByPhone.values()])];
  const prevStateByContact = new Map<string, string>();
  const nameByContact = new Map<string, string | null>();
  const fromBase = new Set<string>();
  for (const ids of chunkArray(existingIds, ID_CHUNK)) {
    const [{ data: opps }, { data: cts }, { data: otherRows }] = await Promise.all([
      supabase.from("opportunities").select("contact_id, contact_state").in("contact_id", ids),
      supabase.from("contacts").select("id, full_name, imported_base_id").in("id", ids),
      supabase.from("imported_base_rows").select("contact_id").in("contact_id", ids).neq("base_id", base.id).limit(1000),
    ]);
    // Si el contacto tiene más de una oportunidad, vale la evidencia más
    // fuerte (una oportunidad nueva "sin contactar" no borra la anterior).
    for (const o of opps ?? []) {
      const prev = prevStateByContact.get(o.contact_id);
      if (!prev || (CONTACT_STATE_RANK[o.contact_state] ?? 0) > (CONTACT_STATE_RANK[prev] ?? 0)) {
        prevStateByContact.set(o.contact_id, o.contact_state);
      }
    }
    for (const c of cts ?? []) {
      nameByContact.set(c.id, c.full_name);
      if (c.imported_base_id && c.imported_base_id !== base.id) fromBase.add(c.id);
    }
    for (const r of otherRows ?? []) if (r.contact_id) fromBase.add(r.contact_id);
  }
  const lastOutbound = new Map<string, { at: string; campaign_id: string | null; campaign_name: string | null; line_label: string | null }>();
  for (const ids of chunkArray(existingIds, 1000)) {
    const { data } = await supabase.rpc("contacts_last_outbound", { p_ids: ids });
    for (const r of (data ?? []) as any[]) {
      lastOutbound.set(r.contact_id, {
        at: r.last_at,
        campaign_id: r.campaign_id ?? null,
        campaign_name: r.campaign_name ?? null,
        line_label: r.line_label ?? null,
      });
    }
  }
  const detainedByPhone = new Map<string, string>();
  for (const phones of chunkArray(uniquePhones, CHUNK_SIZE)) {
    const { data } = await supabase.rpc("detained_phones", { p_rubro: rubroId, p_phones: phones });
    for (const d of (data ?? []) as any[]) detainedByPhone.set(d.phone_normalized, d.motive);
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
      if (row.diagnostico) qualification_data.diagnostico = row.diagnostico;
      if (row.obraSocialActual) qualification_data.obra_social_actual = row.obraSocialActual;
      return {
        area: input.area,
        full_name: row.fullName,
        phone,
        email: row.email,
        source: "base_de_datos" as const,
        dni_cuil: row.dniCuil,
        imported_base_id: base.id,
        qualification_data,
        rubro_id: rubroId,
        phone_original: row.phoneOriginal,
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
  let contactadosAntes = 0;
  let detenidos = 0;
  let conflictos = 0;
  let enBasesAnteriores = 0;
  let contactosExistentes = 0;
  const validRowInserts = parsedRows.map((row) => {
    const contactId = contactIdByPhone.get(row.phone) ?? null;
    const existed = !newPhoneSet.has(row.phone);
    const prev = existed && contactId ? prevStateByContact.get(contactId) ?? null : null;
    const outbound = existed && contactId ? lastOutbound.get(contactId) ?? null : null;
    const previouslyContacted = prev === "contactado_sin_respuesta" || prev === "respondio" || !!outbound;
    const detainedMotive = detainedByPhone.get(row.phone) ?? null;
    const existingName = existed && contactId ? nameByContact.get(contactId) ?? null : null;
    const conflict =
      existed && row.fullName && existingName && normName(row.fullName) !== normName(existingName)
        ? `Nombre distinto al del contacto existente («${existingName}»); no se modificó`
        : null;
    const matchKind: MatchKind = !row.isFirstForPhone
      ? "repetido_en_archivo"
      : !existed
        ? "nuevo"
        : contactId && fromBase.has(contactId)
          ? "base_anterior"
          : "contacto_existente";
    if (previouslyContacted) contactadosAntes++;
    if (detainedMotive) detenidos++;
    if (conflict) conflictos++;
    if (matchKind === "base_anterior") enBasesAnteriores++;
    if (matchKind === "contacto_existente") contactosExistentes++;
    return {
      base_id: base.id,
      row_number: row.rowNumber,
      raw_data: row.rawRow,
      status: row.isFirstForPhone && newPhoneSet.has(row.phone) ? "creado" : "duplicado",
      error: row.reason,
      contact_id: contactId,
      previously_contacted: existed ? previouslyContacted : false,
      previous_contact_state: prev,
      previous_contact: previouslyContacted
        ? {
            estado: prev,
            fecha: outbound?.at ?? null,
            campana_id: outbound?.campaign_id ?? null,
            campana: outbound?.campaign_name ?? null,
            linea: outbound?.line_label ?? null,
          }
        : null,
      detained_motive: detainedMotive,
      conflict,
      match_kind: matchKind,
    };
  });

  for (const rows of chunkArray([...invalidRowInserts, ...validRowInserts], CHUNK_SIZE)) {
    const { error } = await supabase.from("imported_base_rows").insert(rows);
    if (error) {
      throw new Error(`No se pudo guardar el detalle de la importación: ${error.message}`);
    }
  }

  const duplicadosEnArchivo = parsedRows.filter((r) => !r.isFirstForPhone).length;
  const summary: ImportBaseSummary = {
    base_id: base.id,
    total: input.rows.length,
    creados,
    duplicados,
    invalidos,
    filas_a_revisar: filasARevisar,
    contactados_anteriormente: contactadosAntes,
    detenidos,
    conflictos,
    duplicados_en_archivo: duplicadosEnArchivo,
    ya_existian: duplicados - duplicadosEnArchivo,
    en_bases_anteriores: enBasesAnteriores,
    contactos_existentes: contactosExistentes,
  };

  await supabase
    .from("imported_bases")
    .update({
      created_rows: creados,
      duplicate_rows: duplicados,
      invalid_rows: invalidos,
      import_summary: summary,
    })
    .eq("id", base.id);

  return summary;
}
