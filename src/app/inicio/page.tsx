import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * Pantalla de entrada al sistema (Fase 5 — accesos separados): apenas se
 * loguea, en vez de caer directo al panel de escritorio, se muestra esta
 * pantalla intermedia para elegir cómo se va a usar el sistema en este
 * dispositivo:
 * - "Teléfono" → /derivar, la vista angosta de "Casos listos para
 *   derivar" (sin menú, sin poder navegar a ningún otro lado).
 * - "Computadora" → / (el panel completo de siempre, sin cambios).
 *
 * A propósito NO usa el layout de (dashboard) (no tiene Sidebar ni nada
 * alrededor) — es una pantalla completa, standalone, con el mismo estilo
 * navy + dorado que la pantalla de login.
 */
export default function InicioPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-12">
      {/* Glow decorativo dorado, igual que en login — puramente ambiental */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 animate-float rounded-full bg-gold-500/10 blur-3xl" />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 animate-float rounded-full bg-gold-500/10 blur-3xl"
        style={{ animationDelay: "1.2s" }}
      />

      <div className="relative w-full max-w-3xl text-center">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 font-serif text-xl font-bold text-slate-950 shadow-gold">
          E
        </span>
        <h1 className="mb-2 font-serif text-2xl font-semibold text-white sm:text-3xl">
          ¿Cómo querés utilizar el panel?
        </h1>
        <p className="mb-10 text-sm text-slate-400">Estudio Jurídico Vita — Panel central</p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Link
            href="/derivar"
            className="group animate-scale-in rounded-2xl border border-white/10 bg-white/5 p-8 text-left backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:border-gold-400/50 hover:bg-white/10 active:scale-[0.98]"
          >
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 text-2xl shadow-gold">
              📱
            </span>
            <h2 className="mb-1 font-serif text-lg font-semibold text-gold-100">Teléfono</h2>
            <p className="text-sm leading-relaxed text-slate-300">
              Acceso rápido a clientes listos para derivar.
            </p>
          </Link>

          <Link
            href="/"
            className="group animate-scale-in rounded-2xl border border-white/10 bg-white/5 p-8 text-left backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:border-gold-400/50 hover:bg-white/10 active:scale-[0.98]"
            style={{ animationDelay: "80ms" }}
          >
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 text-2xl shadow-gold">
              💻
            </span>
            <h2 className="mb-1 font-serif text-lg font-semibold text-gold-100">Computadora</h2>
            <p className="text-sm leading-relaxed text-slate-300">
              Acceso al sistema de gestión y automatizaciones.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
