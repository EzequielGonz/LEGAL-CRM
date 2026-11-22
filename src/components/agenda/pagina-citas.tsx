import { Suspense } from "react";
import { VistaCitas } from "@/components/agenda/vista-citas";
import { AgendaSupervision } from "@/components/agenda/agenda-supervision";
import { EnlaceAvanzado } from "@/components/nivel/nivel";
import { VerMas } from "@/components/premium";
import { AREAS_DE_PERFIL } from "@/lib/cartera-servidor";
import { RUBRO_IDS } from "@/lib/rubros";
import type { SlugPerfil } from "@/lib/marca";

type SP = { tab?: string; ficha?: string; pagina?: string; vista?: string; fecha?: string; canceladas?: string };

/**
 * Citas de un perfil (22/11): calendario por día o semana con acciones, y debajo «Otros pendientes»
 * (captados sin derivar, seguimientos y atención humana) con la ficha al costado. Sirve a los cuatro perfiles.
 */
export function PaginaCitas({ slug, basePath, searchParams, fichaHref, conversationHref, configHref }: { slug: SlugPerfil; basePath: string; searchParams: SP; fichaHref: string; conversationHref?: string; configHref?: string }) {
  const areas = AREAS_DE_PERFIL[slug];
  return (
    <div className="ct mx-auto max-w-6xl">
      <header className="ct-encabezado">
        <h1 className="ct-titulo">Citas</h1>
        <p className="ct-bajada">Quién tiene cita y cuándo, incluidas las de Fase 2 con la IA. Agendá, movela, cancelala (queda archivada) o cargá si asistió.</p>
      </header>
      <Suspense fallback={<div className="ct-esqueleto" role="status" aria-label="Cargando citas" style={{ height: 320 }} />}>
        <VistaCitas slug={slug} areas={areas} basePath={basePath} sp={searchParams} />
      </Suspense>
      <VerMas cerrado="Otros pendientes: captados sin derivar, seguimientos y atención humana" abierto="Ocultar otros pendientes" abiertoAlInicio={!!(searchParams.tab || searchParams.ficha || searchParams.pagina)}>
        <AgendaSupervision rubroId={RUBRO_IDS[slug]} areas={areas} basePath={basePath} searchParams={searchParams} fichaHref={fichaHref} conversationHref={conversationHref} sinCitas />
      </VerMas>
      {configHref ? (
        <p className="solo-avanzado ct-bajada">
          Los días y horarios en que se dan citas se definen en la configuración.{" "}
          <EnlaceAvanzado href={configHref} className="font-medium underline underline-offset-2">Personalizar horarios para citas</EnlaceAvanzado>
        </p>
      ) : null}
    </div>
  );
}
