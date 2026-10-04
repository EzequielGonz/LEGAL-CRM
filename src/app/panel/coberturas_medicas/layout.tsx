import { SidebarRubro } from "@/components/sidebar-rubro";

// Panel completo y exclusivo de Coberturas Médicas: mismo patrón que el de
// Agencia 0KM y Marketing — su propio sidebar, acotado solo a lo de este
// rubro. Nunca comparte el layout de (dashboard) de Jurídico para no
// arrastrar su navegación (Inbox, Prospectos, Bases, Agenda).
export default function PanelCoberturasMedicasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <SidebarRubro basePath="/panel/coberturas_medicas" emoji="🏥" name="Coberturas Médicas" />
      <main className="h-screen flex-1 overflow-y-auto bg-slate-50 p-8">{children}</main>
    </div>
  );
}
