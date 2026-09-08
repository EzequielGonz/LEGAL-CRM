import Papa from "papaparse";
import * as XLSX from "xlsx";

/**
 * Convierte un CSV o Excel (.xlsx/.xls) subido por el usuario en un array de
 * objetos planos, usando la primera fila como headers. Corre en el browser
 * (se usa desde el formulario de importación) — el archivo nunca pasa por
 * un paso intermedio que lo modifique: estos mismos objetos son los que se
 * guardan tal cual como `raw_data` de cada fila.
 */
export async function parseSpreadsheetFile(file: File): Promise<Record<string, unknown>[]> {
  const isCsv = file.name.toLowerCase().endsWith(".csv");

  if (isCsv) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data as Record<string, unknown>[]),
        error: (err: Error) => reject(err),
      });
    });
  }

  // Excel (.xlsx / .xls)
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, unknown>[];
}
