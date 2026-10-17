import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { MenuPerfil } from "@/components/menu-perfil";
import { BarraSalud } from "@/components/salud/barra-salud";
import { EncabezadoPanel } from "@/components/perfiles/encabezado-panel";
import type { SlugPerfil } from "@/lib/marca";

/**
 * Nombre y logo del perfil. Cambian muy de vez en cuando, así que se guardan
 * 5 minutos en la caché del servidor en vez de consultarse (dos idas y
 * vueltas a la base) en cada navegación. Solo datos públicos de marca.
 */
const marcaDelPerfil = unstable_cache(
  async (slug: string): Promise<{ nombre: string | null; logo: string | null }> => {
    const supabase = createAdminClient();
    const { data: rubro } = await supabase.from("rubros").select("id, name").eq("slug", slug).maybeSingle();
    let logo: string | null = null;
    if (rubro?.id) {
      const { data: brief } = await supabase
        .from("brand_briefs" as any)
        .select("logo_ref")
        .eq("rubro_id", rubro.id)
        .maybeSingle();
      const ref = (brief as { logo_ref?: string | null } | null)?.logo_ref ?? null;
      logo = ref && /^https:\/\//.test(ref) ? ref : null;
    }
    return { nombre: rubro?.name ?? null, logo };
  },
  ["marco-perfil-marca"],
  { revalidate: 300, tags: ["marca-perfil"] }
);

/**
 * Marco común de los paneles (16/10): aplica la paleta del perfil
 * (`data-tema`), el menú unificado con el nombre guardado en la base y el
 * logo de `brand_briefs.logo_ref` si está cargado (si no, el de la landing).
 * Arriba de cada pantalla, la barra de salud (lo que frena la operación):
 * se transmite aparte para no demorar el contenido de la página.
 */
export async function MarcoPerfil({ slug, children, sinSalud = false }: { slug: SlugPerfil; children: React.ReactNode; sinSalud?: boolean }) {
  let marca: { nombre: string | null; logo: string | null } = { nombre: null, logo: null };
  try {
    marca = await marcaDelPerfil(slug);
  } catch (err) {
    console.error("[marco] No se pudo leer la marca del perfil:", err);
  }
  return (
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
    </div>
  );
}
