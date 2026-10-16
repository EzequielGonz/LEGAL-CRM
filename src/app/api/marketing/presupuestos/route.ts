import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { confirmPin } from "@/lib/acceso/confirmar-pin";
import { createAdminClient } from "@/lib/supabase/admin";
import { aprobarPresupuesto, cargarYEnviarPresupuesto, PresupuestoError, urlSubidaPresupuesto } from "@/lib/marketing/presupuestos";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Pide presupuesto (Marketing).
 * POST { accion: "subida", budgetId, nombre } → enlace firmado para subir el archivo.
 * POST { accion: "enviar", budgetId, path, nombre, mime, monto?, moneda?, alcance?, plazo?, notas?, pin }
 *   → guarda y envía (ventana abierta) o avisa con la plantilla. Con PIN: sale un mensaje.
 * POST { accion: "resultado", budgetId, estado: aprobado|rechazado|sin_respuesta|anulado, detalle? } → registro manual.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  const budgetId = typeof body?.budgetId === "string" ? body.budgetId : "";
  if (!/^[0-9a-f-]{36}$/i.test(budgetId)) return NextResponse.json({ error: "Presupuesto inválido." }, { status: 400 });
  try {
    if (body.accion === "subida") {
      return NextResponse.json(await urlSubidaPresupuesto(budgetId, String(body?.nombre ?? "presupuesto.pdf")));
    }
    if (body.accion === "enviar") {
      const pin = await confirmPin(request, body?.pin, "presupuesto" as any, { budgetId });
      if (!pin.ok) return NextResponse.json({ error: pin.error }, { status: pin.status });
      const monto = typeof body?.monto === "number" && body.monto >= 0 ? body.monto : null;
      const moneda = body?.moneda === "ARS" || body?.moneda === "USD" ? body.moneda : null;
      const r = await cargarYEnviarPresupuesto({
        budgetId,
        archivoPath: String(body?.path ?? ""),
        archivoNombre: String(body?.nombre ?? "presupuesto.pdf"),
        archivoMime: typeof body?.mime === "string" ? body.mime : null,
        monto,
        moneda,
        alcance: typeof body?.alcance === "string" ? body.alcance : null,
        plazo: typeof body?.plazo === "string" ? body.plazo : null,
        notas: typeof body?.notas === "string" ? body.notas : null,
      });
      return NextResponse.json(r);
    }
    if (body.accion === "resultado") {
      const estado = String(body?.estado ?? "");
      if (!["aprobado", "rechazado", "sin_respuesta", "anulado"].includes(estado)) return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
      const s = createAdminClient();
      const { data: b } = await s.from("marketing_budgets").update({ estado, respuesta_at: new Date().toISOString(), resultado_detalle: typeof body?.detalle === "string" ? body.detalle.slice(0, 1000) : null, updated_at: new Date().toISOString() }).eq("id", budgetId).select("contact_id").maybeSingle();
      if (b && estado === "aprobado") await aprobarPresupuesto({ contactId: (b as any).contact_id, evidencia: "Aprobado (registrado a mano en el panel)" });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Acción desconocida." }, { status: 400 });
  } catch (err: any) {
    const status = err instanceof PresupuestoError ? err.status : 500;
    return NextResponse.json({ error: String(err?.message ?? err) }, { status });
  }
}
