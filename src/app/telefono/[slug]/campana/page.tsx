import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PhoneHeader } from "@/components/telefono/phone-header";
import { PhoneCampaignFlow } from "@/components/telefono/phone-campaign-flow";
import { phoneProfile } from "@/lib/telefono";

export const dynamic = "force-dynamic";

/**
 * Iniciar campaña desde el teléfono (doc. 1, 3.1 · bloque 1.9): elegir el
 * archivo del dispositivo, ver la misma validación que en PC, guardar la
 * base, elegir campaña y línea y confirmar. Cargar no envía: solo la
 * confirmación final inicia, y solo si la campaña está lista.
 */
export default async function TelefonoCampanaPage({ params }: { params: { slug: string } }) {
  const profile = phoneProfile(params.slug);
  if (!profile) notFound();
  const supabase = createClient();
  const areas = profile.areas.map((a) => a.value);
  const [{ data: rubro }, { data: campaigns }, { data: channels }, { data: lines }] = await Promise.all([
    supabase.from("rubros").select("name").eq("id", profile.rubroId).maybeSingle(),
    supabase
      .from("campaigns")
      .select("id, name, status, area, line_id, message_template_name, channels(label)")
      .in("area", areas)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("channels").select("id, label, area").in("area", areas).eq("type", "whatsapp"),
    supabase
      .from("profile_lines")
      .select("id, label, phone_display")
      .eq("rubro_id", profile.rubroId)
      .eq("active", true)
      .eq("use_for_campaigns", true)
      .order("created_at"),
  ]);
  const lineLabel = new Map((lines ?? []).map((l: any) => [l.id, `${l.label}${l.phone_display ? ` (${l.phone_display})` : ""}`]));

  return (
    <div>
      <PhoneHeader eyebrow={rubro?.name ?? params.slug} title="Iniciar campaña" backHref="/telefono" />
      <main className="mx-auto max-w-md px-4 py-5">
        <PhoneCampaignFlow
          areas={profile.areas}
          basesPath={profile.basesPath}
          campaigns={(campaigns ?? []).map((c: any) => ({
            id: c.id,
            name: c.name,
            status: c.status,
            area: c.area,
            line_label: c.line_id ? lineLabel.get(c.line_id) ?? "Línea asignada" : null,
            channel_label: c.channels?.label ?? null,
            template: c.message_template_name ?? null,
          }))}
          channels={(channels ?? []) as any}
          lines={(lines ?? []).map((l: any) => ({ id: l.id, label: lineLabel.get(l.id) ?? l.label }))}
        />
      </main>
    </div>
  );
}
