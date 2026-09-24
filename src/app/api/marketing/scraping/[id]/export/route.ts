import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createAdminClient } from "@/lib/supabase/admin";

const STATUS_LABEL: Record<string, string> = {
  creado: "Nuevo contacto",
  duplicado: "Ya existía",
  invalido: "Inválido (sin teléfono)",
};

/**
 * Genera un .xlsx descargable con todo lo que encontró una corrida de
 * captación de Google Maps — la misma información que se ve en la "Vista
 * de planilla" del panel, como archivo para guardar o compartir por fuera
 * del sistema. Usa la misma librería (`xlsx` / SheetJS) que ya usa el
 * importador de bases para leer Excel, solo que acá se usa para escribir.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createAdminClient();

  const { data: base } = await supabase
    .from("imported_bases")
    .select("id, name, area")
    .eq("id", params.id)
    .eq("area", "marketing")
    .maybeSingle();

  if (!base) {
    return NextResponse.json({ error: "No se encontró esa búsqueda" }, { status: 404 });
  }

  const { data: rows } = await supabase
    .from("imported_base_rows")
    .select("row_number, status, raw_data")
    .eq("base_id", params.id)
    .order("row_number");

  const sheetRows = (rows ?? []).map((r: any) => ({
    Fila: r.row_number,
    Estado: STATUS_LABEL[r.status] ?? r.status,
    Nombre: r.raw_data?.nombre ?? "",
    Teléfono: r.raw_data?.telefono ?? "",
    Dirección: r.raw_data?.direccion ?? "",
    "Sitio web": r.raw_data?.sitio_web ?? "",
    Rating: r.raw_data?.rating ?? "",
    "Cantidad de reseñas": r.raw_data?.cantidad_resenas ?? "",
    Categorías: r.raw_data?.categorias ?? "",
    "Google Place ID": r.raw_data?.google_place_id ?? "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Negocios");
  const buffer: Buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  const safeName = base.name.replace(/[^a-zA-Z0-9 _-]/g, "").trim() || "captacion";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${safeName}.xlsx"`,
    },
  });
}
