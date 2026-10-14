import { NextResponse } from "next/server";
import { importBase, RepeatedImportError } from "@/lib/bases/import";
import type { Area } from "@/lib/supabase/database.types";
import { requireSession } from "@/lib/acceso/autorizacion";

// Margen de seguridad: con el importador en lotes (ver src/lib/bases/import.ts)
// esto no debería hacer falta ni de cerca, pero por las dudas le damos más
// tiempo del default a esta función en particular.
export const maxDuration = 60;

const AREAS: Area[] = ["civil", "penal", "agencia_0km", "coberturas_medicas", "marketing"];

/**
 * Recibe una base ya parseada en el cliente (CSV o Excel, da igual: el
 * cliente la convierte a un array de objetos con los headers originales
 * como claves) y la procesa fila por fila. Es el único camino de
 * importación (PC, teléfono y la carga desde una campaña usan este mismo
 * flujo). Importar guarda la base y sus contactos; nunca envía mensajes ni
 * agrega a nadie a una campaña.
 *
 * Viene como JSON (ya no como multipart/form-data): el archivo original
 * pesado se sube DIRECTO a Storage desde el navegador antes de llamar acá
 * (ver /api/bases/upload-url), así que esta request solo lleva datos
 * livianos — nombre, filas ya interpretadas, y la ruta donde quedó el
 * archivo. Esto evita el límite de ~4.5MB por request que tienen las
 * funciones serverless de Vercel.
 *
 * Body JSON:
 *   area, name, source_label, file_name: strings
 *   rows: Record<string, unknown>[]
 *   storage_path: string | null (ruta en el bucket "bases-originales", si se subió archivo)
 *   mapping: { phone?, name?, dni? } columnas elegidas a mano (opcional)
 *   allow_repeat: true para confirmar que se importa otra vez un archivo ya cargado
 *
 * Si el mismo contenido ya se importó (y la base no está archivada) responde
 * 409 con la base anterior, para que se pueda revisar antes de repetir.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { area, name, source_label, file_name, rows, storage_path, mapping, allow_repeat } = body as {
    area: Area;
    name: string;
    source_label: string;
    file_name?: string | null;
    rows?: unknown;
    storage_path?: string | null;
    mapping?: { phone?: unknown; name?: unknown; dni?: unknown } | null;
    allow_repeat?: boolean;
  };

  if (!AREAS.includes(area)) {
    return NextResponse.json({ error: "Área inválida" }, { status: 400 });
  }
  if (!name?.trim() || !source_label?.trim()) {
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

  const col = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);

  try {
    const summary = await importBase({
      area,
      name: name.trim(),
      sourceLabel: source_label.trim(),
      fileName: file_name ?? null,
      rows: rows as Record<string, unknown>[],
      importedBy: null,
      storagePath: storage_path ?? null,
      mapping: mapping ? { phone: col(mapping.phone), name: col(mapping.name), dni: col(mapping.dni) } : undefined,
      allowRepeat: allow_repeat === true,
    });
    return NextResponse.json(summary);
  } catch (err: any) {
    if (err instanceof RepeatedImportError) {
      return NextResponse.json(
        { error: err.message, code: "repetido", previous: err.previous },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: String(err.message ?? err) }, { status: 500 });
  }
}
