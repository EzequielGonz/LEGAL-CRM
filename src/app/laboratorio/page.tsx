import Link from "next/link";
import { EfectosVidrio } from "@/components/ui/efectos-vidrio";
import { SalaLampara } from "@/components/ui/lampara-dibujo";
import { ConocimientoBot } from "@/components/perfiles/conocimiento-bot";
import "@/components/perfiles/accesos-centrales.css";
import { leerRubrosActivos } from "@/lib/perfiles-stats";
import { marcasResueltas } from "@/lib/marca-servidor";
import { requirePageSession } from "@/lib/acceso/pagina";

export const metadata = { title: "Laboratorio de bots" };
export const dynamic = "force-dynamic";

/**
 * Laboratorio de bots (22/11): las versiones del conocimiento del bot (v1/v2) y su
 * comparación con resultados reales. Antes estaba al pie de /perfiles; se mudó acá
 * sin cambios, con el mismo marco y fondo que Perfiles.
 */
export default async function LaboratorioPage() {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const [rubros, marcas] = await Promise.all([leerRubrosActivos(), marcasResueltas().catch(() => null)]);
  const nombres = Object.fromEntries(rubros.map((p) => [p.slug, (marcas as any)?.[p.slug]?.nombre ?? p.name]));
  return (
    <div className="escena-oscura sala-perfil flex min-h-screen items-start justify-center px-4 py-12 sm:px-6">
      <SalaLampara />
      <EfectosVidrio />
      <main id="laboratorio" className="escena-capa relative w-full max-w-6xl">
        <div className="ac-cabecera">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Laboratorio de bots</h1>
            <p className="mt-2 text-sm">Versiones del conocimiento de cada bot y cómo les fue con resultados reales.</p>
          </div>
          <Link href="/perfiles" prefetch={false} className="ac-volver">
            <span aria-hidden="true">←</span> Volver a Perfiles
          </Link>
        </div>
        <ConocimientoBot nombres={nombres} />
      </main>
    </div>
  );
}
