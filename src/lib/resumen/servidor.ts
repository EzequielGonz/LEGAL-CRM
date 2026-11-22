import { createAdminClient } from "@/lib/supabase/admin";
import { leerRubrosActivos, loadPerfiles, type PerfilStats } from "@/lib/perfiles-stats";
import { AREAS_DE_PERFIL } from "@/lib/cartera-servidor";
import { propuestasPendientes } from "@/lib/jarvis/servidor";
import { leerSalud } from "@/lib/salud";
import { itemsDelPerfil } from "@/lib/salud/por-perfil";
import { startOfArgentinaDay } from "@/lib/horario";
import { marcaDe, SLUGS_PERFIL, type SlugPerfil } from "@/lib/marca";
import { armarCifras, type PerfilResumen } from "@/lib/resumen/filas";

async function citasDeHoy(areas: string[], ahora: Date): Promise<number | null> {
  try {
    const desde = startOfArgentinaDay(ahora);
    const hasta = new Date(desde.getTime() + 86_400_000);
    const { count, error } = await createAdminClient()
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .in("area", areas)
      .gte("starts_at", desde.toISOString())
      .lt("starts_at", hasta.toISOString())
      .neq("status", "cancelada");
    return error ? null : count ?? 0;
  } catch {
    return null;
  }
}

/** Lee lo pendiente de los cuatro perfiles con las funciones que ya existen; cada dato que falla queda en null. */
export async function leerResumenTodo(ahora = new Date()): Promise<PerfilResumen[]> {
  const rubros = await leerRubrosActivos().catch(() => []);
  const [perfiles, salud] = await Promise.all([loadPerfiles(rubros).catch(() => null as PerfilStats[] | null), leerSalud(ahora).catch(() => null)]);
  const porSlug = new Map((perfiles ?? []).map((p) => [p.slug, p]));
  const slugs = SLUGS_PERFIL.filter((s) => rubros.length === 0 || rubros.some((r) => r.slug === s));
  return Promise.all(
    slugs.map(async (slug: SlugPerfil) => {
      const p = porSlug.get(slug);
      const [citas, prop] = await Promise.all([citasDeHoy(AREAS_DE_PERFIL[slug] ?? [slug], ahora), propuestasPendientes(slug, ahora).then((r) => r.visibles.length).catch(() => null)]);
      const items = salud ? itemsDelPerfil(salud, slug).filter((i) => i.estado === "rojo" || i.estado === "amarillo").length : null;
      return {
        slug,
        nombre: marcaDe(slug).nombre,
        cifras: armarCifras(slug, { esperan: p ? p.accion.humano : null, sinDerivar: p ? p.accion.sin_derivar : null, citasHoy: citas, propuestas: prop, alertas: items }),
      };
    })
  );
}

