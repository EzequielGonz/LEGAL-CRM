import { Icono } from "@/components/ui/icono-seccion";

const ICONO: Record<string, string> = {
  marca: "contenido",
  canales: "inbox",
  agenda: "agenda",
  automatizaciones: "seguimiento",
  agentes: "agentes",
  notificaciones: "alerta",
  acceso: "revision",
  sistema: "configuracion",
  generales: "configuracion",
};

/**
 * Grupo de Configuración (reorganización 2, 18/10): una tarjeta plegada con
 * el título y el estado del grupo; al tocarla se despliegan sus secciones.
 * Los enlaces con ancla (#seccion o #grupo-…) la abren solos.
 */
export function GrupoAjustes({
  id,
  titulo,
  resumen,
  abierto = false,
  children,
}: {
  id: string;
  titulo: string;
  resumen?: React.ReactNode;
  /** Compatibilidad: ya no se ocultan grupos; todos son tarjetas plegadas. */
  soloAvanzado?: boolean;
  abierto?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details id={`grupo-${id}`} open={abierto} data-grupo-ajustes className="grupo-ajustes group scroll-mt-24 rounded-2xl border border-slate-200 bg-white shadow-sm outline-none open:shadow-md">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl px-4 py-3.5 hover:bg-slate-50/70">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-gold-700">
          <Icono nombre={ICONO[id] ?? "configuracion"} className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-950">{titulo}</span>
          {resumen ? <span className="block truncate text-xs text-slate-500">{resumen}</span> : null}
        </span>
        <span aria-hidden="true" className="text-slate-400 transition group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="space-y-4 border-t border-slate-100 p-4 sm:p-5">{children}</div>
    </details>
  );
}
