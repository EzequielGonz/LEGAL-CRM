import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { requirePageSession } from "@/lib/acceso/pagina";

export const dynamic = "force-dynamic";

// Panel de Jurídico (Estudio Jurídico VITA): menú unificado y paleta propia.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  return <MarcoPerfil slug="juridico">{children}</MarcoPerfil>;
}
