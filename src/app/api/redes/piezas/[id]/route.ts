import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { createAdminClient } from "@/lib/supabase/admin";
import { politica } from "@/lib/contenido/cola";
import { borrarEnMetricool } from "@/lib/redes/metricool";

export const dynamic = "force-dynamic";

/**
 * Cancelar una publicación que todavía no salió (18/10). No se borra: queda
 * «cancelada» con su historial. Si ya estaba programada en Metricool, se
 * borra también allá.
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return NextResponse.json({ error: "Pieza no válida." }, { status: 400 });
  const s = createAdminClient();
  const { data: p } = await s.from("content_pieces").select("id, rubro_id, canal, estado, proveedor, proveedor_id").eq("id", params.id).maybeSingle();
  if (!p) return NextResponse.json({ error: "No existe." }, { status: 404 });
  if (["publicada", "publicando", "cancelada"].includes(p.estado)) return NextResponse.json({ error: "Esta pieza ya no se puede cancelar." }, { status: 409 });
  let enMetricool: boolean | null = null;
  if (p.proveedor === "metricool" && p.proveedor_id) {
    const pol = await politica(p.rubro_id, p.canal);
    enMetricool = pol.destino_ref ? await borrarEnMetricool(pol.destino_ref, p.proveedor_id) : false;
  }
  const motivo = enMetricool === false ? "Cancelada en el panel. No se pudo borrar en Metricool: borrala también allá." : "Cancelada desde el panel";
  await s.from("content_pieces").update({ estado: "cancelada", motivo, updated_at: new Date().toISOString() }).eq("id", p.id);
  return NextResponse.json({ ok: true, metricool: enMetricool });
}
