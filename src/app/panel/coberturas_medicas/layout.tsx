import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { requirePageSession } from "@/lib/acceso/pagina";

export const dynamic = "force-dynamic";

// Panel exclusivo del perfil: menú unificado (src/lib/menu.ts) acotado a lo
// de este rubro y su paleta de marca. Nunca comparte el layout de Jurídico.
export default async function PanelCoberturasMedicasLayout({ children }: { children: React.ReactNode }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  return <MarcoPerfil slug="coberturas_medicas">{children}</MarcoPerfil>;
}
