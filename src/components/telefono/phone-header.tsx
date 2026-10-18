import Link from "next/link";
import { LogoutButton } from "@/components/acceso/logout-button";
import { MarcaPanel } from "@/components/ui/marca-panel";

/**
 * Encabezado del modo teléfono (renovado 18/10): barra fija clara con el
 * regreso y la salida, y debajo el título grande de la pantalla.
 */
export function PhoneHeader({
  eyebrow,
  title,
  subtitle,
  backHref,
}: {
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  backHref?: string | null;
}) {
  return (
    <>
      <div className="barra-telefono sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-2.5">
        {backHref ? (
          <Link href={backHref} className="tactil inline-flex items-center gap-1.5 rounded-full px-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            <span aria-hidden="true">←</span> Volver
          </Link>
        ) : (
          <Link href="/inicio" className="flex items-center gap-2 rounded-full pr-2" aria-label="Elegir teléfono o computadora">
            <MarcaPanel className="h-8 w-8" />
            <span className="text-sm font-semibold text-slate-900">Panel central</span>
          </Link>
        )}
        <LogoutButton className="rounded-full px-3 py-1.5 text-sm font-medium !text-slate-600 hover:bg-slate-100 hover:!text-slate-950" label="Salir" />
      </div>
      <header className="cabecera-telefono px-5 pb-1 pt-5">
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-gold-700">{eyebrow}</p>}
        <h1 className="text-[1.7rem] font-semibold leading-tight tracking-[-0.02em] text-slate-950">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </header>
    </>
  );
}
