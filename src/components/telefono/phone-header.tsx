import Link from "next/link";
import { LogoutButton } from "@/components/acceso/logout-button";
import { SelectorNivel } from "@/components/nivel/nivel";

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
          <Link href={backHref} className="tactil inline-flex items-center px-1 text-sm text-slate-200 hover:text-white">
            ← Volver
          </Link>
        ) : (
          <Link href="/inicio" className="tactil inline-flex items-center px-1 text-sm text-slate-200 hover:text-white">
            Inicio
          </Link>
        )}
        <LogoutButton className="text-sm" label="Salir" />
      </div>
      {eyebrow && <p className="mb-1 pr-28 text-xs font-semibold text-gold-200">{eyebrow}</p>}
      <h1 className="pr-28 text-2xl font-semibold leading-tight tracking-[-0.015em] text-white">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-200">{subtitle}</p>}
      {/* Mismo selector que en la computadora, en el mismo lugar de todas las pantallas del teléfono. */}
      <div className="mt-3 flex justify-end">
        <SelectorNivel oscuro />
      </div>
    </header>
  );
}
