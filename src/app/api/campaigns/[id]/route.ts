import { NextResponse } from "next/server";
import { setCampaignArchived } from "@/lib/archive";
import { createAdminClient } from "@/lib/supabase/admin";
import { AREA_TO_RUBRO_ID } from "@/lib/rubros";
import { requireSession } from "@/lib/acceso/autorizacion";
import { validarEleccionWasender } from "@/lib/wasender/campanas";

/**
 * Las campañas ya no se eliminan (pregunta 20): un DELETE la archiva (y la
 * pausa si estaba en curso). Destinatarios, resultados y conversaciones
 * quedan intactos; recuperarla no reanuda envíos.
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  try {
    await setCampaignArchived(params.id, true, "Archivada desde el panel");
    return NextResponse.json({ ok: true, archivada: true });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 400 });
  }
}

/**
 * Configuración de la campaña (bloque 1.8): línea asignada, días de
 * ejecución (1 = lunes … 6 = sábado; vacío = de lunes a sábado; los
 * domingos no se envía, pregunta 39) y plantilla del catálogo (pregunta 22).
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const supabase = createAdminClient();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, area, status, line_id, run_days, template_id, message_template_name, daily_send_limit, proveedor, wasender_line_id, wasender_plantilla_id, wasender_rotar_inicio" as any)
    .eq("id", params.id)
    .maybeSingle() as { data: any };
  if (!campaign) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });

  const update: Record<string, unknown> = {};
  // 10/11: campañas por Wasender. El método se elige al crearla; acá se cambian su línea y su plantilla.
  if ((campaign as any).proveedor === "wasender") {
    const cambiaLinea = body?.wasender_line_id !== undefined;
    const cambiaRotar = typeof body?.wasender_rotar_inicio === "boolean";
    const cambiaPlantilla = body?.wasender_plantilla_id !== undefined || cambiaRotar;
    if (cambiaPlantilla && campaign.status === "en_curso") {
      return NextResponse.json({ error: "Pausá la campaña para cambiar la plantilla." }, { status: 409 });
    }
    const lineaId = cambiaLinea ? (body.wasender_line_id || null) : undefined;
    const plantillaId = cambiaPlantilla ? (body.wasender_rotar_inicio === true ? null : body.wasender_plantilla_id || null) : undefined;
    const problema = await validarEleccionWasender(AREA_TO_RUBRO_ID[campaign.area as string], { lineaId, plantillaId }, supabase);
    if (problema) return NextResponse.json({ error: problema }, { status: 400 });
    if (cambiaLinea) update.wasender_line_id = lineaId;
    if (cambiaPlantilla) update.wasender_plantilla_id = plantillaId;
    if (cambiaRotar) update.wasender_rotar_inicio = body.wasender_rotar_inicio;
  }
  if (body?.line_id !== undefined && (campaign as any).proveedor !== "wasender") {
    if (body.line_id === null || body.line_id === "") update.line_id = null;
    else {
      const { data: line } = await supabase.from("profile_lines").select("id, rubro_id, active").eq("id", body.line_id).maybeSingle();
      if (!line || line.rubro_id !== AREA_TO_RUBRO_ID[campaign.area as string]) {
        return NextResponse.json({ error: "La línea no pertenece al perfil de esta campaña." }, { status: 400 });
      }
      update.line_id = line.id;
    }
  }
  if (body?.run_days !== undefined) {
    const days = Array.isArray(body.run_days)
      ? Array.from(new Set(body.run_days.map(Number).filter((d: number) => Number.isInteger(d) && d >= 1 && d <= 6))).sort()
      : [];
    update.run_days = days.length > 0 && days.length < 6 ? days : null;
  }
  if (body?.template_id !== undefined && (campaign as any).proveedor !== "wasender") {
    if (campaign.status === "en_curso") {
      return NextResponse.json({ error: "Pausá la campaña para cambiar la plantilla." }, { status: 409 });
    }
    if (body.template_id === null || body.template_id === "") update.template_id = null;
    else {
      const lineId = (update.line_id !== undefined ? update.line_id : campaign.line_id) as string | null;
      if (!lineId) return NextResponse.json({ error: "Para elegir la plantilla, primero asigná la línea que envía." }, { status: 400 });
      const { data: assignment } = await supabase
        .from("template_assignments")
        .select("id, template:whatsapp_templates(id, name)")
        .eq("line_id", lineId)
        .eq("purpose", "campana")
        .eq("template_id", body.template_id)
        .eq("active", true)
        .maybeSingle();
      const tpl = (assignment as any)?.template;
      if (!tpl) return NextResponse.json({ error: "Esa plantilla no está asignada a la línea para campañas." }, { status: 400 });
      update.template_id = tpl.id;
      update.message_template_name = tpl.name;
    }
  }
  // 20/10: el límite diario se puede cambiar en cualquier estado, también en curso
  // (rige desde el próximo envío). Vacío = sin límite propio de la campaña (sigue el de la línea).
  if (body?.daily_send_limit !== undefined) {
    if (body.daily_send_limit === null || body.daily_send_limit === "") update.daily_send_limit = null;
    else {
      const n = Number(body.daily_send_limit);
      if (!Number.isInteger(n) || n < 1 || n > 1000) return NextResponse.json({ error: "El límite diario tiene que ser un número entero entre 1 y 1000." }, { status: 400 });
      update.daily_send_limit = n;
    }
  }
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nada para guardar" }, { status: 400 });

  const { error } = await supabase.from("campaigns").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from("ops_change_log").insert({
    actor: "panel",
    action: "configurar_campana",
    target: `campaigns:${params.id}`,
    before: {
      line_id: campaign.line_id,
      run_days: campaign.run_days,
      template_id: campaign.template_id,
      message_template_name: campaign.message_template_name,
      daily_send_limit: (campaign as any).daily_send_limit,
      ...((campaign as any).proveedor === "wasender"
        ? { wasender_line_id: (campaign as any).wasender_line_id, wasender_plantilla_id: (campaign as any).wasender_plantilla_id }
        : {}),
    },
    after: update,
  });
  return NextResponse.json({ ok: true });
}
