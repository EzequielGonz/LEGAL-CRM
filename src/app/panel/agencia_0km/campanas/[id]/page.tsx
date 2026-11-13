import { CampaignDetailView } from "@/components/campanas/campaign-detail-view";

export const dynamic = "force-dynamic";

// Filtrar por área además del id evita que, poniendo a mano la URL de una
// campaña de otro perfil, se pueda entrar a verla desde este panel.
export default async function CampaignDetail0kmPage(
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
      areas={["agencia_0km"]}
      backHref="/panel/agencia_0km/campanas"
      basesPath="/panel/agencia_0km/bases"
      searchParams={searchParams ?? {}}
    />
  );
}
