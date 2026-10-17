import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PhoneHeader } from "@/components/telefono/phone-header";
import { PushControls } from "@/components/telefono/push-controls";
import { InstallHint } from "@/components/telefono/install-hint";
import { phoneProfile } from "@/lib/telefono";
import { temaDe } from "@/lib/marca";
import { marcasResueltas } from "@/lib/marca-servidor";
import { LogoPerfil } from "@/components/ui/logo-perfil";
import { Icono } from "@/components/ui/icono-seccion";

export const dynamic = "force-dynamic";

/**
 * Modo teléfono (doc. 1, 3.1 · bloque 1.9): todos los perfiles con su
 * nombre y foto, y tres accesos: Iniciar campaña, Clientes cerrados y
 * Estadísticas. Pensado para cargar archivos y gestionar entregas desde el
 * teléfono sin adaptar todas las tablas del CRM de PC.
 */
export default async function TelefonoPage() {
  const supabase = createClient();
  const { data: rubros } = await supabase
    .from("rubros")
    .select("id, slug, name, emoji, photo_url")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  const perfiles = (rubros ?? []).filter((r: any) => phoneProfile(r.slug));
  const marcas = await marcasResueltas().catch(() => null);

  return (
    <div data-tema="neutro" className="min-h-screen">
      <PhoneHeader eyebrow="Teléfono" title="Perfiles" subtitle="Elegí qué querés hacer en cada perfil." />
      <main className="mx-auto max-w-md space-y-4 px-4 py-5">
        {perfiles.map((r: any) => (
          <section key={r.id} data-tema={temaDe(r.slug)} className="tarjeta-perfil-tel rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              {r.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.photo_url} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <LogoPerfil slug={temaDe(r.slug)} src={marcas?.[temaDe(r.slug)]?.logoPanel} tamano="md" />
              )}
              <h2 className="text-lg font-semibold text-slate-900">{r.name}</h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Link
                href={`/telefono/${r.slug}/campana`}
                className="flex min-h-[44px] flex-col items-center gap-1.5 rounded-xl bg-slate-900 px-2 py-3 text-center text-sm font-semibold text-white"
              >
                <Icono nombre="campanas" className="h-5 w-5" />
                Cargar base y campaña
              </Link>
              <Link
                href={`/telefono/${r.slug}/clientes`}
                className="flex min-h-[44px] flex-col items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2 py-3 text-center text-sm font-semibold text-slate-900"
              >
                <Icono nombre="cerrados" className="h-5 w-5" />
                Clientes cerrados
              </Link>
              <Link
                href={`/telefono/${r.slug}/estadisticas`}
                className="flex min-h-[44px] flex-col items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2 py-3 text-center text-sm font-semibold text-slate-900"
              >
                <Icono nombre="estadisticas" className="h-5 w-5" />
                Estadísticas
              </Link>
            </div>
          </section>
        ))}
        {perfiles.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-700">
            No hay perfiles activos.
          </p>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
          <h2 className="mb-2 font-semibold text-slate-900">Avisos en este teléfono</h2>
          <PushControls />
        </section>
        <InstallHint />
      </main>
    </div>
  );
}
