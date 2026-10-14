import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/server";
import { requirePageSession } from "@/lib/acceso/pagina";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  // Nombre del perfil guardado en la base (se edita en Configuración).
  const supabase = createClient();
  const { data: profile } = await supabase.from("rubros").select("name").eq("slug", "juridico").maybeSingle();

  return (
    <div className="flex">
      <Sidebar title={profile?.name ?? "Panel"} />
      <main className="h-screen flex-1 overflow-y-auto bg-slate-50 p-8">
        {children}
      </main>
    </div>
  );
}
