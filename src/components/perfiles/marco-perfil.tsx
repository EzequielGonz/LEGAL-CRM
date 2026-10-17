import { Suspense } from "react";
import { marcasResueltas } from "@/lib/marca-servidor";
import { MenuPerfil } from "@/components/menu-perfil";
import { BarraSalud } from "@/components/salud/barra-salud";
import { EncabezadoPanel } from "@/components/perfiles/encabezado-panel";
import type { SlugPerfil } from "@/lib/marca";
import { EnfocarAncla } from "@/components/ui/enfocar-ancla";
import { cookies } from "next/headers";
import { NivelProvider } from "@/components/nivel/nivel";
import { COOKIE_NIVEL, nivelDe } from "@/lib/nivel";

/**
 * Marco común de los paneles (16/10): aplica la paleta del perfil
 * (`data-tema`) y el menú unificado con la marca resuelta desde la fuente
 * única (`marcasResueltas`: lo guardado en Configuración y, si no hay, el
 * nombre y el logo original del perfil).
 * Arriba de cada pantalla, la barra de salud (lo que frena la operación):
 * se transmite aparte para no demorar el contenido de la página.
 */
export async function MarcoPerfil({ slug, children, sinSalud = false }: { slug: SlugPerfil; children: React.ReactNode; sinSalud?: boolean }) {
  let marca: { nombre: string | null; logo: string | null } = { nombre: null, logo: null };
  try {
    const m = (await marcasResueltas())[slug];
    marca = { nombre: m.nombre, logo: m.logoPanel };
  } catch (err) {
    console.error("[marco] No se pudo leer la marca del perfil:", err);
  }
  const nivel = nivelDe(cookies().get(COOKIE_NIVEL)?.value);
  return (
    <NivelProvider inicial={nivel}>
    <div data-tema={slug} className="min-h-screen lg:flex">
      <MenuPerfil slug={slug} nombre={marca.nombre} logo={marca.logo} />
      <main id="contenido" tabIndex={-1} className="min-w-0 flex-1 bg-slate-50 lg:h-screen lg:overflow-y-auto">
        <EncabezadoPanel slug={slug} nombre={marca.nombre} />
        <div className="lienzo-contenido">
          {!sinSalud && (
            <Suspense fallback={<div className="mb-4 h-7 w-36 rounded-full skeleton-shimmer" aria-hidden="true" />}>
              <BarraSalud slug={slug} />
            </Suspense>
          )}
          {children}
        </div>
      </main>
      <EnfocarAncla />
    </div>
    </NivelProvider>
  );
}
