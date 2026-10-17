import Link from "next/link";
import { LogoutButton } from "@/components/acceso/logout-button";

/** Encabezado del modo teléfono: título, regreso y cierre de sesión. */
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
    <header className="cabecera-telefono relative overflow-hidden rounded-b-[1.75rem] bg-slate-950 px-5 pb-6 pt-6">
      <div className="absolute right-4 top-4 flex items-center gap-3">
        {backHref ? (
          <Link href={backHref} className="text-xs text-slate-400 hover:text-gold-200">
            ← Volver
          </Link>
        ) : (
          <Link href="/inicio" className="text-xs text-slate-400 hover:text-gold-200">
            Inicio
          </Link>
        )}
        <LogoutButton className="text-xs" label="Salir" />
      </div>
      {eyebrow && <p className="mb-1 pr-28 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-300">{eyebrow}</p>}
      <h1 className="pr-28 font-serif text-[1.45rem] font-semibold leading-tight tracking-[-0.015em] text-white">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-300">{subtitle}</p>}
    </header>
  );
}
