import { BasesListView } from "@/components/bases/bases-list-view";

export const dynamic = "force-dynamic";

// Jurídico: bases de sus áreas internas (Civil y Penal).
export default async function BasesPage({ searchParams }: { searchParams: { archivadas?: string } }) {
  return (
    <BasesListView
      areas={["civil", "penal"]}
      importAreas={[
        { value: "civil", label: "Civil" },
        { value: "penal", label: "Penal" },
      ]}
      basesPath="/bases"
      searchParams={searchParams ?? {}}
    />
  );
}
