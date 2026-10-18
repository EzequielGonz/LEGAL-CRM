import { PhoneHeader } from "@/components/telefono/phone-header";
import { PushControls } from "@/components/telefono/push-controls";
import { InstallHint } from "@/components/telefono/install-hint";
import { PerfilSelector, type MarcaTarjeta } from "@/components/perfiles/perfil-selector";
import { loadPerfiles } from "@/lib/perfiles-stats";
import { marcasResueltas } from "@/lib/marca-servidor";
import { SLUGS_PERFIL, type SlugPerfil } from "@/lib/marca";
import { phoneProfile } from "@/lib/telefono";

export const dynamic = "force-dynamic";

/**
 * Modo teléfono (reorganización 2, 18/10): una tarjeta por perfil con lo
 * pendiente (captados sin derivar, chats, campaña, publicaciones), los tres
 * accesos del teléfono (campaña, cerrados y cifras), el lápiz y los tres
 * puntos. Mismas cifras que en la computadora.
 */
export default async function TelefonoPage() {
  const [todos, marcas] = await Promise.all([loadPerfiles(), marcasResueltas().catch(() => null)]);
  const perfiles = todos.filter((r) => phoneProfile(r.slug));
  const tarjetas: Partial<Record<SlugPerfil, MarcaTarjeta>> = marcas
    ? Object.fromEntries(
        SLUGS_PERFIL.map((s) => [s, { nombre: marcas[s].nombre, logo: marcas[s].origenLogo === "configuracion" ? marcas[s].logoPanel : null, acento: marcas[s].colores?.panel ?? null }])
      )
    : {};
  const pendientes = perfiles.reduce((a, p) => a + p.accion.sin_derivar + p.accion.humano, 0);

  return (
    <div data-tema="neutro" className="min-h-screen">
      <PhoneHeader
        eyebrow="Panel central"
        title="Tus perfiles"
        subtitle={pendientes ? `${pendientes} ${pendientes === 1 ? "cosa espera" : "cosas esperan"} tu atención` : "Todo al día en los cuatro perfiles"}
      />
      <main className="mx-auto max-w-md space-y-5 px-4 pb-8 pt-5">
        {perfiles.length ? (
          <PerfilSelector perfiles={perfiles} marcas={tarjetas} modo="telefono" />
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-700">No hay perfiles activos.</p>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Avisos en este teléfono</h2>
          <PushControls />
        </section>
        <InstallHint />
      </main>
    </div>
  );
}
