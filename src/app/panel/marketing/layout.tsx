import { ProfileSidebar } from "@/components/perfiles/profile-sidebar";

export const dynamic = "force-dynamic";

// Panel completo y exclusivo de Marketing: mismo diseño que el panel de
// Jurídico y el de Agencia 0KM, pero con su propio sidebar acotado solo a
// lo de este rubro. Nunca comparte el layout de (dashboard) ni el de
// agencia_0km.
export default function PanelMarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <ProfileSidebar slug="marketing" extraNavItems={[
          { path: "captacion", label: "Captación" },
          { path: "prospectos", label: "Prospectos prioritarios" },
          { path: "seguimiento", label: "Seguimiento o repesca" },
          { path: "consultas-directas", label: "Consultas directas" },
          { path: "estadisticas", label: "Estadísticas" },
        ]} />
      <main className="h-screen flex-1 overflow-y-auto bg-slate-50 p-8">{children}</main>
    </div>
  );
}
