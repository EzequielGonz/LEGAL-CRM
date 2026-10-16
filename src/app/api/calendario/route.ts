import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listCalendarExceptions } from "@/lib/contacto/calendario";
import { argentinaParts, exceptionProblems } from "@/lib/contacto/reglas";
import { requireSession } from "@/lib/acceso/autorizacion";

export const dynamic = "force-dynamic";

/**
 * Etapa 2 · Bloque 2.0 — Excepciones del calendario de contacto.
 * GET: las vigentes desde hoy y las archivadas recientes.
 * POST { day: "AAAA-MM-DD", closed: boolean, start_hour?, end_hour?, note? }:
 *   agrega una excepción (un día cerrado o un horario más corto). Solo
 *   restringe: no abre domingos ni amplía el horario general.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const r = await listCalendarExceptions();
  if (r.error) return NextResponse.json({ error: r.error }, { status: 500 });
  return NextResponse.json({ upcoming: r.upcoming, archived: r.archived });
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const closed = body?.closed === true;
  const toHour = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));
  const exception = {
    day: typeof body?.day === "string" ? body.day.trim() : "",
    closed,
    startHour: closed ? null : toHour(body?.start_hour),
    endHour: closed ? null : toHour(body?.end_hour),
  };
  const problems = exceptionProblems(exception);
  if (!problems.length && exception.day < argentinaParts(new Date()).day) {
    problems.push("Solo se cargan excepciones de hoy en adelante.");
  }
  if (problems.length) return NextResponse.json({ error: problems.join(" ") }, { status: 400 });

  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 300) || null : null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("contact_calendar_exceptions")
    .insert({
      day: exception.day,
      closed,
      start_hour: exception.startHour,
      end_hour: exception.endHour,
      note,
      created_by: "panel",
    })
    .select("*")
    .single();
  if (error) {
    if ((error as any).code === "23505") {
      return NextResponse.json(
        { error: "Ya hay una excepción vigente para ese día. Archivala primero si querés cambiarla." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("ops_change_log").insert({
    actor: "panel",
    action: "calendario_excepcion_agregada",
    target: `contact_calendar_exceptions.${data.id}`,
    before: null,
    after: { day: data.day, closed: data.closed, start_hour: data.start_hour, end_hour: data.end_hour, note: data.note },
  });
  return NextResponse.json({ ok: true, exception: data });
}
