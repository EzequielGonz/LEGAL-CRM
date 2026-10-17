/**
 * Sección de Configuración con ancla estable (rediseño 17/10, bloque 1).
 * Los enlaces de Salud y de otras pantallas apuntan a `#<id>`; la sección
 * es enfocable para que el lector de pantalla y el teclado lleguen ahí.
 */
export function SeccionAjustes({
  id,
  titulo,
  descripcion,
  alcance,
  children,
}: {
  id: string;
  titulo: string;
  descripcion?: React.ReactNode;
  /** «Este perfil» o «Todos los perfiles». */
  alcance?: "perfil" | "general";
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} tabIndex={-1} className="seccion-ajustes scroll-mt-24 rounded-xl border border-slate-200 bg-white p-5 outline-none">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`${id}-titulo`} className="text-base font-semibold text-slate-900">
          {titulo}
        </h2>
        {alcance && (
          <span className="rounded-full border border-slate-300 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            {alcance === "perfil" ? "Este perfil" : "Todos los perfiles"}
          </span>
        )}
      </div>
      {descripcion && <p className="mb-3 text-sm text-slate-600">{descripcion}</p>}
      {children}
    </section>
  );
}
