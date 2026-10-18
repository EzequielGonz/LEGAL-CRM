import Link from "next/link";
import { LogoutButton } from "@/components/acceso/logout-button";
import { type MarcaTarjeta } from "@/components/perfiles/perfil-selector";
import { SelectorPerfilesPC } from "@/components/perfiles/selector-pc";
import { SalaLampara } from "@/components/ui/lampara-dibujo";
import { MarcaPanel } from "@/components/ui/marca-panel";
import { loadPerfiles } from "@/lib/perfiles-stats";
import { requirePageSession } from "@/lib/acceso/pagina";
import { marcasResueltas } from "@/lib/marca-servidor";
import { SLUGS_PERFIL, type SlugPerfil } from "@/lib/marca";

export const metadata = { title: "Perfiles" };

export const dynamic = "force-dynamic";

/**
 * Elegir perfil en la computadora (reorganización 2, 18/10): como antes,
 * pantalla oscura con un perfil por marca, sin cifras; el lápiz de cada uno
 * edita nombre, nombre interno, logo y color. Lo pendiente de cada perfil se
 * ve en el modo teléfono y en el Inicio de cada panel.
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

  return (
    <div className="escena-oscura sala-perfil flex min-h-screen items-center justify-center px-4 py-14">
      <SalaLampara />
      <main id="perfiles" className="escena-capa relative w-full max-w-5xl">
        <div className="mb-12 text-center">
          <MarcaPanel className="sello-grande mx-auto mb-6" />
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">¿Con qué perfil trabajás?</h1>
          <p className="mt-2 text-sm text-slate-400">Elegí uno para entrar al panel.</p>
        </div>
        <SelectorPerfilesPC perfiles={perfiles} marcas={tarjetas} />
        <div className="mt-14 flex items-center justify-center gap-6 text-sm">
          <Link href="/inicio" className="font-medium text-slate-400 transition hover:text-white">
            Teléfono o computadora
          </Link>
          <LogoutButton className="!text-slate-400 hover:!text-white" />
        </div>
      </main>
    </div>
  );
}
