import { createClient } from "@/lib/supabase/server";
import { profileCatalog } from "@/lib/plantillas";
import { TemplatesManager } from "@/components/plantillas/templates-manager";

/**
 * Sección "Plantillas de WhatsApp" de la Configuración de cada perfil
 * (pregunta 22): lectura del catálogo desde Meta por línea, estado real,
 * variables, uso y asignación por línea y propósito.
 */
export async function TemplatesSection({ slug }: { slug: string }) {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("rubros")
    .select("id, name, brand_name, agent_presentation_name")
    .eq("slug", slug)
    .maybeSingle();
  if (!profile) return null;
  const catalog = await profileCatalog(profile.id);
  // Al navegador va solo lo que se muestra: ni el JSON completo de Meta ni el
  // identificador de la cuenta (de la configuración privada se ven solo los últimos dígitos).
  const templates = catalog.templates.map((t) => {
    const view: Record<string, unknown> = { ...t };
    delete view.components;
    delete view.waba_id;
    return view;
  });
  return (
    <TemplatesManager
      profile={{
        id: profile.id,
        name: profile.name,
        hasBrand: !!profile.brand_name?.trim(),
        hasPresentation: !!profile.agent_presentation_name?.trim(),
      }}
      lines={catalog.lines as any}
      templates={templates as any}
    />
  );
}
