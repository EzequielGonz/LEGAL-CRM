import { requirePageSession } from "@/lib/acceso/pagina";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { Cabecera } from "@/components/ui/cabecera";
import { PublicidadForm } from "@/components/redes/publicidad-form";
import { perfilDePagina } from "@/lib/redes/perfil-pagina";

export const dynamic = "force-dynamic";
export const metadata = { title: "Publicidad" };

/** Redes y contenido › Publicidad (18/10): configuración lista y apagada. */
export default async function PublicidadPage({ searchParams }: { searchParams: { perfil?: string } }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const { slug } = perfilDePagina(searchParams.perfil);
  return (
    <MarcoPerfil slug={slug}>
      <div className="mx-auto max-w-3xl">
        <Cabecera titulo="Publicidad" bajada="Por ahora el alcance es orgánico. Esto queda preparado para cuando quieras invertir." />
        <PublicidadForm perfil={slug} />
      </div>
    </MarcoPerfil>
  );
}
