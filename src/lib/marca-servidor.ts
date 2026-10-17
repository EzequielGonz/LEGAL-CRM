import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { RUBRO_IDS } from "@/lib/rubros";
import { SLUGS_PERFIL, resolverMarca, type FilaMarca, type MarcaResuelta, type SlugPerfil } from "@/lib/marca";

/**
 * Lectura única de la marca de los cuatro perfiles (rediseño 17/10, bloque
 * 2). Menú, selector de perfiles y Teléfono leen de acá; Configuración y
 * Contenido guardan en `brand_briefs` y llaman a `revalidateTag("marca-perfil")`,
 * así el cambio se ve enseguida en todas las superficies. Caché de 5 minutos
 * como respaldo. Solo datos públicos de marca.
 */
export const marcasResueltas = unstable_cache(
  async (): Promise<Record<SlugPerfil, MarcaResuelta>> => {
    const filas = new Map<string, FilaMarca>();
    try {
      // `*` y no una lista de columnas: si la columna `logo_panel` todavía no
      // existe en la base, se sigue leyendo el resto sin error.
      const { data } = await createAdminClient().from("brand_briefs" as any).select("*");
      for (const f of (data ?? []) as any[]) filas.set(f.rubro_id, f);
    } catch (err) {
      console.error("[marca] No se pudo leer brand_briefs:", err);
    }
    return Object.fromEntries(SLUGS_PERFIL.map((s) => [s, resolverMarca(s, filas.get(RUBRO_IDS[s]))])) as Record<SlugPerfil, MarcaResuelta>;
  },
  ["marcas-resueltas"],
  { revalidate: 300, tags: ["marca-perfil"] }
);
