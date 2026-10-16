import { ProfileSidebar } from "@/components/perfiles/profile-sidebar";
import { requirePageSession } from "@/lib/acceso/pagina";

export const dynamic = "force-dynamic";

// Panel completo y exclusivo de Coberturas Médicas: mismo patrón que el de
// Agencia 0KM y Marketing — su propio sidebar, acotado solo a lo de este
// rubro. Nunca comparte el layout de (dashboard) de Jurídico para no
// arrastrar su navegación (Inbox, Prospectos, Bases, Agenda).
export default async function PanelCoberturasMedicasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  return (
    <div className="flex">
      <ProfileSidebar slug="coberturas_medicas" extraNavItems={[{ path: "seguimiento", label: "Seguimiento" }]} />
      <main id="contenido" tabIndex={-1} className="h-screen flex-1 overflow-y-auto bg-slate-50 p-8">{children}</main>
    </div>
  );
}
