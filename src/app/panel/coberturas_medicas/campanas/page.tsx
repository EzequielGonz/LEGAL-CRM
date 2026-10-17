import { CampanasListView } from "@/components/campanas/campanas-list-view";
import { RUBRO_IDS } from "@/lib/rubros";

export const dynamic = "force-dynamic";
export const metadata = { title: "Campañas" };

export default function CampanasPage({ searchParams }: { searchParams: { archivadas?: string } }) {
  return (
    <CampanasListView
      areas={["coberturas_medicas"]}
      channelArea="coberturas_medicas"
      rubroId={RUBRO_IDS.coberturas_medicas}
      basePath="/panel/coberturas_medicas/campanas"
      perfilNombre="Coberturas médicas"
      searchParams={searchParams ?? {}}
    />
  );
}
