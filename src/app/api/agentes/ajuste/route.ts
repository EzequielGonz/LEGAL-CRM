import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { confirmPin } from "@/lib/acceso/confirmar-pin";
import { autorizarTrabajoAjuste, prepararTrabajoAjuste } from "@/lib/agentes/servicio";
import { configuracionVertex } from "@/lib/agentes/modelo";
import { createAdminClient } from "@/lib/supabase/admin";
import { responderError } from "../_comun";

export const dynamic = "force-dynamic";

/**
 * Trabajos de ajuste (fine tuning) trazables.
 * GET → trabajos y si Vertex está configurado (sin valores).
 * POST { accion: "preparar", setId, objetivo, modeloBase, estimacionUsd? } → estado «preparado» (no gasta).
 * POST { accion: "autorizar", jobId, limiteUsd, pin } → «autorizado» con PIN y límite de gasto.
 * El envío real al proveedor (incremento 3C) solo parte de un trabajo autorizado y queda fuera de esta entrega.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const { data } = await createAdminClient().from("tuning_jobs").select("*").order("created_at", { ascending: false }).limit(20);
  return NextResponse.json({ trabajos: data ?? [], vertex: configuracionVertex() });
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  try {
    if (body?.accion === "preparar") {
      const t = await prepararTrabajoAjuste({ setId: String(body?.setId ?? ""), objetivo: String(body?.objetivo ?? "").slice(0, 300) || "Ajuste del principal", modeloBase: String(body?.modeloBase ?? "gemini-2.5-flash"), estimacionUsd: Number(body?.estimacionUsd) || undefined, region: typeof body?.region === "string" ? body.region : undefined });
      return NextResponse.json({ ok: true, trabajo: t });
    }
    if (body?.accion === "autorizar") {
      if (!(Number(body?.limiteUsd) > 0)) return NextResponse.json({ error: "Indicá un límite de gasto mayor a cero." }, { status: 400 });
      const pin = await confirmPin(request, body?.pin, "ajuste_autorizado", { jobId: body?.jobId, limiteUsd: body?.limiteUsd });
      if (!pin.ok) return NextResponse.json({ error: pin.error }, { status: pin.status });
      const t = await autorizarTrabajoAjuste({ jobId: String(body?.jobId ?? ""), limiteUsd: Number(body?.limiteUsd), actor: "responsable" });
      return NextResponse.json({ ok: true, trabajo: t });
    }
    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  } catch (err) {
    return responderError(err);
  }
}
