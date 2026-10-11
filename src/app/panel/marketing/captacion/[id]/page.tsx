import Link from "next/link";
import { BaseDetailView } from "@/components/bases/base-detail-view";

export const dynamic = "force-dynamic";

// Una búsqueda de captación de Marketing es una base más: mismo detalle,
// filtros, calidad y preparación de campaña (bloque 1.6), con su descarga
// en Excel. Filtrar por área evita entrar a una búsqueda de otro perfil.
export default async function CaptacionDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { pagina?: string; filtro?: string };
}) {
  return (
    <BaseDetailView
      baseId={params.id}
      areas={["marketing"]}
      basesPath="/panel/marketing/captacion"
      campaignsPath="/panel/marketing/campanas"
      fichaBase="/ficha"
      searchParams={searchParams ?? {}}
      backLabel="← Volver a captación"
      headerExtra={
        <Link href={`/api/marketing/scraping/${params.id}/export`} className="text-sm text-gold-700 hover:underline">
          Descargar Excel
        </Link>
      }
    />
  );
}
