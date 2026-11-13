import { BasesListView } from "@/components/bases/bases-list-view";

export const dynamic = "force-dynamic";

// Bases del perfil (bloque 1.6): mismo flujo de importación y calidad que el resto.
export default async function BasesPage(props: { searchParams: Promise<{ archivadas?: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <BasesListView
      areas={["agencia_0km"]}
      importAreas={[{ value: "agencia_0km", label: "agencia_0km" }]}
      basesPath="/panel/agencia_0km/bases"
      searchParams={searchParams ?? {}}
    />
  );
}
