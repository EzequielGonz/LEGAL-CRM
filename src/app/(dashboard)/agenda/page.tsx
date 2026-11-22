import { PaginaCitas } from "@/components/agenda/pagina-citas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Citas" };

/** Citas de Jurídico (22/11): calendario con acciones y, debajo, los otros pendientes. Horarios en Configuración. */
export default async function AgendaPage(props: { searchParams: Promise<{ tab?: string; ficha?: string; pagina?: string; vista?: string; fecha?: string; canceladas?: string }> }) {
  const searchParams = await props.searchParams;
  return <PaginaCitas slug="juridico" basePath="/agenda" searchParams={searchParams ?? {}} fichaHref="/prospectos" conversationHref="/inbox" configHref="/configuracion#disponibilidad" />;
}
