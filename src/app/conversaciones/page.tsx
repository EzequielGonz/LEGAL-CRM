import { PaginaCartera } from "@/components/cartera/vista-cartera";

export const dynamic = "force-dynamic";
export const metadata = { title: "Conversaciones" };

/** Conversaciones (reorganización 2, 18/10): grupos compactos con las fichas que valen la pena. */
export default function Pagina({ searchParams }: { searchParams: { perfil?: string; grupo?: string } }) {
  return <PaginaCartera vista="conversaciones" searchParams={searchParams} />;
}
