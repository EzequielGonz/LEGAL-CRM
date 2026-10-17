/**
 * Grupo de Configuración (rediseño 17/10, bloque 3): ocho grupos fijos en
 * los cuatro perfiles. Muestra un resumen del estado del grupo y sus
 * secciones. Un grupo sin ajustes frecuentes se ve solo en Avanzado.
 */
export function GrupoAjustes({
  id,
  titulo,
  resumen,
  soloAvanzado = false,
  children,
}: {
  id: string;
  titulo: string;
  resumen?: React.ReactNode;
  soloAvanzado?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div id={`grupo-${id}`} tabIndex={-1} data-grupo-ajustes className={`grupo-ajustes scroll-mt-24 space-y-4 outline-none ${soloAvanzado ? "solo-avanzado" : ""}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-slate-200 pb-2">
        <h2 className="text-lg font-semibold text-slate-900">{titulo}</h2>
        {resumen && <p className="text-sm text-slate-700">{resumen}</p>}
      </div>
      {children}
    </div>
  );
}
