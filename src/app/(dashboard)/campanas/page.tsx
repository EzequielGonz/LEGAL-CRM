import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewCampaignForm } from "@/components/campanas/new-campaign-form";
import { DeleteCampaignButton } from "@/components/campanas/delete-campaign-button";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  borrador: "Borrador",
  en_curso: "En curso",
  pausada: "Pausada",
  finalizada: "Finalizada",
};

export default async function CampanasPage() {
  const supabase = createClient();

  const [{ data: campaigns }, { data: channels }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("*, campaign_contacts(status, contacts(status))")
      .order("created_at", { ascending: false }),
    supabase.from("channels").select("id, label").eq("area", "civil").eq("type", "whatsapp"),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Campañas</h1>
          <p className="text-sm text-slate-500">
            Inicio de conversaciones con bases cargadas — línea Civil.
          </p>
        </div>
        <NewCampaignForm channels={channels ?? []} />
      </div>

      <div className="space-y-3">
        {(campaigns ?? []).map((c: any) => {
          const total = c.campaign_contacts?.length ?? 0;
          const enviados = (c.campaign_contacts ?? []).filter((cc: any) =>
            ["enviado", "entregado", "leido", "respondio"].includes(cc.status)
          ).length;
          const respondieron = (c.campaign_contacts ?? []).filter(
            (cc: any) => cc.status === "respondio"
          ).length;
          const agendados = (c.campaign_contacts ?? []).filter((cc: any) =>
            ["agendado", "cerrado_ganado"].includes(cc.contacts?.status)
          ).length;

          return (
            <div
              key={c.id}
              className="card-lift flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 hover:border-gold-300"
            >
              <Link href={`/campanas/${c.id}`} className="block min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="font-medium text-slate-900">{c.name}</h3>
                  <span className="text-xs font-medium text-slate-500">
                    {STATUS_LABEL[c.status]}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {enviados}/{total} enviados · {respondieron} respondieron · {agendados} agendados ·
                  plantilla {c.message_template_name}
                </p>
              </Link>
              <DeleteCampaignButton campaignId={c.id} campaignName={c.name} />
            </div>
          );
        })}
        {(campaigns ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
            Todavía no creaste ninguna campaña.
          </p>
        )}
      </div>
    </div>
  );
}
