"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CAMPAIGN_STATUS_LABEL } from "@/lib/campaign-status";

interface PlanSummary {
  candidatos: number;
  elegibles: number;
  detenidos: number;
  contactados_anteriormente: number;
  contactados_incluidos: number;
  ya_en_campana: number;
  filas_sin_contacto: number;
}

interface CampaignInfo {
  id: string;
  name: string;
  status: string;
  area: string;
  archived: boolean;
  template: string | null;
  profile_name: string | null;
  channel_label: string | null;
  line_label: string | null;
}

/**
 * Confirmación aparte para sumar a una campaña los contactos de una base
 * ya guardada (bloques 1.6 y 1.9). Muestra perfil, canal, línea, estado de
 * la campaña y cuántos entran o quedan afuera (detenidos, ya contactados,
 * ya en la campaña) antes de confirmar. Agregar no lanza la campaña.
 */
export function AddBaseToCampaign({
  baseId,
  campaignId,
  onAdded,
}: {
  baseId: string;
  campaignId: string;
  onAdded?: (agregados: number) => void;
}) {
  const router = useRouter();
  const [includePrev, setIncludePrev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<PlanSummary | null>(null);
  const [campaign, setCampaign] = useState<CampaignInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<number | null>(null);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base_id: baseId, campaign_id: campaignId, include_previously_contacted: includePrev }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "No se pudo calcular la vista previa");
      setPlan(data.plan);
      setCampaign(data.campaign);
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  }, [baseId, campaignId, includePrev]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  async function confirm() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/agregar-base`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base_id: baseId, include_previously_contacted: includePrev }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "No se pudieron agregar los contactos");
      setDone(data.agregados ?? 0);
      onAdded?.(data.agregados ?? 0);
      router.refresh();
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setSaving(false);
    }
  }

  if (done !== null) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        {done} contactos agregados a la campaña «{campaign?.name}» como pendientes. La campaña no se lanzó: sigue{" "}
        {campaign ? (CAMPAIGN_STATUS_LABEL[campaign.status] ?? campaign.status).toLowerCase() : "como estaba"} hasta que la lances a mano.
      </div>
    );
  }

  const running = campaign?.status === "en_curso";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
      <p className="mb-2 font-medium text-slate-800">Agregar los contactos de esta base a la campaña</p>
      {campaign && (
        <dl className="mb-3 grid grid-cols-1 gap-x-4 gap-y-1 text-xs text-slate-600 sm:grid-cols-2">
          <div>
            <dt className="inline text-slate-400">Perfil: </dt>
            <dd className="inline">{campaign.profile_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="inline text-slate-400">Campaña: </dt>
            <dd className="inline">
              {campaign.name} ({CAMPAIGN_STATUS_LABEL[campaign.status] ?? campaign.status})
            </dd>
          </div>
          <div>
            <dt className="inline text-slate-400">Canal: </dt>
            <dd className="inline">{campaign.channel_label ?? "—"}</dd>
          </div>
          <div>
            <dt className="inline text-slate-400">Línea: </dt>
            <dd className="inline">{campaign.line_label ?? "Sin línea asignada (no se podrá lanzar hasta asignarla)"}</dd>
          </div>
        </dl>
      )}
      {loading && <p className="text-xs text-slate-400">Calculando…</p>}
      {plan && !loading && (
        <ul className="mb-3 space-y-1 text-xs text-slate-700">
          <li>
            <span className="font-semibold text-slate-900">{plan.elegibles}</span> contactos entrarían como pendientes
          </li>
          <li>{plan.detenidos} detenidos: no entran</li>
          <li>
            {plan.contactados_anteriormente} ya contactados antes{" "}
            {includePrev ? "(incluidos por decisión explícita)" : "(no entran)"}
          </li>
          <li>{plan.ya_en_campana} ya estaban en esta campaña</li>
          {plan.filas_sin_contacto > 0 && <li>{plan.filas_sin_contacto} filas sin teléfono utilizable</li>}
        </ul>
      )}
      {plan && plan.contactados_anteriormente > 0 && (
        <label className="mb-3 flex items-start gap-2 text-xs text-amber-800">
          <input type="checkbox" checked={includePrev} onChange={(e) => setIncludePrev(e.target.checked)} className="mt-0.5" />
          <span>
            Incluir también a los {plan.contactados_anteriormente} que ya fueron contactados. Volver a escribirles no es un recontacto
            automático: queda registrado como decisión de esta carga.
          </span>
        </label>
      )}
      {running && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          La campaña está en curso: pausala antes de agregar contactos.
        </p>
      )}
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <button
        type="button"
        onClick={confirm}
        disabled={saving || loading || !plan || plan.elegibles === 0 || running || campaign?.archived}
        className="btn-gold"
      >
        {saving ? "Agregando…" : `Confirmar: agregar ${plan?.elegibles ?? 0} a la campaña (no la lanza)`}
      </button>
    </div>
  );
}
