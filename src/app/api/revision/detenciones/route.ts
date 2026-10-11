import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DETENTION_MOTIVES, createDetention, type DetentionMotive } from "@/lib/detention";

export const dynamic = "force-dynamic";

/** Registrar una detención a mano (desde la ficha). */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const contactId = typeof body?.contact_id === "string" ? body.contact_id : "";
  const motive = body?.motive as DetentionMotive;
  const nota = typeof body?.nota === "string" ? body.nota.trim() : "";
  if (!contactId || !DETENTION_MOTIVES.includes(motive)) {
    return NextResponse.json({ error: "Falta el contacto o el motivo es inválido." }, { status: 400 });
  }
  try {
    const id = await createDetention({
      contactId,
      motive,
      source: "operador",
      minorReported: body?.menor === true,
      evidence: nota ? { nota } : {},
    });
    const supabase = createAdminClient();
    const { data: opp } = await supabase
      .from("opportunities")
      .select("id")
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (opp) {
      await supabase.from("opportunity_events").insert({
        opportunity_id: opp.id,
        actor: "operador",
        dimension: "detencion",
        to_value: motive,
        reason: nota || "Detención registrada desde el panel",
        detail: { detencion: id },
      });
    }
    return NextResponse.json({ ok: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 400 });
  }
}
