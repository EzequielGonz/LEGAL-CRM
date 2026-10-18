import { requirePageSession } from "@/lib/acceso/pagina";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { Cabecera } from "@/components/ui/cabecera";
import { PerfilesWhatsApp } from "@/components/redes/perfil-whatsapp";
import { perfilDePagina } from "@/lib/redes/perfil-pagina";

export const dynamic = "force-dynamic";
export const metadata = { title: "Perfil de WhatsApp" };

/** Redes y contenido › Perfil de WhatsApp: foto, info y datos de cada línea (18/10). */
export default async function PerfilWhatsAppPage({ searchParams }: { searchParams: { perfil?: string } }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const { slug } = perfilDePagina(searchParams.perfil);
  return (
    <MarcoPerfil slug={slug}>
      <div className="mx-auto max-w-3xl">
        <Cabecera titulo="Perfil de WhatsApp" bajada="Lo que ve la gente cuando abre el chat: foto, info, descripción y datos de contacto. Se guarda directo en WhatsApp." />
        <PerfilesWhatsApp perfil={slug} />
        <p className="mt-6 text-xs text-slate-500">
          La biografía y la foto de Instagram no se pueden cambiar desde afuera de Instagram (Meta no lo permite): se editan en la app.
        </p>
      </div>
    </MarcoPerfil>
  );
}
