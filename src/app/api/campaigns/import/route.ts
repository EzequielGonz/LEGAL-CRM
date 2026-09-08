import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findOrCreateContact } from "@/lib/contacts";

interface ImportRow {
  full_name?: string;
  phone: string;
}

/**
 * Recibe la base ya parseada en el cliente (papaparse) como JSON:
 * { campaign_id, contacts: [{ full_name, phone }, ...] }
 * Crea (o reutiliza) cada contacto con source='base_de_datos' y lo agrega
 * a la campaña como destinatario pendiente.
 */
export async function POST(request: Request) {
  const { campaign_id, contacts } = (await request.json()) as {
    campaign_id: string;
    contacts: ImportRow[];
  };

  if (!campaign_id || !Array.isArray(contacts) || contacts.length === 0) {
    return NextResponse.json({ error: "Faltan campaign_id o contactos" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaign_id)
    .single();

  if (!campaign) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });

  let imported = 0;
  let skipped = 0;

  for (const row of contacts) {
    const phone = row.phone?.trim();
    if (!phone) {
      skipped++;
      continue;
    }

    const { contact } = await findOrCreateContact({
      area: campaign.area,
      channelType: "whatsapp",
      externalUserId: phone,
      phone,
      fullName: row.full_name?.trim() || null,
      source: "base_de_datos",
      channelId: campaign.channel_id,
      campaignId: campaign.id,
    });

    await supabase
      .from("campaign_contacts")
      .upsert(
        { campaign_id: campaign.id, contact_id: contact.id, status: "pendiente" },
        { onConflict: "campaign_id,contact_id", ignoreDuplicates: true }
      );

    imported++;
  }

  return NextResponse.json({ imported, skipped });
}
