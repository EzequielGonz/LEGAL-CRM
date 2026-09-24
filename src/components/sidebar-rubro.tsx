"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_ITEMS = [
  { path: "casos-cerrados", label: "Clientes cerrados" },
  { path: "campanas", label: "Campañas" },
  { path: "agentes", label: "Agentes IA" },
  { path: "configuracion", label: "Configuración" },
];

/**
 * Sidebar del panel dedicado de un rubro (no Jurídico) — mismo diseño
 * navy/gold que el sidebar principal de Estudio Vita, pero con la
 * navegación acotada a lo propio de ese rubro (nunca linkea a Inbox,
 * Prospectos, Bases ni Agenda de Jurídico) y su propia marca (emoji +
 * nombre) en vez del logo del estudio. `basePath` es la raíz de las URLs
 * de este panel, por ejemplo "/panel/agencia_0km".
 */
export function SidebarRubro({
  basePath,
  emoji,
  name,
  extraNavItems = [],
}: {
  basePath: string;
  emoji: string;
  name: string;
  /** Items de navegación propios de este rubro, además de los 4 comunes a
   * todos (Clientes cerrados, Campañas, Agentes IA, Configuración) — por
   * ejemplo "Captación" en Marketing. */
  extraNavItems?: { path: string; label: string }[];
}) {
  const pathname = usePathname();
  const items = [...NAV_ITEMS, ...extraNavItems];

  return (
    <aside className="flex h-screen w-60 flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-navy">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 text-lg shadow-gold">
          {emoji}
        </span>
        <div>
          <p className="font-serif text-sm font-semibold tracking-wide text-gold-100">{name}</p>
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Panel del rubro</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {items.map((item, i) => {
          const href = `${basePath}/${item.path}`;
          const active = pathname.startsWith(href);
          return (
            <Link
              key={item.path}
              href={href}
              style={{ animationDelay: `${i * 40}ms` }}
              className={clsx(
                "group relative block animate-fade-in-up rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-white/5 text-gold-200"
                  : "text-slate-300 hover:translate-x-0.5 hover:bg-white/5 hover:text-gold-100"
              )}
            >
              <span
                className={clsx(
                  "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-gold-300 to-gold-600 transition-all duration-200",
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                )}
              />
              <span className="pl-2">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <Link
          href="/perfiles"
          className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-gold-100"
        >
          ← Elegir otro perfil
        </Link>
      </div>
    </aside>
  );
}
