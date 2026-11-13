import { BaseDetailView } from "@/components/bases/base-detail-view";

export const dynamic = "force-dynamic";

export default async function BaseDetailPage(
  props: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ pagina?: string; filtro?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
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
