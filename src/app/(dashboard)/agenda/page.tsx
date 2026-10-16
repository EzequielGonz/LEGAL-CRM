import Link from "next/link";
import { AgendaSupervision } from "@/components/agenda/agenda-supervision";
import { RUBRO_IDS } from "@/lib/rubros";

export const dynamic = "force-dynamic";

/**
 * Agenda de Jurídico (bloque 1.8): supervisión de citas, captados sin
 * derivar, seguimientos y atención humana, gestionados desde acá mismo con
 * la ficha al costado. La disponibilidad horaria vive en Configuración (Etapa 3).
 */
export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { tab?: string; ficha?: string; pagina?: string };
}) {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Agenda</h1>
      <p className="mb-6 text-sm text-slate-500">
        Pendientes del perfil para supervisar y resolver sin salir de esta pantalla. Las acciones son las mismas que en la
        ficha de Prospectos, Inbox y Casos.
      </p>

      <div className="mb-8">
        <AgendaSupervision
          rubroId={RUBRO_IDS.juridico}
          areas={["civil", "penal"]}
          basePath="/agenda"
          searchParams={searchParams ?? {}}
          fichaHref="/prospectos"
          conversationHref="/inbox"
        />
      </div>

      <p className="text-sm text-slate-600">
        La disponibilidad horaria para citas se edita en{" "}
        <Link href="/configuracion#disponibilidad" className="font-medium text-slate-800 underline-offset-2 hover:underline">
          Configuración → Disponibilidad para citas
        </Link>
        . Acá queda solo lo que hay que supervisar (hoy, próximos y pendientes).
      </p>
    </div>
  );
}
