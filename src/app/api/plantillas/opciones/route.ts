import { NextResponse } from "next/server";
import { templateOptions } from "@/lib/plantillas";
import { purposeInfo, type TemplatePurpose } from "@/lib/plantillas/catalogo";

export const dynamic = "force-dynamic";

/** Plantillas asignadas a una línea para un propósito, con lo que impide usar cada una. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const lineId = url.searchParams.get("line_id") ?? "";
  const purpose = url.searchParams.get("purpose") ?? "campana";
  if (!lineId) return NextResponse.json({ opciones: [] });
  if (!purposeInfo(purpose)) return NextResponse.json({ error: "Propósito desconocido" }, { status: 400 });
  const opciones = await templateOptions(lineId, purpose as TemplatePurpose);
  return NextResponse.json({ opciones });
}
