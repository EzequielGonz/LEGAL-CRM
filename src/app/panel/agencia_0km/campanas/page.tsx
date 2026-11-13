import { CampanasListView } from "@/components/campanas/campanas-list-view";
import { RUBRO_IDS } from "@/lib/rubros";

export const dynamic = "force-dynamic";
export const metadata = { title: "Campañas" };

export default async function CampanasPage(props: { searchParams: Promise<{ archivadas?: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <CampanasListView
      areas={["agencia_0km"]}
      channelArea="agencia_0km"
      rubroId={RUBRO_IDS.agencia_0km}
      basePath="/panel/agencia_0km/campanas"
      perfilNombre="Autos 0 km"
      searchParams={searchParams ?? {}}
    />
  );
}
