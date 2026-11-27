import Link from "next/link";
import { EfectosVidrio } from "@/components/ui/efectos-vidrio";
import { SalaLampara } from "@/components/ui/lampara-dibujo";
import { ConocimientoBot } from "@/components/perfiles/conocimiento-bot";
import { LaboratorioSimple } from "@/components/laboratorio/laboratorio-simple";
import { VerMas } from "@/components/premium/ver-mas";
import "@/components/perfiles/accesos-centrales.css";
import { leerRubrosActivos } from "@/lib/perfiles-stats";
import { marcasResueltas } from "@/lib/marca-servidor";
import { requirePageSession } from "@/lib/acceso/pagina";

export const metadata = { title: "Laboratorio de bots" };
export const dynamic = "force-dynamic";

/**
 * Laboratorio de bots (22/11): pantalla simple por rubro (cómo anda el bot, roles y ficha del negocio).
 * La vista técnica de antes (versiones v1/v2, tabla y laboratorio con asistente) sigue entera detrás de «Ver más».
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
            <p className="mt-2 text-sm">Cómo anda el bot de cada rubro, sus roles y la ficha del negocio. Todo lo que cambies te pide confirmar antes.</p>
          </div>
          <Link href="/perfiles" prefetch={false} className="ac-volver">
            <span aria-hidden="true">←</span> Volver a Perfiles
          </Link>
        </div>
        <LaboratorioSimple nombres={nombres} />
        <div className="lab mt-8">
          <VerMas cerrado="Ver el detalle técnico (versiones y tabla)" abierto="Ocultar el detalle técnico">
            <ConocimientoBot nombres={nombres} />
          </VerMas>
        </div>
      </main>
    </div>
  );
}
