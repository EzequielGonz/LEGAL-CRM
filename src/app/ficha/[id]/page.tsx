import { temaDe } from "@/lib/marca";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FichaSection } from "@/components/ficha/ficha-section";
import { requirePageSession } from "@/lib/acceso/pagina";
import { EnlaceDetalle, EnlaceVolver } from "@/components/ui/enlaces-navegacion";
import { inicioDePerfil, volverSeguro } from "@/lib/navegacion";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";

export const dynamic = "force-dynamic";

/**
 * Ficha completa de un contacto, apta para teléfono y para los paneles de
 * cada perfil (bloque 1.7). Las acciones son las mismas que en Prospectos.
 */
export default async function FichaPage({ params, searchParams }: { params: { id: string }; searchParams: { volver?: string } }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const supabase = createClient();
  const { data: contact } = await supabase
    .from("contacts")
    .select("id, full_name, phone, email, dni_cuil, source, rubros(name, emoji, slug), conversations(id)")
    .eq("id", params.id)
    .maybeSingle();
  if (!contact) notFound();
  const volver = volverSeguro(searchParams.volver);
  const conversations = ((contact as any).conversations ?? []) as { id: string }[];
  const rubro = (contact as any).rubros;

  return (
    <MarcoPerfil slug={temaDe(rubro?.slug)}>
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-slate-600">Ficha · {rubro?.name ?? "Perfil"}</p>
            <h1 className="text-2xl font-semibold text-slate-900 [overflow-wrap:anywhere]">{contact.full_name ?? "Sin nombre"}</h1>
            <p className="text-sm text-slate-700 [overflow-wrap:anywhere]">
              {contact.phone ?? "—"}
              {contact.dni_cuil ? ` · DNI ${contact.dni_cuil}` : ""}
            </p>
          </div>
          <EnlaceVolver volver={volver} respaldo={inicioDePerfil(temaDe(rubro?.slug))} />
        </div>
        {conversations.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {conversations.map((c) => (
              <EnlaceDetalle key={c.id} href={`/inbox/${c.id}`} className="tactil inline-flex items-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800">
                Abrir conversación
              </EnlaceDetalle>
            ))}
          </div>
        )}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <FichaSection contactId={contact.id} />
        </div>
      </div>
    </MarcoPerfil>
  );
}
