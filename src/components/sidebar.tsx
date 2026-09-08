"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/", label: "Estadísticas" },
  { href: "/inbox", label: "Inbox" },
  { href: "/prospectos", label: "Prospectos" },
  { href: "/bases", label: "Bases" },
  { href: "/agenda", label: "Agenda" },
  { href: "/campanas", label: "Campañas" },
  { href: "/agentes", label: "Agentes IA" },
  { href: "/configuracion", label: "Configuración" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-60 flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-navy">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 text-sm font-serif font-bold text-slate-950 shadow-gold">
          E
        </span>
        <div>
          <p className="font-serif text-sm font-semibold tracking-wide text-gold-100">
            Estudio Vita
          </p>
          <p className="text-[11px] uppercase tracking-wider text-slate-400">
            Panel central
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {NAV.map((item, i) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
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

      <div className="border-t border-white/10 p-3">
        <button
          onClick={handleLogout}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-400 transition-colors duration-200 hover:bg-white/5 hover:text-gold-200"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
