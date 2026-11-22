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
  // 22/11: en el celular se partía en dos líneas sin lugar y desbordaba la página (/resultados a 409 px).
  // Ahora se acomoda en dos renglones, con botones de 44 px.
  const boton = "tactil inline-flex min-h-[44px] items-center rounded-full px-3 font-medium";
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 text-xs text-slate-600">
      <span className="d-mono">
        {total === 0 ? `0 ${unit}` : `${from.toLocaleString("es-AR")}–${to.toLocaleString("es-AR")} de ${total.toLocaleString("es-AR")} ${unit}`}
      </span>
      <nav aria-label="Páginas" className="flex flex-wrap items-center gap-1">
        {page > 1 ? (
          <Link prefetch={false} href={href(page - 1)} className={`${boton} text-slate-800 hover:bg-slate-100`}>
            ← Anterior
          </Link>
        ) : (
          <span aria-disabled="true" className={`${boton} text-slate-500 opacity-60`}>← Anterior</span>
        )}
        <span className="px-1">
          Página {page} de {pages}
        </span>
        {page < pages ? (
          <Link prefetch={false} href={href(page + 1)} className={`${boton} text-slate-800 hover:bg-slate-100`}>
            Siguiente →
          </Link>
        ) : (
          <span aria-disabled="true" className={`${boton} text-slate-500 opacity-60`}>Siguiente →</span>
        )}
      </nav>
    </div>
  );
}

export function pageFromParam(value: string | undefined): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}
