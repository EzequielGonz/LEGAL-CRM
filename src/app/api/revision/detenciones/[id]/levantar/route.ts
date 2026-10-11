import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { liftDetention } from "@/lib/detention";

export const dynamic = "force-dynamic";

/**
 * Levantar una detención: siempre con motivo escrito. Para un pedido de no
 * contacto o el número de una menor además hay que confirmarlo de forma
 * explícita (confirmacion: "LEVANTAR").
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  const motivo = typeof body?.motivo === "string" ? body.motivo.trim() : "";
  if (!motivo) return NextResponse.json({ error: "Escribí el motivo." }, { status: 400 });

  const supabase = createAdminClient();
  const { data: det } = await supabase
    .from("contact_detentions")
    .select("id, motive, minor_reported, contact_id, status")
    .eq("id", params.id)
    .maybeSingle();
  if (!det) return NextResponse.json({ error: "Detención no encontrada" }, { status: 404 });
  if (det.status !== "vigente") return NextResponse.json({ error: "Ya estaba levantada" }, { status: 409 });
  if ((det.motive === "no_contacto" || det.minor_reported) && body?.confirmacion !== "LEVANTAR") {
    return NextResponse.json(
      { error: "Es un pedido de no contacto o el número de una menor: confirmá escribiendo LEVANTAR.", requiere_confirmacion: true },
      { status: 409 }
    );
  }

  try {
    await liftDetention(det.id, motivo, "operador");
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 400 });
  }

  const { data: opp } = await supabase
    .from("opportunities")
    .select("id")
    .eq("contact_id", det.contact_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (opp) {
    await supabase.from("opportunity_events").insert({
      opportunity_id: opp.id,
      actor: "operador",
      dimension: "detencion",
      from_value: det.motive,
      to_value: "levantada",
      reason: motivo,
      detail: { detencion: det.id },
    });
  }
  return NextResponse.json({ ok: true });
}
