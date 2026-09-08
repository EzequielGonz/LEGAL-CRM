import { NextResponse } from "next/server";
import { importBase } from "@/lib/bases/import";
import { createClient } from "@/lib/supabase/server";
import type { Area } from "@/lib/supabase/database.types";

/**
 * Recibe una base ya parseada en el cliente (CSV o Excel, da igual: el
 * cliente la convierte a un array de objetos con los headers originales
 * como claves) y la procesa fila por fila.
 * Body: { area, name, source_label, file_name, rows: Record<string, unknown>[] }
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { area, name, source_label, file_name, rows } = body as {
    area: Area;
    name: string;
    source_label: string;
    file_name?: string;
    rows: Record<string, unknown>[];
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
      rows,
      importedBy: user?.id ?? null,
    });
    return NextResponse.json(summary);
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message ?? err) }, { status: 500 });
  }
}
