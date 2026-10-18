import Link from "next/link";
import { LogoutButton } from "@/components/acceso/logout-button";
import { type MarcaTarjeta } from "@/components/perfiles/perfil-selector";
import { SelectorPerfilesPC } from "@/components/perfiles/selector-pc";
import { SalaLampara } from "@/components/ui/lampara-dibujo";
import { MarcaPanel } from "@/components/ui/marca-panel";
import { loadPerfiles } from "@/lib/perfiles-stats";
import { AREAS_DE_PERFIL, resumenCifras, type ResumenCifras } from "@/lib/cartera-servidor";
import { requirePageSession } from "@/lib/acceso/pagina";
import { marcasResueltas } from "@/lib/marca-servidor";
import { SLUGS_PERFIL, type SlugPerfil } from "@/lib/marca";

export const metadata = { title: "Perfiles" };

export const dynamic = "force-dynamic";

/**
 * Elegir perfil en la computadora (18/10): pantalla oscura con una tarjeta
 * completa por marca (pendientes, semana, última base, captados y accesos),
 * más completa que la del teléfono. Lápiz y tres puntos en cada una.
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
  const filas = await Promise.all(
    perfiles.map(async (p) => [p.id, await resumenCifras(p.id, AREAS_DE_PERFIL[p.slug] ?? [p.slug]).catch(() => null)] as const)
  );
  const cifras: Record<string, ResumenCifras | null> = Object.fromEntries(filas);

  return (
    <div className="escena-oscura sala-perfil flex min-h-screen items-start justify-center px-4 py-12 sm:px-6">
      <SalaLampara />
      <main id="perfiles" className="escena-capa relative w-full max-w-6xl">
        <div className="mb-10 text-center">
          <MarcaPanel className="sello-grande mx-auto mb-5" />
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">¿Con qué perfil trabajás?</h1>
          <p className="mt-2 text-sm text-slate-400">Lo pendiente de cada perfil, la semana y la última base. Elegí uno para entrar al panel.</p>
        </div>
        <SelectorPerfilesPC perfiles={perfiles} marcas={tarjetas} cifras={cifras} />
        <div className="mt-12 flex items-center justify-center gap-6 text-sm">
          <Link href="/inicio" className="font-medium text-slate-400 transition hover:text-white">
            Teléfono o computadora
          </Link>
          <LogoutButton className="!text-slate-400 hover:!text-white" />
        </div>
      </main>
    </div>
  );
}
