import { PaginaCartera } from "@/components/cartera/vista-cartera";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contactos" };

/** Contactos (reorganización 2, 18/10): grupos compactos con las fichas que valen la pena. */
export default function Pagina({ searchParams }: { searchParams: { perfil?: string; grupo?: string } }) {
  return <PaginaCartera vista="contactos" searchParams={searchParams} />;
}
