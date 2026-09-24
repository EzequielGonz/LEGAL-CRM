import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Punto de entrada al panel completo de un rubro, desde "Ingresar al
 * panel →" en /perfiles. Jurídico ya tiene su sección de Casos armada en
 * /casos-cerrados, así que ese slug manda directo ahí (es lo que pidió
 * Vita: entrar desde la vista previa tiene que llevar a la sección de
 * casos/clientes, no al dashboard general). Los demás rubros (Agencia
 * 0KM, Coberturas Médicas, Marketing) todavía no tienen su motor de leads
 * ni su bot conectados (eso es el resto de la Fase 2 en adelante) — por
 * eso por ahora muestran un aviso en vez de un panel vacío o roto.
 */
export default async function PanelRubroPage({ params }: { params: { slug: string } }) {
  if (params.slug === "juridico") {
    redirect("/casos-cerrados");
  }

  const supabase = createClient();
  const { data: rubro } = await supabase
    .from("rubros")
    .select("name, emoji, description")
    .eq("slug", params.slug)
    .single();

  if (!rubro) notFound();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <span className="mb-4 text-5xl">{rubro.emoji}</span>
      <h1 className="mb-2 font-serif text-2xl font-semibold text-slate-900">{rubro.name}</h1>
      <p className="max-w-md text-sm text-slate-500">
        Este rubro todavía no tiene su motor de leads y su bot de WhatsApp conectados. Se está
        construyendo — cuando esté listo, acá vas a ver el mismo panel completo que ya tenés
        hoy para Estudio Jurídico.
      </p>
    </div>
  );
}
