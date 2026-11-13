import { CampaignDetailView } from "@/components/campanas/campaign-detail-view";

export const dynamic = "force-dynamic";

// Jurídico: solo campañas de sus áreas internas (Civil y Penal).
export default async function CampaignDetailPage(
  props: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ pagina?: string; estado?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  return (
    <CampaignDetailView
      campaignId={params.id}
      areas={["civil", "penal"]}
      backHref="/campanas"
      basesPath="/bases"
      searchParams={searchParams ?? {}}
    />
  );
}
