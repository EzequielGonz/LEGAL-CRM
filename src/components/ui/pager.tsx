import Link from "next/link";

/**
 * Paginación del lado del servidor: muestra el total y el rango visible,
 * y conserva los demás filtros de la URL (bloque 1.5).
 */
export function Pager({
  basePath,
  params,
  page,
  pageSize,
  total,
  unit = "registros",
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  pageSize: number;
  total: number;
  unit?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set("pagina", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <div className="flex items-center justify-between px-4 py-3 text-xs text-slate-500">
      <span>
        {total === 0 ? `0 ${unit}` : `${from.toLocaleString("es-AR")}–${to.toLocaleString("es-AR")} de ${total.toLocaleString("es-AR")} ${unit}`}
      </span>
      <span className="flex items-center gap-3">
        {page > 1 ? (
          <Link href={href(page - 1)} className="font-medium text-slate-700 hover:underline">
            ← Anterior
          </Link>
        ) : (
          <span className="text-slate-300">← Anterior</span>
        )}
        <span>
          Página {page} de {pages}
        </span>
        {page < pages ? (
          <Link href={href(page + 1)} className="font-medium text-slate-700 hover:underline">
            Siguiente →
          </Link>
        ) : (
          <span className="text-slate-300">Siguiente →</span>
        )}
      </span>
    </div>
  );
}

export function pageFromParam(value: string | undefined): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}
