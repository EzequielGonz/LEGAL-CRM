/**
 * Esqueleto de carga común (16/10). Lo muestran los `loading.tsx` de cada
 * panel mientras el servidor arma la página: el menú queda fijo y el
 * contenido aparece al instante con la forma de lo que viene, en vez de
 * dejar la pantalla anterior congelada.
 */
export function EsqueletoPagina({ tarjetas = 4, filas = 6 }: { tarjetas?: number; filas?: number }) {
  return (
    <div role="status" aria-live="polite" className="esqueleto-pagina">
      <span className="sr-only">Cargando…</span>
      <div aria-hidden="true">
        <div className="mb-2 h-7 w-56 rounded-lg skeleton-shimmer" />
        <div className="mb-7 h-4 w-80 max-w-full rounded skeleton-shimmer" />
        {tarjetas > 0 && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: tarjetas }, (_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-3 h-3.5 w-24 rounded skeleton-shimmer" />
                <div className="h-8 w-16 rounded-md skeleton-shimmer" />
              </div>
            ))}
          </div>
        )}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="h-11 border-b border-slate-100 bg-slate-50" />
          {Array.from({ length: filas }, (_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-slate-100 px-4 py-3.5 last:border-0">
              <div className="h-4 w-40 rounded skeleton-shimmer" />
              <div className="h-5 w-20 rounded-full skeleton-shimmer" />
              <div className="ml-auto h-4 w-16 rounded skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
