// Rendimiento (16/10): el lector de Excel y papaparse solo hacen falta al
// elegir un archivo; se cargan en ese momento en vez de con la página.
// 13/11 (seguridad): se dejó de usar «xlsx» (SheetJS), que tiene avisos sin
// arreglo en el registro. Excel se lee con «read-excel-file», que solo abre
// .xlsx: un .xls viejo hay que guardarlo como .xlsx o como CSV.
const cargarLector = async () => {
  const m: any = await import("read-excel-file/browser");
  return (m.default ?? m) as typeof import("read-excel-file/browser").default;
};

export const AVISO_XLS_VIEJO = "Ese archivo es un Excel viejo (.xls). Abrilo y guardalo como «Libro de Excel (.xlsx)» o como CSV, y volvé a subirlo.";

function celda(v: unknown): unknown {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return "";
    const iso = v.toISOString();
    return iso.endsWith("T00:00:00.000Z") ? iso.slice(0, 10) : iso;
  }
  return v;
}

/**
 * Filas de una hoja (la primera es la de títulos) → objetos, igual que antes:
 * las celdas vacías quedan como "", una columna sin título se llama
 * «__EMPTY», los títulos repetidos se numeran y las filas vacías se saltean.
 * Pura: se prueba sola.
 */
export function filasAObjetos(datos: readonly (readonly unknown[])[]): Record<string, unknown>[] {
  if (!datos.length) return [];
  const usados = new Map<string, number>();
  let vacias = 0;
  const ancho = datos.reduce((m, f) => Math.max(m, f.length), 0);
  const titulos: string[] = [];
  for (let i = 0; i < ancho; i++) {
    const crudo = celda(datos[0][i]);
    let t = String(crudo).trim();
    if (!t) t = vacias++ === 0 ? "__EMPTY" : `__EMPTY_${vacias - 1}`;
    const n = usados.get(t) ?? 0;
    usados.set(t, n + 1);
    titulos.push(n === 0 ? t : `${t}_${n}`);
  }
  const out: Record<string, unknown>[] = [];
  for (const fila of datos.slice(1)) {
    if (!fila.some((v) => v !== null && v !== undefined && String(v).trim() !== "")) continue;
    const o: Record<string, unknown> = {};
    titulos.forEach((t, i) => (o[t] = celda(fila[i])));
    out.push(o);
  }
  return out;
}

async function leerExcel(file: File): Promise<{ hojas: { nombre: string; filas: Record<string, unknown>[] }[] }> {
  if (/\.xls$/i.test(file.name)) throw new Error(AVISO_XLS_VIEJO);
  const [buffer, leer] = await Promise.all([file.arrayBuffer(), cargarLector()]);
  const hojas = await leer(buffer);
  return { hojas: hojas.map((h) => ({ nombre: h.sheet, filas: filasAObjetos(h.data as unknown[][]) })) };
}

const cargarPapa = async () => {
  const m: any = await import("papaparse");
  return (m.parse ? m : m.default) as typeof import("papaparse");
};

/**
 * Convierte un CSV o Excel (.xlsx) subido por el usuario en un array de
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
  const { hojas } = await leerExcel(file);
  return {
    rows: hojas[0]?.filas ?? [],
    sheetName: hojas[0]?.nombre ?? null,
    sheetNames: hojas.map((h) => h.nombre),
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

  // Excel (.xlsx)
  return (await leerExcel(file)).hojas[0]?.filas ?? [];
}
