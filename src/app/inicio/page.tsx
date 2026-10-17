import { LogoutButton } from "@/components/acceso/logout-button";
import { TarjetaLuz } from "@/components/ui/tarjeta-luz";
import { SalaLampara } from "@/components/ui/lampara-dibujo";
import { MarcaPanel } from "@/components/ui/marca-panel";
import { IlusComputadora, IlusTelefono } from "@/components/ui/ilustraciones";
import { requirePageSession } from "@/lib/acceso/pagina";

export const metadata = { title: "Inicio" };

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
    <div data-tema="neutro" className="escena-oscura flex items-center justify-center px-4 py-12">
      <SalaLampara />

      <div className="escena-capa relative w-full max-w-3xl text-center">
        <MarcaPanel className="sello-grande mx-auto mb-5" />
        <h1 className="mb-2 font-serif text-2xl font-semibold text-white sm:text-3xl">
          ¿Cómo querés utilizar el panel?
        </h1>
        <p className="mb-8 text-sm text-slate-300">
          Panel central
        </p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TarjetaLuz href="/telefono" className="rounded-3xl p-8 text-left">
            <span className="ilus-acceso mb-4">
              <IlusTelefono className="h-24 w-24" id="il-acceso-tel" />
            </span>
            <h2 className="mb-1 font-serif text-xl font-semibold text-gold-100">Teléfono</h2>
            <p className="text-sm leading-relaxed text-slate-300">
              Iniciar campañas, clientes cerrados y estadísticas de cada perfil.
            </p>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-gold-300">
              Entrar <span className="flecha-desliza" aria-hidden="true">→</span>
            </p>
          </TarjetaLuz>

          <TarjetaLuz href="/perfiles" className="rounded-3xl p-8 text-left">
            <span className="ilus-acceso mb-4">
              <IlusComputadora className="h-24 w-24" id="il-acceso-pc" />
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
