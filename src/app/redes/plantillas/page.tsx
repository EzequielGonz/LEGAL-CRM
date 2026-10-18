import { requirePageSession } from "@/lib/acceso/pagina";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { Cabecera } from "@/components/ui/cabecera";
import { PlantillasArchivo } from "@/components/redes/plantillas-archivo";
import { TemplatesSection } from "@/components/plantillas/templates-section";
import { perfilDePagina } from "@/lib/redes/perfil-pagina";

export const dynamic = "force-dynamic";
export const metadata = { title: "Plantillas" };

/** Redes y contenido › Plantillas de WhatsApp (18/10): carga por archivo y estado en Meta. */
export default async function PlantillasPage({ searchParams }: { searchParams: { perfil?: string } }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const { slug } = perfilDePagina(searchParams.perfil);
  return (
    <MarcoPerfil slug={slug}>
      <div className="mx-auto max-w-5xl space-y-8">
        <Cabecera titulo="Plantillas de WhatsApp" bajada="Los mensajes aprobados por Meta que usan las campañas y los avisos. Subí un archivo y cada plantilla va sola a la línea de su perfil." />
        <PlantillasArchivo perfil={slug} />
        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-950">Estado en Meta y uso</h2>
          <TemplatesSection slug={slug} />
        </section>
      </div>
    </MarcoPerfil>
  );
}
