import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * «Pedir mejora»: pedidos en lenguaje natural sobre un agente. Quedan
 * registrados para que una persona los convierta en una versión nueva;
 * no cambian al agente por sí solos. GET → lista. POST { clave, pedido }.
 * PATCH { id, estado, resolucion? }.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const { data } = await createAdminClient().from("agent_requests").select("*").order("created_at", { ascending: false }).limit(100);
  return NextResponse.json({ pedidos: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const pedido = typeof body?.pedido === "string" ? body.pedido.trim().slice(0, 2000) : "";
  if (pedido.length < 3) return NextResponse.json({ error: "Escribí qué querés mejorar." }, { status: 400 });
  const { data, error } = await createAdminClient().from("agent_requests").insert({ agente_clave: String(body?.clave ?? "principal"), pedido }).select("*").single();
  if (error) return NextResponse.json({ error: "No se pudo registrar el pedido." }, { status: 500 });
  return NextResponse.json({ ok: true, pedido: data });
}

export async function PATCH(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  if (!["pendiente", "en_curso", "resuelto", "descartado"].includes(body?.estado)) return NextResponse.json({ error: "Estado no válido." }, { status: 400 });
  const { error } = await createAdminClient().from("agent_requests").update({ estado: body.estado, resolucion: typeof body?.resolucion === "string" ? body.resolucion.slice(0, 1000) : null, updated_at: new Date().toISOString() }).eq("id", String(body?.id ?? ""));
  if (error) return NextResponse.json({ error: "No se pudo actualizar." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
