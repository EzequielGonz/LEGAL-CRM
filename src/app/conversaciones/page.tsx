import { PaginaCartera } from "@/components/cartera/vista-cartera";

export const dynamic = "force-dynamic";
export const metadata = { title: "Chats" };

/** Conversaciones (reorganización 2, 18/10): grupos compactos con las fichas que valen la pena. */
export default async function Pagina(props: { searchParams: Promise<{ perfil?: string; grupo?: string }> }) {
  const searchParams = await props.searchParams;
  return <PaginaCartera vista="conversaciones" searchParams={searchParams} />;
}
