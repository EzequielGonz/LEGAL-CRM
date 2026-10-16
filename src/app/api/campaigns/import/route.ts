import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { importBase, RepeatedImportError } from "@/lib/bases/import";
import {
  attachRecipients,
  baseContacts,
  CAMPAIGN_STATES_ACCEPTING_RECIPIENTS,
  planRecipients,
} from "@/lib/campaign-recipients";
import { requireSession } from "@/lib/acceso/autorizacion";

export const maxDuration = 60;

/**
 * Camino anterior de "cargar un archivo dentro de una campaña". Se conserva
 * para no romper pantallas viejas abiertas, pero ya no tiene validación
 * propia (bloque 1.6, un solo flujo de importación): el archivo se importa
 * como una base con el importador común (`importBase`, mismas reglas que
 * Bases, PC y teléfono) y después sus contactos se suman a la campaña con
 * el criterio único de destinatarios (detenidos y ya contactados afuera).
 * Si ese mismo archivo ya se había importado, se reutiliza esa base en vez
 * de importarlo otra vez. No lanza la campaña ni envía: si la campaña está
 * en curso hay que pausarla antes.
 *
 * Las pantallas actuales usan /api/bases y /api/campaigns/[id]/agregar-base
 * por separado, para que agregar destinatarios sea una confirmación aparte.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { campaign_id, rows, file_name } = body as {
    campaign_id?: string;
    rows?: unknown;
    file_name?: string | null;
  };

  if (!campaign_id || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Faltan campaign_id o filas para importar" }, { status: 400 });
  }
  if (rows.length > 5000) {
    return NextResponse.json(
      { error: "Máximo 5000 filas por importación. Dividí el archivo en partes más chicas." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, name, area, status, archived_at")
    .eq("id", campaign_id)
    .single();
  if (!campaign) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
  if (campaign.archived_at) {
    return NextResponse.json({ error: "La campaña está archivada: recuperala antes de cargar contactos." }, { status: 409 });
  }
  if (!CAMPAIGN_STATES_ACCEPTING_RECIPIENTS.includes(campaign.status)) {
    return NextResponse.json(
      { error: "La campaña está en curso: pausala antes de cargar contactos, así nadie recibe mensajes sin confirmar." },
      { status: 409 }
    );
  }

  let baseId: string;
  let invalidos = 0;
  let filas = (rows as unknown[]).length;
  try {
    const summary = await importBase({
      area: campaign.area,
      name: `Carga en la campaña «${campaign.name}»`,
      sourceLabel: "Carga desde la campaña",
      fileName: file_name ?? null,
      rows: rows as Record<string, unknown>[],
    });
    baseId = summary.base_id;
    invalidos = summary.invalidos;
    filas = summary.total;
  } catch (err: any) {
    if (err instanceof RepeatedImportError) {
      baseId = err.previous.id;
    } else {
      return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
    }
  }

  try {
    const bc = await baseContacts(baseId);
    const plan = await planRecipients(bc.ids, {
      campaignId: campaign.id,
      includePreviouslyContacted: false,
      priority: bc.priority,
      filasSinContacto: bc.filasSinContacto,
    });
    const agregados = await attachRecipients(campaign.id, plan);
    return NextResponse.json({
      base_id: baseId,
      imported: filas - invalidos,
      skipped: invalidos || bc.filasSinContacto,
      agregados,
      yaContactados: plan.contactados_anteriormente,
      detenidos: plan.detenidos,
      yaEnCampana: plan.ya_en_campana,
    });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
