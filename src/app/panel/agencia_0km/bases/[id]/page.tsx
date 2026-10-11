import { BaseDetailView } from "@/components/bases/base-detail-view";

export const dynamic = "force-dynamic";

export default async function BaseDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { pagina?: string; filtro?: string };
}) {
  return (
    <BaseDetailView
      baseId={params.id}
      areas={["agencia_0km"]}
      basesPath="/panel/agencia_0km/bases"
      campaignsPath="/panel/agencia_0km/campanas"
      fichaBase="/ficha"
      searchParams={searchParams ?? {}}
    />
  );
}
