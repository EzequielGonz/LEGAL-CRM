import { NextResponse } from "next/server";
import { importBase } from "@/lib/bases/import";
import { createClient } from "@/lib/supabase/server";
import type { Area } from "@/lib/supabase/database.types";

// Margen de seguridad: con el importador en lotes (ver src/lib/bases/import.ts)
// esto no debería hacer falta ni de cerca, pero por las dudas le damos más
// tiempo del default a esta función en particular.
export const maxDuration = 60;

/**
 * Recibe una base ya parseada en el cliente (CSV o Excel, da igual: el
 * cliente la convierte a un array de objetos con los headers originales
 * como claves) y la procesa fila por fila.
 *
 * Viene como JSON (ya no como multipart/form-data): el archivo original
 * pesado se sube DIRECTO a Storage desde el navegador antes de llamar acá
 * (ver /api/bases/upload-url), así que esta request solo lleva datos
 * livianos — nombre, filas ya interpretadas, y la ruta donde quedó el
 * archivo. Esto evita el límite de ~4.5MB por request que tienen las
 * funciones serverless de Vercel (antes el archivo viajaba en el mismo
 * POST, y un archivo grande hacía que Vercel rechazara la request con un
 * error que no era JSON — "Unexpected token 'R'..." en el panel).
 *
 * Body JSON:
 *   area, name, source_label, file_name: strings
 *   rows: Record<string, unknown>[]
 *   storage_path: string | null (ruta en el bucket "bases-originales", si se subió archivo)
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { area, name, source_label, file_name, rows, storage_path } = body as {
    area: Area;
    name: string;
    source_label: string;
    file_name?: string | null;
    rows?: unknown;
    storage_path?: string | null;
  };

  if (area !== "civil" && area !== "penal") {
    return NextResponse.json({ error: "Área inválida" }, { status: 400 });
  }
  if (!name || !source_label) {
    return NextResponse.json({ error: "Faltan nombre o fuente de la base" }, { status: 400 });
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
    const summary = await importBase({
      area,
      name,
      sourceLabel: source_label,
      fileName: file_name ?? null,
      rows: rows as Record<string, unknown>[],
      importedBy: user?.id ?? null,
      storagePath: storage_path ?? null,
    });
    return NextResponse.json(summary);
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message ?? err) }, { status: 500 });
  }
}
