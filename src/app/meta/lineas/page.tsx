import { perfilActivo } from "@/lib/perfil-activo";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { ProfileSettingsSection } from "@/components/perfiles/profile-settings-section";
import { marcaDe, type SlugPerfil } from "@/lib/marca";

export const dynamic = "force-dynamic";
export const metadata = { title: "Líneas de Meta" };

/**
 * 17/11: líneas de WhatsApp oficial (Meta) del perfil, en su propia sección y
 * separadas de las de Wasender. Antes vivían dentro de Ajustes. Son las mismas
 * líneas y se editan igual: esta pantalla no cambia cómo se envía.
 */
export default async function LineasMetaPage(props: { searchParams: Promise<{ perfil?: string }> }) {
  const searchParams = await props.searchParams;
  const slug: SlugPerfil = await perfilActivo(searchParams.perfil);
  return (
    <MarcoPerfil slug={slug}>
      <div className="mx-auto max-w-5xl space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Líneas de WhatsApp oficial (Meta)</h1>
          <p className="mt-1 text-sm text-slate-600">
            Las líneas de {marcaDe(slug).nombre} conectadas por la API oficial de Meta. Las líneas por QR están aparte, en «WhatsApp por QR (Wasender)».
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <ProfileSettingsSection slug={slug} soloLineas />
        </div>
      </div>
    </MarcoPerfil>
  );
}
