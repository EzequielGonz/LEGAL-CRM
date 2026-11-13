import { PaginaCartera } from "@/components/cartera/vista-cartera";

export const dynamic = "force-dynamic";
export const metadata = { title: "Descartados" };

/** Descartados (12/11): perdidos y pedidos de no contacto, fuera del trabajo del día. Solo lectura. */
export default async function Pagina(props: { searchParams: Promise<{ perfil?: string; grupo?: string }> }) {
  const searchParams = await props.searchParams;
  return <PaginaCartera vista="descartados" searchParams={searchParams} />;
}
