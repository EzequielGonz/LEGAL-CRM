import { CampaignDetailView } from "@/components/campanas/campaign-detail-view";

export const dynamic = "force-dynamic";

// Filtrar por área además del id evita que, poniendo a mano la URL de una
// campaña de otro perfil, se pueda entrar a verla desde este panel.
export default async function CampaignDetail0kmPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { pagina?: string; estado?: string };
}) {
  return (
    <CampaignDetailView
      campaignId={params.id}
      areas={["agencia_0km"]}
      backHref="/panel/agencia_0km/campanas"
      basesPath="/panel/agencia_0km/bases"
      searchParams={searchParams ?? {}}
    />
  );
}
