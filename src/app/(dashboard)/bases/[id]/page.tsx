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
      areas={["civil", "penal"]}
      basesPath="/bases"
      campaignsPath="/campanas"
      searchParams={searchParams ?? {}}
    />
  );
}
