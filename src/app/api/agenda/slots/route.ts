import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/agenda";
import type { Area } from "@/lib/supabase/database.types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const area = searchParams.get("area") as Area | null;

  if (area !== "civil" && area !== "penal") {
    return NextResponse.json({ error: "Parámetro 'area' inválido" }, { status: 400 });
  }

  const slots = await getAvailableSlots(area, { limit: 30 });
  return NextResponse.json({ slots });
}
