import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findOrCreateContact } from "@/lib/contacts";

interface ImportRow {
  // Puede llegar string o number (Excel manda números "crudos" cuando la
  // columna no está formateada como texto), por eso el tipo amplio acá y la
  // conversión explícita con String(...) más abajo antes de usarlos.
  full_name?: string | number | null;
  phone: string | number | null;
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
    // Puede llegar un número de JS en vez de string (ej: Excel con la
    // columna de teléfono sin formato de texto), así que convertimos con
    // String(...) antes de cualquier .trim() para no romper con eso.
    const phone = row.phone != null ? String(row.phone).trim() : "";
    if (!phone) {
      skipped++;
      continue;
    }

    const fullNameRaw = row.full_name != null ? String(row.full_name).trim() : "";

    const { contact } = await findOrCreateContact({
      area: campaign.area,
      channelType: "whatsapp",
      externalUserId: phone,
      phone,
      fullName: fullNameRaw || null,
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
