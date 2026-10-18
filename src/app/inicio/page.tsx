import { LogoutButton } from "@/components/acceso/logout-button";
import Link from "next/link";
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
    <div data-tema="neutro" className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <MarcaPanel className="sello-grande mx-auto mb-5" />
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">¿Cómo querés usar el panel?</h1>
          <p className="mt-2 text-sm text-slate-600">Podés cambiarlo cuando quieras.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { href: "/telefono", titulo: "Teléfono", texto: "Campañas, clientes cerrados y estadísticas de cada perfil, en una vista simple.", Ilus: IlusTelefono, id: "il-acceso-tel" },
            { href: "/perfiles", titulo: "Computadora", texto: "El panel completo: conversaciones, contactos, redes y configuración.", Ilus: IlusComputadora, id: "il-acceso-pc" },
          ].map(({ href, titulo, texto, Ilus, id }) => (
            <Link key={href} href={href} className="group rounded-2xl border border-slate-200 bg-white p-7 text-left shadow-sm transition-shadow hover:shadow-md">
              <span className="mb-4 block w-max rounded-2xl bg-slate-100 p-3">
                <Ilus className="h-16 w-16" id={id} />
              </span>
              <h2 className="text-lg font-semibold text-slate-950">{titulo}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{texto}</p>
              <p className="mt-5 text-sm font-semibold text-slate-900">
                Entrar <span aria-hidden="true">→</span>
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <LogoutButton className="!text-slate-600 hover:!text-slate-950" />
        </div>
      </div>
    </div>
  );
}
