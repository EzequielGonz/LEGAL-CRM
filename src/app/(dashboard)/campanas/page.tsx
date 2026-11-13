import { CampanasListView } from "@/components/campanas/campanas-list-view";
import { RUBRO_IDS } from "@/lib/rubros";

export const dynamic = "force-dynamic";
export const metadata = { title: "Campañas" };

// Jurídico: campañas de Civil y Penal (cada perfil tiene las suyas).
export default async function CampanasPage(props: { searchParams: Promise<{ archivadas?: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <CampanasListView
      areas={["civil", "penal"]}
      channelArea="civil"
      rubroId={RUBRO_IDS.juridico}
      basePath="/campanas"
      perfilNombre="Jurídico"
      searchParams={searchParams ?? {}}
    />
  );
}
