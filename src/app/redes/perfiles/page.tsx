import { requirePageSession } from "@/lib/acceso/pagina";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { Cabecera } from "@/components/ui/cabecera";
import { PerfilesRedes } from "@/components/redes/perfiles-redes";
import { PerfilesWhatsApp } from "@/components/redes/perfil-whatsapp";
import { perfilDePagina } from "@/lib/redes/perfil-pagina";
import { leerConexion } from "@/lib/redes/conexion";
import { marcaDe } from "@/lib/marca";
import { marcasResueltas } from "@/lib/marca-servidor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Perfiles de redes" };

/** Redes y contenido › Perfiles (reorganización 2, 18/10): Facebook, Instagram y WhatsApp de la marca. */
export default async function PerfilesRedesPage({ searchParams }: { searchParams: { perfil?: string } }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const { slug, rubroId } = perfilDePagina(searchParams.perfil);
  const [conexion, marcas] = await Promise.all([leerConexion(rubroId).catch(() => null), marcasResueltas().catch(() => null)]);
  const nombre = marcas?.[slug]?.nombre ?? marcaDe(slug).nombre;
  const bio = [nombre, marcaDe(slug).bajada, "Escribinos por WhatsApp desde el enlace."].filter(Boolean).join("\n");
  return (
    <MarcoPerfil slug={slug}>
      <div className="mx-auto max-w-6xl space-y-10">
        <Cabecera titulo="Perfiles de redes" bajada="Lo que ve la gente en Facebook, Instagram y WhatsApp. Facebook y WhatsApp se editan desde acá; Instagram, en la app." />
        <PerfilesRedes perfil={slug} enlaceInstagram={conexion?.enlaces.instagram ?? null} bioSugerida={bio} />
        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-950">WhatsApp</h2>
          <PerfilesWhatsApp perfil={slug} />
        </section>
      </div>
    </MarcoPerfil>
  );
}
