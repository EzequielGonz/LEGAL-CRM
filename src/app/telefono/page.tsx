import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PhoneHeader } from "@/components/telefono/phone-header";
import { PushControls } from "@/components/telefono/push-controls";
import { InstallHint } from "@/components/telefono/install-hint";
import { phoneProfile } from "@/lib/telefono";
import { marcaDe, temaDe } from "@/lib/marca";
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
                <span className="logo-perfil h-12 w-12">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={marcaDe(r.slug).logo} alt="" className="h-full w-full object-contain" />
                </span>
              )}
              <p className="font-serif text-lg font-semibold text-slate-900">{r.name}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Link
                href={`/telefono/${r.slug}/campana`}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-slate-900 px-2 py-3 text-center text-xs font-semibold text-gold-100 active:scale-[0.98]"
              >
                <Icono nombre="campanas" className="h-5 w-5" />
                Iniciar campaña
              </Link>
              <Link
                href={`/telefono/${r.slug}/clientes`}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-300 px-2 py-3 text-center text-xs font-semibold text-slate-700 active:scale-[0.98]"
              >
                <Icono nombre="cerrados" className="h-5 w-5" />
                Clientes cerrados
              </Link>
              <Link
                href={`/telefono/${r.slug}/estadisticas`}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-300 px-2 py-3 text-center text-xs font-semibold text-slate-700 active:scale-[0.98]"
              >
                <Icono nombre="estadisticas" className="h-5 w-5" />
                Estadísticas
              </Link>
            </div>
          </section>
        ))}
        {perfiles.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
            No hay perfiles activos.
          </p>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
          <p className="mb-2 font-semibold text-slate-800">Avisos en este teléfono</p>
          <PushControls />
        </section>
        <InstallHint />
      </main>
    </div>
  );
}
