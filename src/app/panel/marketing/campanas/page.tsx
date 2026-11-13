import { CampanasListView } from "@/components/campanas/campanas-list-view";
import { RUBRO_IDS } from "@/lib/rubros";

export const dynamic = "force-dynamic";
export const metadata = { title: "Campañas" };

export default async function CampanasPage(props: { searchParams: Promise<{ archivadas?: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <CampanasListView
      areas={["marketing"]}
      channelArea="marketing"
      rubroId={RUBRO_IDS.marketing}
      basePath="/panel/marketing/campanas"
      perfilNombre="Marketing"
      searchParams={searchParams ?? {}}
    />
  );
}
