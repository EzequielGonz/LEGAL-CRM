import { PaginaCitas } from "@/components/agenda/pagina-citas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Citas" };

// Citas del perfil (22/11): calendario con acciones y otros pendientes; misma herramienta que Jurídico.
export default async function AgendaPage(props: { searchParams: Promise<{ tab?: string; ficha?: string; pagina?: string; vista?: string; fecha?: string; canceladas?: string }> }) {
  const searchParams = await props.searchParams;
  return <PaginaCitas slug="marketing" basePath="/panel/marketing/agenda" searchParams={searchParams ?? {}} fichaHref="/ficha" />;
}
