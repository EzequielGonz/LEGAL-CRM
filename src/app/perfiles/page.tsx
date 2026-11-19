import { Suspense } from "react";
import { EfectosVidrio } from "@/components/ui/efectos-vidrio";
import { LogoutButton } from "@/components/acceso/logout-button";
import { type MarcaTarjeta } from "@/components/perfiles/perfil-selector";
import { SelectorPerfilesPC } from "@/components/perfiles/selector-pc";
import { ConocimientoBot } from "@/components/perfiles/conocimiento-bot";
import { AsistenteGeneral } from "@/components/asistente/asistente-general";
import { SalaLampara } from "@/components/ui/lampara-dibujo";
import { MarcaPanel } from "@/components/ui/marca-panel";
import { leerRubrosActivos, loadPerfiles, type RubroRow } from "@/lib/perfiles-stats";
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
  // 15/11: primero lo liviano (rubros y marcas, a la vez) para mostrar la pantalla enseguida;
  // las tarjetas, que son lo que tarda, llegan después en su propio bloque (Suspense).
  const [rubros, marcas] = await Promise.all([leerRubrosActivos(), marcasResueltas().catch(() => null)]);
  const tarjetas: Partial<Record<SlugPerfil, MarcaTarjeta>> = marcas
    ? Object.fromEntries(
        SLUGS_PERFIL.map((s) => [s, { nombre: marcas[s].nombre, logo: marcas[s].origenLogo === "configuracion" ? marcas[s].logoPanel : null, acento: marcas[s].colores?.panel ?? null }])
      )
    : {};
  const nombres = Object.fromEntries(rubros.map((p) => [p.slug, tarjetas[p.slug as SlugPerfil]?.nombre ?? p.name]));

  return (
    <div className="escena-oscura sala-perfil flex min-h-screen items-start justify-center px-4 py-12 sm:px-6">
      <SalaLampara />
      {/* 13/11: las tarjetas se inclinan con el cursor, como las cifras del panel. */}
      <EfectosVidrio />
      <main id="perfiles" className="escena-capa relative w-full max-w-6xl">
        {/* 15/11: las tarjetas se actualizan solas (cada 20 s y al volver a la pestaña) desde el selector;
            antes además se recargaba toda la página cada 30 s, lo que duplicaba las mismas lecturas. */}
        <div className="mb-10 text-center">
          <MarcaPanel className="sello-grande mx-auto mb-5" />
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">¿Con qué perfil trabajás?</h1>
          <p className="mt-2 text-sm text-slate-400">Lo pendiente de cada perfil, la semana y la última base. Elegí uno para entrar al panel.</p>
        </div>
        <Suspense fallback={<EsqueletoTarjetas cantidad={rubros.length} />}>
          <TarjetasPerfiles rubros={rubros} marcas={tarjetas} />
        </Suspense>
        {/* 15/11: asistente general (los cuatro perfiles, sin entrar a cada uno). */}
        <AsistenteGeneral />
        {/* 25/10: versiones del conocimiento del bot (v1/v2) y su comparación con resultados reales. */}
        <ConocimientoBot nombres={nombres} />
        <div className="mt-12 flex items-center justify-center gap-6 text-sm">
          <LogoutButton className="!text-slate-400 hover:!text-white" />
        </div>
      </main>
    </div>
  );
}

/** Tarjetas de cada perfil: lo pendiente y las cifras de la semana, todo pedido a la vez. */
async function TarjetasPerfiles({ rubros, marcas }: { rubros: RubroRow[]; marcas: Partial<Record<SlugPerfil, MarcaTarjeta>> }) {
  // 15/11: las cifras de la semana ya no esperan a la vista previa (antes, una después de la otra).
  const [perfiles, filas] = await Promise.all([
    loadPerfiles(rubros),
    Promise.all(rubros.map(async (p) => [p.id, await resumenCifras(p.id, AREAS_DE_PERFIL[p.slug] ?? [p.slug]).catch(() => null)] as const)),
  ]);
  const cifras: Record<string, ResumenCifras | null> = Object.fromEntries(filas);
  return <SelectorPerfilesPC perfiles={perfiles} marcas={marcas} cifras={cifras} />;
}

/** Forma de las tarjetas mientras llegan las cifras (misma grilla que el selector). */
function EsqueletoTarjetas({ cantidad }: { cantidad: number }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Cargando los perfiles…</span>
      <ul aria-hidden="true" className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: Math.max(cantidad, 1) }, (_, i) => (
          <li key={i} className="tarjeta-perfil relative flex min-h-[22rem] flex-col gap-4 overflow-hidden rounded-3xl p-5 pt-6">
            <span className="absolute inset-x-0 top-0 h-1 bg-gold-500" />
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl skeleton-shimmer" />
              <div className="h-5 w-40 rounded skeleton-shimmer" />
            </div>
            <div className="h-16 rounded-2xl skeleton-shimmer" />
            <div className="h-24 rounded-2xl skeleton-shimmer" />
            <div className="mt-auto h-10 rounded-xl skeleton-shimmer" />
          </li>
        ))}
      </ul>
    </div>
  );
}
