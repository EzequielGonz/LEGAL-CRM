import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Borra una base importada (el registro de la importación, no los contactos
 * que generó). Por el esquema de la base:
 * - `imported_base_rows.base_id references imported_bases(id) on delete
 *   cascade`: las filas crudas de esa importación se borran solas.
 * - `contacts.imported_base_id references imported_bases(id) on delete set
 *   null`: los contactos que se crearon a partir de esta base NUNCA se
 *   borran — solo quedan desasociados de la base borrada, y siguen
 *   apareciendo en Prospectos con toda su información.
 *
 * Además intentamos borrar el archivo original (Excel/CSV) guardado en
 * Storage. Si eso falla (bucket caído, ya no existe, etc.) no bloqueamos el
 * borrado del registro: el archivo es un respaldo, no el dato crítico.
 */
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createAdminClient();

  const { data: base } = await supabase
    .from("imported_bases")
    .select("storage_path")
    .eq("id", params.id)
    .maybeSingle();

  const { error } = await supabase.from("imported_bases").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (base?.storage_path) {
    try {
      await supabase.storage.from("bases-originales").remove([base.storage_path]);
    } catch {
      // Best-effort: si no se pudo borrar el archivo original, no pasa nada
      // grave — el registro de la base (que es lo que se veía en el panel)
      // ya se borró bien.
    }
  }

  return NextResponse.json({ ok: true });
}
