import { NextResponse } from "next/server";
import writeExcelFile from "write-excel-file/node";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/acceso/autorizacion";

const STATUS_LABEL: Record<string, string> = {
  creado: "Nuevo contacto",
  duplicado: "Ya existía",
  invalido: "Inválido (sin teléfono)",
};

/**
 * Genera un .xlsx descargable con todo lo que encontró una corrida de
 * captación de Google Maps — la misma información que se ve en la "Vista
 * de planilla" del panel, como archivo para guardar o compartir por fuera
 * del sistema. 13/11 (seguridad): se escribe con «write-excel-file»; se
 * dejó de usar «xlsx» (SheetJS), que tiene avisos sin arreglo en el registro.
 */
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
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

  const titulos = ["Fila", "Estado", "Nombre", "Teléfono", "Dirección", "Sitio web", "Rating", "Cantidad de reseñas", "Categorías", "Google Place ID"] as const;
  const celda = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : v === null || v === undefined ? "" : String(v));
  const datos = [titulos.map((t) => ({ value: t, fontWeight: "bold" as const })), ...sheetRows.map((r: Record<string, unknown>) => titulos.map((t) => celda(r[t])))];
  const buffer: Buffer = await writeExcelFile(datos as any, { sheet: "Negocios" }).toBuffer();

  const safeName = base.name.replace(/[^a-zA-Z0-9 _-]/g, "").trim() || "captacion";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${safeName}.xlsx"`,
    },
  });
}
