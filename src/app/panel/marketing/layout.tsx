import { SidebarRubro } from "@/components/sidebar-rubro";

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
      <SidebarRubro basePath="/panel/marketing" emoji="📈" name="Agencia Marketing" />
      <main className="h-screen flex-1 overflow-y-auto bg-slate-50 p-8">{children}</main>
    </div>
  );
}
