import Link from "next/link";
import { temaDe } from "@/lib/marca";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FichaSection } from "@/components/ficha/ficha-section";
import { requirePageSession } from "@/lib/acceso/pagina";

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
  const volver = searchParams.volver && searchParams.volver.startsWith("/") && !searchParams.volver.startsWith("//") ? searchParams.volver : null;
  const conversations = ((contact as any).conversations ?? []) as { id: string }[];
  const rubro = (contact as any).rubros;

  return (
    <div data-tema={temaDe(rubro?.slug)} className="min-h-screen bg-slate-50 pb-10">
      <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 py-5 shadow-navy">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-gold-300">
              {rubro?.emoji} {rubro?.name ?? "Perfil"}
            </p>
            <h1 className="font-serif text-xl font-semibold text-white">{contact.full_name ?? "Sin nombre"}</h1>
            <p className="text-sm text-slate-300">
              {contact.phone ?? "—"}
              {contact.dni_cuil ? ` · DNI ${contact.dni_cuil}` : ""}
            </p>
          </div>
          <Link href={volver ?? "/inicio"} className="text-xs text-slate-400 hover:text-gold-200">
            ← Volver
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <FichaSection contactId={contact.id} />
        </div>
        {conversations.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            {conversations.map((c) => (
              <Link key={c.id} href={`/inbox/${c.id}`} className="block text-slate-700 hover:underline">
                Ver conversación →
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
