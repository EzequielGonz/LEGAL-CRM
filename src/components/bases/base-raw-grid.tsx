export interface BaseRawRow {
  row_number: number;
  status: "creado" | "duplicado" | "invalido";
  raw_data: Record<string, unknown>;
}

const STATUS_LABEL: Record<string, string> = {
  creado: "Nuevo contacto",
  duplicado: "Ya existía",
  invalido: "Inválido",
};
const STATUS_COLOR: Record<string, string> = {
  creado: "text-green-600",
  duplicado: "text-slate-500",
  invalido: "text-red-600",
};

/**
 * Igual que SpreadsheetPreview pero para filas ya importadas: lee `raw_data`
 * (guardado tal cual al momento de importar, en `imported_base_rows`), así
 * que esta vista sigue disponible siempre — aunque se cierre la página, se
 * cierre sesión, o pase el tiempo — porque no depende de nada que haya
 * quedado en el browser.
 */
export function BaseRawGrid({ rows }: { rows: BaseRawRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
        No hay filas para mostrar.
      </p>
    );
  }

  const columns: string[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    for (const key of Object.keys(r.raw_data ?? {})) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    }
  }

  function cell(value: unknown): string {
    if (value === null || value === undefined) return "";
    return String(value).trim();
  }

  return (
    <div className="max-h-[32rem] overflow-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-max text-sm">
        <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="whitespace-nowrap px-4 py-3">Fila</th>
            <th className="whitespace-nowrap px-4 py-3">Estado</th>
            {columns.map((col) => (
              <th key={col} className="whitespace-nowrap px-4 py-3">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.row_number}>
              <td className="whitespace-nowrap px-4 py-2 text-slate-400">{r.row_number}</td>
              <td className={`whitespace-nowrap px-4 py-2 font-medium ${STATUS_COLOR[r.status]}`}>
                {STATUS_LABEL[r.status]}
              </td>
              {columns.map((col) => (
                <td key={col} className="whitespace-nowrap px-4 py-2 text-slate-600">
                  {cell(r.raw_data?.[col]) || "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
