import { SidebarRubro } from "@/components/sidebar-rubro";

// Panel completo y exclusivo de Agencia 0KM: mismo diseño que el panel de
// Jurídico ((dashboard)/layout.tsx) pero con su propio sidebar, acotado
// solo a lo de este rubro. Nunca comparte el layout de (dashboard) para
// no arrastrar su navegación (Inbox, Prospectos, Bases, Agenda) que hoy
// no filtra por rubro.
export default function PanelAgencia0kmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <SidebarRubro basePath="/panel/agencia_0km" emoji="🚗" name="Agencia 0KM" />
      <main className="h-screen flex-1 overflow-y-auto bg-slate-50 p-8">{children}</main>
    </div>
  );
}
