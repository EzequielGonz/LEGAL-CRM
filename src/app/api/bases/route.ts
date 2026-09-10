import { NextResponse } from "next/server";
import { importBase } from "@/lib/bases/import";
import { createClient } from "@/lib/supabase/server";
import type { Area } from "@/lib/supabase/database.types";

/**
 * Recibe una base ya parseada en el cliente (CSV o Excel, da igual: el
 * cliente la convierte a un array de objetos con los headers originales
 * como claves) y la procesa fila por fila.
 *
 * Viene como multipart/form-data (no JSON) porque además de las filas ya
 * parseadas mandamos el archivo original tal cual, para guardarlo íntegro
 * como respaldo descargable (ver `importBase`).
 *
 * Campos del form-data:
 *   area, name, source_label, file_name: strings
 *   rows: string (JSON.stringify de Record<string, unknown>[])
 *   file: el archivo original (opcional, pero se manda siempre desde el form)
 */
export async function POST(request: Request) {
  const form = await request.formData();

  const area = form.get("area") as Area;
  const name = form.get("name") as string;
  const source_label = form.get("source_label") as string;
  const file_name = (form.get("file_name") as string) || undefined;
  const rowsRaw = form.get("rows") as string | null;
  const file = form.get("file") as File | null;

  if (area !== "civil" && area !== "penal") {
    return NextResponse.json({ error: "Área inválida" }, { status: 400 });
  }
  if (!name || !source_label) {
    return NextResponse.json({ error: "Faltan nombre o fuente de la base" }, { status: 400 });
  }
  if (!rowsRaw) {
    return NextResponse.json({ error: "Faltan las filas a importar" }, { status: 400 });
  }

  let rows: Record<string, unknown>[];
  try {
    rows = JSON.parse(rowsRaw);
  } catch {
    return NextResponse.json({ error: "Las filas no vinieron en un formato válido" }, { status: 400 });
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "El archivo no tiene filas para importar" }, { status: 400 });
  }
  if (rows.length > 5000) {
    return NextResponse.json(
      { error: "Máximo 5000 filas por importación. Dividí el archivo en partes más chicas." },
      { status: 400 }
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const fileBuffer = file ? await file.arrayBuffer() : null;

    const summary = await importBase({
      area,
      name,
      sourceLabel: source_label,
      fileName: file_name ?? file?.name ?? null,
      rows,
      importedBy: user?.id ?? null,
      fileBuffer,
      fileMimeType: file?.type ?? null,
    });
    return NextResponse.json(summary);
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message ?? err) }, { status: 500 });
  }
}
