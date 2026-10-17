import { EnlaceAvanzado } from "@/components/nivel/nivel";
import { AgendaSupervision } from "@/components/agenda/agenda-supervision";
import { RUBRO_IDS } from "@/lib/rubros";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agenda" };

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
      <p className="mb-6 text-sm text-slate-700">
        Citas y pendientes del perfil. Elegí una persona para ver su ficha al costado y resolverlo sin salir de acá.
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

      <p className="text-sm text-slate-700">
        Los días y horarios en que se dan citas se definen en la configuración.{" "}
        <EnlaceAvanzado href="/configuracion#disponibilidad" className="font-medium text-slate-900 underline underline-offset-2">
          Personalizar horarios para citas
        </EnlaceAvanzado>
      </p>
    </div>
  );
}
