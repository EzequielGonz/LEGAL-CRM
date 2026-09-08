import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { ai_enabled } = await request.json();
  const supabase = createAdminClient();

  await supabase
    .from("conversations")
    .update({
      ai_enabled: Boolean(ai_enabled),
      status: ai_enabled ? "en_conversacion" : "requiere_atencion_humana",
    })
    .eq("id", params.id);

  return NextResponse.json({ ok: true });
}
