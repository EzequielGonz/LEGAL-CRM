import { createClient } from "@/lib/supabase/server";
import { SidebarRubro } from "@/components/sidebar-rubro";

/**
 * Sidebar del panel de un perfil con su nombre y emoji guardados en la base
 * (renombrar el perfil desde Configuración cambia lo que se ve acá; el
 * identificador y los vínculos no cambian).
 */
export async function ProfileSidebar({
  slug,
  extraNavItems,
}: {
  slug: string;
  extraNavItems?: { path: string; label: string }[];
}) {
  const supabase = createClient();
  const { data } = await supabase.from("rubros").select("name, emoji").eq("slug", slug).maybeSingle();
  return (
    <SidebarRubro
      basePath={`/panel/${slug}`}
      emoji={data?.emoji ?? "•"}
      name={data?.name ?? slug}
      extraNavItems={extraNavItems}
    />
  );
}
