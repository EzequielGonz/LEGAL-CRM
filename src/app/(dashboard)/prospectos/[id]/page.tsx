import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AreaBadge, SourceBadge, StatusBadge } from "@/components/ui/badge";
import { ContactEditForm } from "@/components/prospectos/contact-edit-form";
import { ScheduleAppointmentForm } from "@/components/prospectos/schedule-appointment-form";
import { CancelAppointmentButton } from "@/components/prospectos/cancel-appointment-button";

export const dynamic = "force-dynamic";

export default async function ProspectoDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: contact } = await supabase
    .from("contacts")
    .select(
      "*, studios(name), conversations(id, channels(label)), appointments(*), imported_bases(name, source_label)"
    )
    .eq("id", params.id)
    .single();

  if (!contact) notFound();

  const { data: studios } = await supabase
    .from("studios")
    .select("id, name")
    .eq("area", contact.area)
    .eq("active", true)
    .order("name");

  const conversations = (contact.conversations as any[]) ?? [];
  const appointments = (contact.appointments as any[]) ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/prospectos" className="mb-4 inline-block text-sm text-slate-500 hover:underline">
        ← Volver a prospectos
      </Link>

      <div className="mb-6 flex items-start justify-between rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {contact.full_name ?? "Sin nombre"}
          </h1>
          <p className="text-sm text-slate-500">{contact.phone ?? "—"} · {contact.email ?? "—"}</p>
          {contact.dni_cuil && (
            <p className="text-xs text-slate-400">DNI/CUIL: {contact.dni_cuil}</p>
          )}
          {(contact as any).imported_bases && (
            <p className="text-xs text-slate-400">
              Base de origen: {(contact as any).imported_bases.name} ·{" "}
              {(contact as any).imported_bases.source_label}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <AreaBadge area={contact.area} />
          <StatusBadge status={contact.status} />
          <SourceBadge source={contact.source} />
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Gestionar prospecto</h2>
        <ContactEditForm
          contact={{
            id: contact.id,
            full_name: contact.full_name,
            phone: contact.phone,
            email: contact.email,
            dni_cuil: contact.dni_cuil,
            notes: contact.notes,
            status: contact.status,
            assigned_studio_id: contact.assigned_studio_id,
          }}
          studios={studios ?? []}
        />
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Datos recopilados por la IA</h2>
        {Object.keys(contact.qualification_data ?? {}).length === 0 ? (
          <p className="text-sm text-slate-400">Sin datos recopilados todavía.</p>
        ) : (
          <dl className="grid grid-cols-2 gap-4">
            {Object.entries(contact.qualification_data as Record<string, unknown>).map(
              ([key, value]) => (
                <div key={key}>
                  <dt className="text-xs font-medium uppercase text-slate-400">
                    {key.replaceAll("_", " ")}
                  </dt>
                  <dd className="text-sm text-slate-800">{String(value)}</dd>
                </div>
              )
            )}
          </dl>
        )}
        {contact.meets_criteria !== null && (
          <p className="mt-4 text-sm">
            Cumple criterios comerciales:{" "}
            <span className={contact.meets_criteria ? "text-green-600" : "text-red-600"}>
              {contact.meets_criteria ? "Sí" : "No"}
            </span>
          </p>
        )}
        {contact.studios?.name && (
          <p className="mt-1 text-sm text-slate-600">Derivado a: {contact.studios.name}</p>
        )}
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Citas</h2>
        {appointments.length === 0 ? (
          <p className="mb-4 text-sm text-slate-400">Sin citas agendadas.</p>
        ) : (
          <ul className="mb-4 space-y-2">
            {appointments.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <span>{new Date(a.starts_at).toLocaleString("es-AR")}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">{a.status}</span>
                  {a.status !== "cancelada" && <CancelAppointmentButton appointmentId={a.id} />}
                </div>
              </li>
            ))}
          </ul>
        )}
        <ScheduleAppointmentForm contactId={contact.id} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Conversaciones</h2>
        {conversations.length === 0 ? (
          <p className="text-sm text-slate-400">Sin conversaciones todavía.</p>
        ) : (
          <ul className="space-y-2">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link href={`/inbox/${c.id}`} className="text-sm text-blue-600 hover:underline">
                  Ver conversación · {c.channels?.label ?? "Canal"}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
