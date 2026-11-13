import { perfilActivo } from "@/lib/perfil-activo";
import { requirePageSession } from "@/lib/acceso/pagina";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { esSlugPerfil, marcaDe, type SlugPerfil } from "@/lib/marca";
import { accesosDe } from "@/lib/redes/accesos";
import { leerAccesos } from "@/lib/redes/accesos-servidor";
import { AccesosRedes } from "@/components/redes/accesos-redes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Accesos" };

/**
 * Accesos a las redes (12/11): Instagram, Facebook y WhatsApp de cada perfil a un
 * clic, cada uno en su ventana al lado del panel.
 */
export default async function Pagina({ searchParams }: { searchParams: { perfil?: string } }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const slug: SlugPerfil = perfilActivo(searchParams.perfil);
  const items = accesosDe(await leerAccesos(slug));
  return (
    <MarcoPerfil slug={slug}>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Accesos</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Las redes de {marcaDe(slug).nombre}, a un clic. Cada una se abre en su ventana al lado del panel y queda con la sesión iniciada: Instagram, Facebook y WhatsApp no permiten mostrarse
            dentro de otra página.
          </p>
        </div>
        <AccesosRedes perfil={slug} inicial={items} />
      </div>
    </MarcoPerfil>
  );
}
