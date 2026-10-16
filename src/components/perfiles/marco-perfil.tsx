import { createClient } from "@/lib/supabase/server";
import { MenuPerfil } from "@/components/menu-perfil";
import { BarraSalud } from "@/components/salud/barra-salud";
import type { SlugPerfil } from "@/lib/marca";

/**
 * Marco común de los paneles (16/10): aplica la paleta del perfil
 * (`data-tema`), el menú unificado con el nombre guardado en la base y el
 * logo de `brand_briefs.logo_ref` si está cargado (si no, el de la landing).
 * Arriba de cada pantalla, la barra de salud (lo que frena la operación).
 */
export async function MarcoPerfil({ slug, children, sinSalud = false }: { slug: SlugPerfil; children: React.ReactNode; sinSalud?: boolean }) {
  const supabase = createClient();
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
  return (
    <div data-tema={slug} className="min-h-screen lg:flex">
      <MenuPerfil slug={slug} nombre={rubro?.name ?? null} logo={logo} />
      <main id="contenido" tabIndex={-1} className="min-w-0 flex-1 bg-slate-50 p-4 sm:p-6 lg:h-screen lg:overflow-y-auto lg:p-8">
        {!sinSalud && <BarraSalud slug={slug} />}
        {children}
      </main>
    </div>
  );
}
