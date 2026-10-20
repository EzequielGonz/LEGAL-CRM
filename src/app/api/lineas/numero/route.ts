import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { createAdminClient } from "@/lib/supabase/admin";
import { ejecutarPasoNumero, esAccionNumero, esIdNumero, listarNumerosDeCuenta } from "@/lib/whatsapp/verificar-numero";

export const dynamic = "force-dynamic";

async function claveDeLinea(lineId: unknown): Promise<{ clave: string; etiqueta: string } | null> {
  if (typeof lineId !== "string" || !/^[0-9a-f-]{36}$/i.test(lineId)) return null;
  const { data } = await createAdminClient().from("profile_lines").select("credential_key, label, active").eq("id", lineId).maybeSingle();
  if (!data || !data.active || typeof data.credential_key !== "string") return null;
  return { clave: data.credential_key, etiqueta: String(data.label ?? "") };
}

/**
 * Números que Meta informa para la cuenta de WhatsApp Business de una línea
 * (solo lectura), con una marca en el que la línea tiene cargado hoy.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const linea = await claveDeLinea(new URL(request.url).searchParams.get("line_id"));
  if (!linea) return NextResponse.json({ error: "Línea no encontrada." }, { status: 404 });
  const r = await listarNumerosDeCuenta(linea.clave);
  if (!r.ok) return NextResponse.json({ error: r.mensaje }, { status: 502 });
  const cargado = process.env[`${linea.clave}_PHONE_NUMBER_ID`]?.trim() ?? null;
  return NextResponse.json({
    variable: `${linea.clave}_PHONE_NUMBER_ID`,
    numeros: (r.datos ?? []).map((n) => ({ ...n, esElDeLaLinea: cargado === n.id })),
    hayCargado: !!cargado,
  });
}

/**
 * Un paso para verificar y registrar un número de la cuenta de la línea.
 * body: { line_id, numero_id, accion: "pedir_codigo" | "verificar" | "registrar", metodo?, codigo?, pin? }.
 * El código y el PIN no se guardan ni se registran. No envía mensajes a personas.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const linea = await claveDeLinea(body?.line_id);
  if (!linea) return NextResponse.json({ error: "Línea no encontrada." }, { status: 404 });
  if (!esAccionNumero(body?.accion) || !esIdNumero(body?.numero_id)) return NextResponse.json({ error: "Pedido no válido." }, { status: 400 });

  const r = await ejecutarPasoNumero(linea.clave, { accion: body.accion, numeroId: body.numero_id, metodo: body.metodo, codigo: body.codigo, pin: body.pin });
  await createAdminClient()
    .from("ops_change_log")
    .insert({
      actor: "panel",
      action: "verificar_numero_whatsapp",
      target: `profile_lines:${linea.etiqueta}`,
      before: null,
      after: { paso: body.accion, resultado: r.ok ? "ok" : "error", http: r.http ?? null },
    })
    .then(() => {}, () => {});
  return NextResponse.json({ ok: r.ok, mensaje: r.mensaje }, { status: r.ok ? 200 : 400 });
}
