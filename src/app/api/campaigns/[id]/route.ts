import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Borra una campaña. Por el esquema de la base (`campaign_contacts.campaign_id
 * references campaigns(id) on delete cascade`), esto también borra solo,
 * automáticamente, todos los destinatarios asociados a esa campaña — no
 * hace falta ningún paso extra.
 */
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("campaigns").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
