import { perfilActivo } from "@/lib/perfil-activo";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { PlantillasWasender } from "@/components/wasender/plantillas-wasender";
import { esSlugPerfil, marcaDe, type SlugPerfil } from "@/lib/marca";

export const dynamic = "force-dynamic";
export const metadata = { title: "Plantillas de Wasender" };

/** Plantillas propias de Wasender (10/11): sin aprobación de Meta, con variables y variantes. */
export default async function PlantillasWasenderPage(props: { searchParams: Promise<{ perfil?: string }> }) {
  const searchParams = await props.searchParams;
  const slug: SlugPerfil = await perfilActivo(searchParams.perfil);
  return (
    <MarcoPerfil slug={slug}>
      <PlantillasWasender slug={slug} marca={marcaDe(slug).nombre} />
    </MarcoPerfil>
  );
}
