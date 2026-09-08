import { createClient } from "@/lib/supabase/server";
import { AvailabilityEditor } from "@/components/agenda/availability-editor";
import { AreaBadge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const supabase = createClient();

  const [{ data: civilRules }, { data: penalRules }, { data: appointments }] = await Promise.all([
    supabase.from("availability_rules").select("*").eq("area", "civil").order("weekday"),
    supabase.from("availability_rules").select("*").eq("area", "penal").order("weekday"),
    supabase
      .from("appointments")
      .select("id, starts_at, status, area, contacts(full_name, phone)")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(50),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Agenda</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <AvailabilityEditor area="civil" initialRules={civilRules ?? []} />
        <AvailabilityEditor area="penal" initialRules={penalRules ?? []} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Próximas citas</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="py-2">Fecha y hora</th>
              <th className="py-2">Prospecto</th>
              <th className="py-2">Área</th>
              <th className="py-2">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(appointments ?? []).map((a: any) => (
              <tr key={a.id}>
                <td className="py-2">{new Date(a.starts_at).toLocaleString("es-AR")}</td>
                <td className="py-2">{a.contacts?.full_name ?? "—"}</td>
                <td className="py-2">
                  <AreaBadge area={a.area} />
                </td>
                <td className="py-2 text-slate-500">{a.status}</td>
              </tr>
            ))}
            {(appointments ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400">
                  No hay citas próximas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
