import { CampaignDetailView } from "@/components/campanas/campaign-detail-view";

export const dynamic = "force-dynamic";

// Jurídico: solo campañas de sus áreas internas (Civil y Penal).
export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { pagina?: string; estado?: string };
}) {
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
