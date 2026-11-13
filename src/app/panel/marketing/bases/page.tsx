import { BasesListView } from "@/components/bases/bases-list-view";

export const dynamic = "force-dynamic";

// Bases del perfil (bloque 1.6): mismo flujo de importación y calidad que el resto.
export default async function BasesPage(props: { searchParams: Promise<{ archivadas?: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <BasesListView
      areas={["marketing"]}
      importAreas={[{ value: "marketing", label: "marketing" }]}
      basesPath="/panel/marketing/bases"
      searchParams={searchParams ?? {}}
    />
  );
}
