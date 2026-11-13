import { perfilActivo } from "@/lib/perfil-activo";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { LineasWasender } from "@/components/wasender/lineas-wasender";
import { esSlugPerfil, marcaDe, type SlugPerfil } from "@/lib/marca";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wasender" };

/**
 * Wasender (10/11): líneas de WhatsApp conectadas por QR, aparte de Meta.
 * Las líneas nacen apagadas y en modo prueba; Meta sigue igual.
 */
export default function WasenderPage({ searchParams }: { searchParams: { perfil?: string } }) {
  const slug: SlugPerfil = perfilActivo(searchParams.perfil);
  return (
    <MarcoPerfil slug={slug}>
      <LineasWasender slug={slug} marca={marcaDe(slug).nombre} />
    </MarcoPerfil>
  );
}
