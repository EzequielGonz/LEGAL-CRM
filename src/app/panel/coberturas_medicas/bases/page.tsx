import { BasesListView } from "@/components/bases/bases-list-view";

export const dynamic = "force-dynamic";

// Bases del perfil (bloque 1.6): mismo flujo de importación y calidad que el resto.
export default async function BasesPage(props: { searchParams: Promise<{ archivadas?: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <BasesListView
      areas={["coberturas_medicas"]}
      importAreas={[{ value: "coberturas_medicas", label: "coberturas_medicas" }]}
      basesPath="/panel/coberturas_medicas/bases"
      searchParams={searchParams ?? {}}
    />
  );
}
