// Rendimiento (16/10): xlsx y papaparse pesan ~190 kB y solo hacen falta al
// elegir un archivo; se cargan en ese momento en vez de con la página.
const cargarXlsx = async (): Promise<typeof import("xlsx")> => {
  const m: any = await import("xlsx");
  return m.read ? m : m.default;
};
const cargarPapa = async () => {
  const m: any = await import("papaparse");
  return (m.parse ? m : m.default) as typeof import("papaparse");
};

/**
 * Convierte un CSV o Excel (.xlsx/.xls) subido por el usuario en un array de
 * objetos planos, usando la primera fila como headers. Corre en el browser
 * (se usa desde el formulario de importación) — el archivo nunca pasa por
 * un paso intermedio que lo modifique: estos mismos objetos son los que se
 * guardan tal cual como `raw_data` de cada fila.
 */
export interface ParsedSpreadsheet {
  rows: Record<string, unknown>[];
  /** hoja que se importa (Excel); null para CSV */
  sheetName: string | null;
  /** todas las hojas del archivo (Excel) */
  sheetNames: string[];
}

/**
 * Igual que parseSpreadsheetFile, pero informa qué hoja se importa cuando el
 * Excel trae varias (se importa la primera; elegir otra queda pendiente).
 */
export async function parseSpreadsheetFileDetailed(file: File): Promise<ParsedSpreadsheet> {
  const isCsv = file.name.toLowerCase().endsWith(".csv");
  if (isCsv) {
    return { rows: await parseSpreadsheetFile(file), sheetName: null, sheetNames: [] };
  }
  const [buffer, XLSX] = await Promise.all([file.arrayBuffer(), cargarXlsx()]);
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  return {
    rows: XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, unknown>[],
    sheetName: firstSheetName ?? null,
    sheetNames: [...workbook.SheetNames],
  };
}

export async function parseSpreadsheetFile(file: File): Promise<Record<string, unknown>[]> {
  const isCsv = file.name.toLowerCase().endsWith(".csv");

  if (isCsv) {
    const Papa = await cargarPapa();
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
  const [buffer, XLSX] = await Promise.all([file.arrayBuffer(), cargarXlsx()]);
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, unknown>[];
}
