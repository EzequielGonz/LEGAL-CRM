import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { BandejaClaude, type TareaVista } from "@/components/bandeja/bandeja-claude";
import { esSlugPerfil, marcaDe, SLUGS_PERFIL, type SlugPerfil } from "@/lib/marca";
import { createAdminClient } from "@/lib/supabase/admin";
import { filaATarea, perfilDeRubroId, type TareaBandeja } from "@/lib/bandeja-claude";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bandeja para Claude" };

/**
 * Bandeja para Claude (19/10). La responsable deja tareas complejas
 * (contenido, landings, mejoras) y Claude las toma desde Cowork cuando ella
 * abre un chat del proyecto y dice «ok». El asistente del panel («Pedile
 * algo») sigue en Gemini; Claude no corre dentro del panel.
 */
export default async function BandejaPage({ searchParams }: { searchParams: { perfil?: string } }) {
  const slug: SlugPerfil = esSlugPerfil(searchParams.perfil) ? searchParams.perfil : "juridico";
  let tareas: TareaBandeja[] = [];
  let errorLectura = false;
  try {
    const { data, error } = await createAdminClient()
      .from("bandeja_claude" as any)
      .select("id, rubro_id, pedido, enlaces, estado, motivo_espera, resultado, resultado_enlaces, motivo_descarte, created_at, updated_at, tomada_at, cerrada_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    tareas = (data ?? []).map(filaATarea).filter((t): t is TareaBandeja => t !== null);
  } catch (err) {
    console.error("[bandeja] No se pudo leer la bandeja:", err);
    errorLectura = true;
  }
  const perfiles = SLUGS_PERFIL.map((s) => ({ slug: s, nombre: marcaDe(s).nombre }));
  const vista: TareaVista[] = tareas.map((t) => ({ ...t, perfil: perfilDeRubroId(t.rubro_id) }));

  return (
    <MarcoPerfil slug={slug}>
      <BandejaClaude slug={slug} perfiles={perfiles} iniciales={vista} errorLectura={errorLectura} />
    </MarcoPerfil>
  );
}
