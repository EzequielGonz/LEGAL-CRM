import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, { params }: { params: { area: string } }) {
  if (params.area !== "civil" && params.area !== "penal") {
    return NextResponse.json({ error: "Área inválida" }, { status: 400 });
  }

  const body = await request.json();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("ai_agents")
    .update({
      system_prompt: body.system_prompt,
      qualification_criteria: body.qualification_criteria,
      required_fields: body.required_fields,
      active: body.active,
      updated_at: new Date().toISOString(),
    })
    .eq("area", params.area);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
