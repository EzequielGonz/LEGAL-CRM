/**
 * Sección de Configuración con ancla estable (rediseño 17/10, bloques 1 y 3).
 * Cada sección guarda por su cuenta (su botón dice qué guarda y su
 * confirmación se anuncia); el distintivo indica el alcance.
 * Los enlaces de Salud y de otras pantallas apuntan a `#<id>`; la sección
 * es enfocable para que el lector de pantalla y el teclado lleguen ahí.
 */
export function SeccionAjustes({
  id,
  titulo,
  descripcion,
  alcance,
  nivel = "avanzado",
  palabras = "",
  children,
}: {
  id: string;
  titulo: string;
  descripcion?: React.ReactNode;
  /** «Este perfil» o «Todos los perfiles». */
  alcance?: "perfil" | "general";
  /** Compatibilidad: todas las secciones se ven al abrir su grupo (18/10). */
  nivel?: "simple" | "avanzado";
  /** Palabras extra para el buscador de Configuración. */
  palabras?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      tabIndex={-1}
      data-buscar={`${titulo} ${palabras}`.toLowerCase()}
      data-nivel-ajuste={nivel}
      className="seccion-ajustes scroll-mt-24 rounded-xl border border-slate-100 bg-slate-50/50 p-4 outline-none sm:p-5"
    >
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
