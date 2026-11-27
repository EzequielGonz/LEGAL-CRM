import { perfilActivo } from "@/lib/perfil-activo";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { BandejaClaude, type TareaVista } from "@/components/bandeja/bandeja-claude";
import { marcaDe, type SlugPerfil } from "@/lib/marca";
import { RUBRO_IDS } from "@/lib/rubros";
import { createAdminClient } from "@/lib/supabase/admin";
import { filaATarea, perfilDeRubroId, type TareaBandeja } from "@/lib/bandeja-claude";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bandeja para Claude" };

/**
 * Bandeja para Claude (19/10; 27/11 rubros separados). Se dejan tareas
 * complejas (contenido, landings, mejoras) y Claude las toma con la Oficina
 * («Arrancar ahora», si el disparo está conectado) o cuando se escribe
 * «oficina» en un chat de Claude del proyecto.
 *
 * Dentro de un perfil se ven SOLO las tareas de ese rubro: lo conjunto de
 * varios rubros y lo de «Todo el panel» vive en la Oficina (/oficina).
 */
export default async function BandejaPage(props: { searchParams: Promise<{ perfil?: string }> }) {
  const searchParams = await props.searchParams;
  const slug: SlugPerfil = await perfilActivo(searchParams.perfil);
  let tareas: TareaBandeja[] = [];
  let errorLectura = false;
  try {
    const { data, error } = await createAdminClient()
      .from("bandeja_claude" as any)
      .select("id, rubro_id, pedido, enlaces, estado, motivo_espera, resultado, resultado_enlaces, motivo_descarte, created_at, updated_at, tomada_at, cerrada_at")
      .eq("rubro_id", RUBRO_IDS[slug])
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    tareas = (data ?? []).map(filaATarea).filter((t): t is TareaBandeja => t !== null);
  } catch (err) {
    console.error("[bandeja] No se pudo leer la bandeja:", err);
    errorLectura = true;
  }
  const vista: TareaVista[] = tareas.map((t) => ({ ...t, perfil: perfilDeRubroId(t.rubro_id) }));

  return (
    <MarcoPerfil slug={slug}>
      <BandejaClaude slug={slug} nombrePerfil={marcaDe(slug).nombre} iniciales={vista} errorLectura={errorLectura} />
    </MarcoPerfil>
  );
}
