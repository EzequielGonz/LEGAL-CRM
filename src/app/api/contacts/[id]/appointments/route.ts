import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAppointment } from "@/lib/agenda";

/**
 * Agenda manual: el administrador agenda una cita directamente desde la
 * ficha del prospecto (ej. porque coordinó por teléfono), sin pasar por la
 * herramienta del agente IA ni por `consultar_disponibilidad`. A propósito
 * no dispara `notifyAdminOfClosedAppointment`: esa notificación existe para
 * avisarle al administrador de una cita que agendó la IA sin que él
 * estuviera en la conversación — acá ya la está cargando él mismo.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { starts_at, duration_minutes, consultation_type } = await request.json();

  if (!starts_at) {
    return NextResponse.json({ error: "Falta 'starts_at'" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: contact } = await supabase
    .from("contacts")
    .select("area")
    .eq("id", params.id)
    .single();

  if (!contact) return NextResponse.json({ error: "Prospecto no encontrado" }, { status: 404 });

  const start = new Date(starts_at);
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: "Fecha/hora inválida" }, { status: 400 });
  }
  const end = new Date(start.getTime() + (Number(duration_minutes) || 30) * 60000);

  try {
    const appointment = await createAppointment({
      contactId: params.id,
      area: contact.area,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      consultationType: consultation_type || undefined,
    });
    return NextResponse.json({ ok: true, appointment });
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message ?? err) }, { status: 500 });
  }
}
