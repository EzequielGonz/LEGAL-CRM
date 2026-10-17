import { CampanasListView } from "@/components/campanas/campanas-list-view";
import { RUBRO_IDS } from "@/lib/rubros";

export const dynamic = "force-dynamic";
export const metadata = { title: "Campañas" };

export default function CampanasPage({ searchParams }: { searchParams: { archivadas?: string } }) {
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
