import { LogoutButton } from "@/components/acceso/logout-button";
import { PerfilSelector, type MarcaTarjeta } from "@/components/perfiles/perfil-selector";
import { MarcaPanel } from "@/components/ui/marca-panel";
import { loadPerfiles } from "@/lib/perfiles-stats";
import { requirePageSession } from "@/lib/acceso/pagina";
import { marcasResueltas } from "@/lib/marca-servidor";
import { SLUGS_PERFIL, type SlugPerfil } from "@/lib/marca";
import Link from "next/link";

export const metadata = { title: "Perfiles" };

export const dynamic = "force-dynamic";

/**
 * Pantalla de perfiles (renovada 18/10): una tarjeta por perfil con lo que
 * está pendiente, el lápiz para editar nombre, logo y color, y el menú de
 * tres puntos para campañas y publicaciones. Pantalla completa, sin el menú
 * del panel.
 */
export default async function PerfilesPage() {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const [perfiles, marcas] = await Promise.all([loadPerfiles(), marcasResueltas().catch(() => null)]);
  const tarjetas: Partial<Record<SlugPerfil, MarcaTarjeta>> = marcas
    ? Object.fromEntries(
        SLUGS_PERFIL.map((s) => [s, { nombre: marcas[s].nombre, logo: marcas[s].origenLogo === "configuracion" ? marcas[s].logoPanel : null, acento: marcas[s].colores?.panel ?? null }])
      )
    : {};
  const hoy = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());

  return (
    <div data-tema="neutro" className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <MarcaPanel className="h-9 w-9" />
            <span className="text-sm font-semibold text-slate-950">Panel central</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/inicio" className="font-medium text-slate-600 hover:text-slate-950">
              Teléfono o computadora
            </Link>
            <LogoutButton className="!text-slate-600 hover:!text-slate-950" />
          </div>
        </div>
      </header>
      <main id="contenido" className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <p className="text-sm font-medium capitalize text-slate-500" suppressHydrationWarning>
          {hoy}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">¿Con qué perfil trabajás?</h1>
        <p className="mt-2 text-sm text-slate-600">Lo que necesita tu atención aparece en cada tarjeta. Tocá una para entrar.</p>
        <div className="mt-8">
          <PerfilSelector perfiles={perfiles} marcas={tarjetas} />
        </div>
      </main>
    </div>
  );
}
