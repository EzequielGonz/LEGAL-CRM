import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { cambiarAsignacion, editarItem, listarItems, resumenConocimiento, RUBROS_CONOCIMIENTO } from "@/lib/conocimiento/panel";
import type { RubroConocimiento } from "@/lib/conocimiento/seleccion";

export const dynamic = "force-dynamic";

/**
 * Conocimiento del bot por versiones (25/10).
 * GET  ?dias=14                         → versiones, versión vigente y comparación v1/v2 por perfil.
 * GET  ?items=1&perfil=<slug>&version=2 → contenido de la versión para ese perfil.
 * POST { accion: "asignar", perfil, version, comparar_con?, porcentaje? } → cambia la versión que rige.
 * POST { accion: "editar", version, clave, contenido?, activo? }          → edita un ítem.
 * Ningún cambio envía mensajes ni toca campañas; todo queda en el historial de cambios.
 */
function perfilDe(v: unknown): RubroConocimiento | null {
  return typeof v === "string" && (RUBROS_CONOCIMIENTO as string[]).includes(v) ? (v as RubroConocimiento) : null;
}

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  try {
    if (url.searchParams.get("items")) {
      const perfil = perfilDe(url.searchParams.get("perfil"));
      if (!perfil) return NextResponse.json({ error: "Perfil no válido" }, { status: 400 });
      const version = Number(url.searchParams.get("version") ?? 2) === 1 ? 1 : 2;
      return NextResponse.json({ items: await listarItems(version, perfil) });
    }
    const dias = Number(url.searchParams.get("dias") ?? 14) || 14;
    return NextResponse.json(await resumenConocimiento(dias));
  } catch (err) {
    console.error("[conocimiento]", err);
    return NextResponse.json({ error: "No se pudo leer el conocimiento del bot." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null);
  try {
    if (body?.accion === "asignar") {
      const perfil = perfilDe(body?.perfil);
      if (!perfil) return NextResponse.json({ error: "Perfil no válido" }, { status: 400 });
      const r = await cambiarAsignacion(
        perfil,
        { version: Number(body?.version), comparar_con: body?.comparar_con == null ? null : Number(body.comparar_con), porcentaje: Number(body?.porcentaje ?? 50) },
        "panel"
      );
      return NextResponse.json({ ok: true, asignacion: r });
    }
    if (body?.accion === "editar") {
      if (typeof body?.clave !== "string") return NextResponse.json({ error: "Falta el ítem." }, { status: 400 });
      const version = Number(body?.version) === 1 ? 1 : 2;
      return NextResponse.json(await editarItem(version, body.clave, { contenido: body?.contenido, activo: body?.activo }, "panel"));
    }
    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String((err as Error)?.message ?? err).slice(0, 300) }, { status: 400 });
  }
}
