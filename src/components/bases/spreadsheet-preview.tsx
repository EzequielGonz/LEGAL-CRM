/**
 * Tabla de solo lectura que muestra un array de filas (objetos planos, tal
 * como salen de parsear un CSV/Excel) como si fuera una planilla: une todas
 * las columnas que aparecen en cualquier fila, respetando el orden en que
 * aparecen por primera vez, así se ve igual que el archivo original aunque
 * algunas filas tengan columnas de más o de menos.
 */
export function SpreadsheetPreview({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) return null;

  const columns: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    }
  }

  function cell(value: unknown): string {
    if (value === null || value === undefined) return "";
    const s = String(value).trim();
    return s;
  }

  return (
    <div className="max-h-96 overflow-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-max text-xs">
        <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-left uppercase text-slate-500">
          <tr>
            <th className="whitespace-nowrap px-3 py-2">#</th>
            {columns.map((col) => (
              <th key={col} className="whitespace-nowrap px-3 py-2">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="whitespace-nowrap px-3 py-1.5 text-slate-400">{i + 1}</td>
              {columns.map((col) => (
                <td key={col} className="whitespace-nowrap px-3 py-1.5 text-slate-600">
                  {cell(row[col]) || "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
