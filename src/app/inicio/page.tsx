import { LogoutButton } from "@/components/acceso/logout-button";
import { TarjetaLuz } from "@/components/ui/tarjeta-luz";
import { FondoVolumen } from "@/components/ui/fondo-volumen";
import { requirePageSession } from "@/lib/acceso/pagina";

export const dynamic = "force-dynamic";

/**
 * Pantalla de entrada al sistema (Fase 5 — accesos separados): apenas se
 * loguea, en vez de caer directo al panel de escritorio, se muestra esta
 * pantalla intermedia para elegir cómo se va a usar el sistema en este
 * dispositivo:
 * - "Teléfono" → /telefono: los perfiles con tres accesos (Iniciar
 *   campaña, Clientes cerrados y Estadísticas), vista reducida e instalable.
 * - "Computadora" → /perfiles, el selector de perfiles estilo Netflix
 *   (uno por rubro) con vista previa de estadísticas antes de entrar al
 *   panel completo de cada uno.
 *
 * El panel ya no pide iniciar sesión, y "/" siempre redirige acá primero
 * — así esta pantalla vuelve a aparecer cada vez que se entra "por el
 * link", sin importar qué se haya elegido antes.
 *
 * A propósito NO usa el layout de (dashboard) (no tiene Sidebar ni nada
 * alrededor) — es una pantalla completa, standalone, con el mismo estilo
 * navy + dorado de siempre.
 */
export default async function InicioPage() {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  return (
    <div className="escena-oscura escena-3d flex items-center justify-center px-4 py-12">
      <FondoVolumen />
      {/* Resplandores ambientales (decorativos) */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 animate-float rounded-full bg-gold-500/10 blur-3xl" />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 animate-float rounded-full bg-gold-500/10 blur-3xl"
        style={{ animationDelay: "1.2s" }}
      />

      <div className="escena-capa relative w-full max-w-3xl text-center">
        <span className="icono-dorado mx-auto mb-5 !h-14 !w-14 !rounded-full animate-scale-in font-serif text-xl font-bold">
          E
        </span>
        <h1 className="animate-fade-in-up mb-2 font-serif text-2xl font-semibold text-white sm:text-3xl">
          ¿Cómo querés utilizar el panel?
        </h1>
        <p className="animate-fade-in-up mb-8 text-sm text-slate-400" style={{ animationDelay: "60ms" }}>
          Panel central
        </p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TarjetaLuz href="/telefono" className="animate-scale-in rounded-3xl p-8 text-left" style={{ animationDelay: "120ms" }}>
            <span className="icono-dorado mb-5">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
                <path d="M11 18.5h2" />
              </svg>
            </span>
            <h2 className="mb-1 font-serif text-xl font-semibold text-gold-100">Teléfono</h2>
            <p className="text-sm leading-relaxed text-slate-300">
              Iniciar campañas, clientes cerrados y estadísticas de cada perfil.
            </p>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-gold-300">
              Entrar <span className="flecha-desliza" aria-hidden="true">→</span>
            </p>
          </TarjetaLuz>

          <TarjetaLuz href="/perfiles" className="animate-scale-in rounded-3xl p-8 text-left" style={{ animationDelay: "200ms" }}>
            <span className="icono-dorado mb-5">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4.5" width="18" height="12" rx="2" />
                <path d="M8 20h8M12 16.5V20" />
              </svg>
            </span>
            <h2 className="mb-1 font-serif text-xl font-semibold text-gold-100">Computadora</h2>
            <p className="text-sm leading-relaxed text-slate-300">
              Acceso al sistema de gestión y automatizaciones.
            </p>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-gold-300">
              Entrar <span className="flecha-desliza" aria-hidden="true">→</span>
            </p>
          </TarjetaLuz>
        </div>

        <div className="mt-8 text-center">
          <LogoutButton className="text-xs" />
        </div>
      </div>
    </div>
  );
}
