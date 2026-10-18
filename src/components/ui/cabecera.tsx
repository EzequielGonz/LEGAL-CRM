/**
 * Cabecera de una pantalla (18/10): título, una línea de contexto y las
 * acciones principales a la derecha. Misma forma en todas las secciones.
 */
export function Cabecera({ titulo, bajada, children }: { titulo: string; bajada?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold text-slate-950">{titulo}</h1>
        {bajada ? <p className="mt-1 max-w-2xl text-sm text-slate-600">{bajada}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

/** Tarjeta base: blanca, borde fino, esquinas suaves. */
export function Tarjeta({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </section>
  );
}
