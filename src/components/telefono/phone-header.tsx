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
    <header className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 pb-5 pt-6 shadow-navy">
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
      {eyebrow && <p className="pr-28 text-xs uppercase tracking-wider text-gold-300">{eyebrow}</p>}
      <h1 className="pr-28 font-serif text-xl font-semibold text-white">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-300">{subtitle}</p>}
    </header>
  );
}
