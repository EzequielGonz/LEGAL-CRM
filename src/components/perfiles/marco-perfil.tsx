import { Suspense } from "react";
import { marcasResueltas } from "@/lib/marca-servidor";
import { MenuPerfil } from "@/components/menu-perfil";
import { BarraSalud } from "@/components/salud/barra-salud";
import { EncabezadoPanel, PestanasSeccion } from "@/components/perfiles/encabezado-panel";
import type { SlugPerfil } from "@/lib/marca";
import { variablesAcento } from "@/lib/acento";
import { EnfocarAncla } from "@/components/ui/enfocar-ancla";
import { MasOpciones, NivelProvider } from "@/components/nivel/nivel";
import { AsistentePanel } from "@/components/asistente/asistente-panel";

/**
 * Marco común de los paneles (renovado 18/10): paleta del perfil
 * (`data-tema`, y el acento elegido en el lápiz si hay uno), menú de seis
 * secciones, pestañas de la sección actual, «Más opciones» al pie y el
 * asistente IA. Arriba de cada pantalla, la barra de salud (solo cuando algo
 * frena la operación), transmitida aparte para no demorar el contenido.
 */
export async function MarcoPerfil({ slug, children, sinSalud = false }: { slug: SlugPerfil; children: React.ReactNode; sinSalud?: boolean }) {
  let marca: { nombre: string | null; logo: string | null; acento: string | null } = { nombre: null, logo: null, acento: null };
  try {
    const m = (await marcasResueltas())[slug];
    marca = { nombre: m.nombre, logo: m.logoPanel, acento: m.colores?.panel ?? null };
  } catch (err) {
    console.error("[marco] No se pudo leer la marca del perfil:", err);
  }
  const estilo = (variablesAcento(marca.acento) ?? undefined) as React.CSSProperties | undefined;
  return (
    <NivelProvider>
      <div data-tema={slug} style={estilo} className="min-h-screen lg:flex">
        <Suspense fallback={<div className="hidden w-[16rem] shrink-0 border-r border-slate-200 bg-white lg:block" aria-hidden="true" />}>
          <MenuPerfil slug={slug} nombre={marca.nombre} logo={marca.logo} />
        </Suspense>
        <main id="contenido" tabIndex={-1} className="min-w-0 flex-1 bg-slate-50 lg:h-screen lg:overflow-y-auto">
          <Suspense fallback={<div className="encabezado-panel" aria-hidden="true" />}>
            <EncabezadoPanel slug={slug} nombre={marca.nombre} />
          </Suspense>
          <div className="lienzo-contenido">
            {!sinSalud && (
              <Suspense fallback={null}>
                <BarraSalud slug={slug} />
              </Suspense>
            )}
            <Suspense fallback={null}>
              <PestanasSeccion slug={slug} />
            </Suspense>
            {children}
            <MasOpciones />
          </div>
        </main>
        <EnfocarAncla />
        <AsistentePanel slug={slug} />
      </div>
    </NivelProvider>
  );
}
