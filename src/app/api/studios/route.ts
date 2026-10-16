import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/acceso/autorizacion";

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json();
  const supabase = createAdminClient();

  const { error } = await supabase.from("studios").insert({
    name: body.name,
    area: body.area,
    contact_phone: body.contact_phone || null,
    contact_email: body.contact_email || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
