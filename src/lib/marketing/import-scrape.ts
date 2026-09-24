import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhoneAR } from "@/lib/phone";
import { findOrCreateContact } from "@/lib/contacts";
import type { ScrapedPlace } from "./google-places";

export interface ImportScrapeSummary {
  base_id: string;
  total: number;
  creados: number;
  duplicados: number;
  invalidos: number;
  new_contact_ids: string[];
}

/**
 * Vuelca los negocios encontrados por el scraper de Google Maps como una
 * "base importada" más (misma tabla `imported_bases`/`imported_base_rows`
 * que ya usan las bases de Excel/CSV) — así se reutiliza toda la vista de
 * detalle, la planilla, el borrado y la creación de campañas desde
 * contactos seleccionados, sin duplicar nada de eso.
 *
 * Deduplicación en DOS niveles, para que un negocio nunca entre dos veces
 * aunque se repita la misma búsqueda otro día:
 *  1. Por `place_id` de Google (tabla `scraped_places`): si ese lugar
 *     exacto ya apareció en cualquier corrida anterior, se marca
 *     "duplicado" al toque, tenga o no teléfono. Esto es lo que garantiza
 *     que buscar "restaurantes en Vicente López" el lunes y de nuevo el
 *     miércoles nunca traiga los mismos negocios dos veces.
 *  2. Por teléfono dentro del rubro Marketing (la misma lógica que ya usa
 *     `findOrCreateContact` en toda la app): si el teléfono ya es un
 *     contacto de Marketing por otra vía, se reutiliza ese contacto en vez
 *     de crear uno nuevo.
 */
export async function importScrapedPlaces({
  rubroBuscado,
  zona,
  places,
}: {
  rubroBuscado: string;
  zona: string;
  places: ScrapedPlace[];
}): Promise<ImportScrapeSummary> {
  const supabase = createAdminClient();

  const { data: base, error: baseError } = await supabase
    .from("imported_bases")
    .insert({
      area: "marketing",
      name: `${rubroBuscado} en ${zona}`,
      source_label: "Google Maps",
      file_name: null,
      total_rows: places.length,
    })
    .select()
    .single();

  if (baseError || !base) {
    throw new Error(`No se pudo registrar la corrida de captación: ${baseError?.message}`);
  }

  let creados = 0;
  let duplicados = 0;
  let invalidos = 0;
  const newContactIds: string[] = [];
  const rowInserts: Record<string, unknown>[] = [];

  for (let i = 0; i < places.length; i++) {
    const place = places[i];
    const rowNumber = i + 1;
    const rawData = {
      nombre: place.name,
      telefono: place.phone,
      direccion: place.address,
      sitio_web: place.website,
      rating: place.rating,
      cantidad_resenas: place.ratingCount,
      categorias: place.types.join(", "),
      google_place_id: place.placeId,
    };

    // Nivel 1: ¿ya vimos este lugar exacto en cualquier corrida anterior?
    const { data: seen } = await supabase
      .from("scraped_places")
      .select("contact_id")
      .eq("area", "marketing")
      .eq("place_id", place.placeId)
      .maybeSingle();

    if (seen) {
      duplicados++;
      rowInserts.push({
        base_id: base.id,
        row_number: rowNumber,
        raw_data: rawData,
        status: "duplicado",
        error: "Ya se había encontrado en una búsqueda anterior",
        contact_id: seen.contact_id,
      });
      continue;
    }

    const { phone } = normalizePhoneAR(place.phone ?? "");

    if (!phone) {
      invalidos++;
      rowInserts.push({
        base_id: base.id,
        row_number: rowNumber,
        raw_data: rawData,
        status: "invalido",
        error: "Sin teléfono publicado en Google Maps",
        contact_id: null,
      });
      await supabase
        .from("scraped_places")
        .upsert(
          { area: "marketing", place_id: place.placeId, contact_id: null, base_id: base.id },
          { onConflict: "area,place_id", ignoreDuplicates: true }
        );
      continue;
    }

    // Nivel 2: dedup por teléfono dentro de Marketing (misma lógica que el
    // resto del sistema usa para cualquier contacto nuevo, incluye asociar
    // la identidad de WhatsApp = teléfono).
    const { contact, created } = await findOrCreateContact({
      area: "marketing",
      channelType: "whatsapp",
      externalUserId: phone,
      phone,
      fullName: place.name,
      source: "google_maps",
      channelId: null,
      campaignId: null,
    });

    if (created) {
      creados++;
      newContactIds.push(contact.id);
      await supabase
        .from("contacts")
        .update({
          imported_base_id: base.id,
          qualification_data: {
            direccion: place.address,
            sitio_web: place.website,
            rating: place.rating,
            rubro_buscado: rubroBuscado,
            zona_buscada: zona,
          },
        })
        .eq("id", contact.id);
    } else {
      duplicados++;
    }

    rowInserts.push({
      base_id: base.id,
      row_number: rowNumber,
      raw_data: rawData,
      status: created ? "creado" : "duplicado",
      error: null,
      contact_id: contact.id,
    });

    await supabase
      .from("scraped_places")
      .upsert(
        { area: "marketing", place_id: place.placeId, contact_id: contact.id, base_id: base.id },
        { onConflict: "area,place_id", ignoreDuplicates: true }
      );
  }

  if (rowInserts.length > 0) {
    const { error: rowsError } = await supabase.from("imported_base_rows").insert(rowInserts);
    if (rowsError) {
      throw new Error(`No se pudo guardar el detalle de la búsqueda: ${rowsError.message}`);
    }
  }

  await supabase
    .from("imported_bases")
    .update({ created_rows: creados, duplicate_rows: duplicados, invalid_rows: invalidos })
    .eq("id", base.id);

  return {
    base_id: base.id,
    total: places.length,
    creados,
    duplicados,
    invalidos,
    new_contact_ids: newContactIds,
  };
}
