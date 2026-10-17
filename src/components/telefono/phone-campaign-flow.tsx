"use client";

import { useCallback, useEffect, useState } from "react";
import { ImportFlow, type AreaOption } from "@/components/bases/import-flow";
import { AddBaseToCampaign } from "@/components/campanas/add-base-to-campaign";
import { CAMPAIGN_STATUS_LABEL } from "@/lib/campaign-status";
import { TemplatePicker } from "@/components/plantillas/template-picker";

interface CampaignOption {
  id: string;
  name: string;
  status: string;
  area: string;
  line_label: string | null;
  channel_label: string | null;
  template: string | null;
}

/**
 * Recorrido de "Iniciar campaña" en el teléfono: cargar → revisar → elegir
 * campaña (o crear una en borrador) → agregar destinatarios → confirmar el
 * inicio. Cada paso es una acción aparte; solo el último inicia envíos, y
 * solo si la campaña tiene todo lo necesario.
 */
export function PhoneCampaignFlow({
  areas,
  basesPath,
  campaigns,
  channels,
  lines,
}: {
  areas: AreaOption[];
  basesPath: string;
  campaigns: CampaignOption[];
  channels: { id: string; label: string; area: string }[];
  lines: { id: string; label: string }[];
}) {
  return (
    <ImportFlow
      areas={areas}
      basesPath={basesPath}
      startOpen
      compact
      after={(summary) => (
        <CampaignStep
          baseId={summary.base_id}
          area={summary.area}
          campaigns={campaigns.filter((c) => c.area === summary.area)}
          channels={channels.filter((c) => c.area === summary.area)}
          lines={lines}
        />
      )}
    />
  );
}

function CampaignStep({
  baseId,
  area,
  campaigns,
  channels,
  lines,
}: {
  baseId: string;
  area: string;
  campaigns: CampaignOption[];
  channels: { id: string; label: string }[];
  lines: { id: string; label: string }[];
}) {
  const available = campaigns.filter((c) => c.status !== "en_curso");
  const [choice, setChoice] = useState<string>(available[0]?.id ?? "nueva");
  const [confirmedCampaign, setConfirmedCampaign] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [channelId, setChannelId] = useState(channels[0]?.id ?? "");
  const [lineId, setLineId] = useState(lines.length === 1 ? lines[0].id : "");
  const [template, setTemplate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; elegibles: number; detenidos: number; contactados: number } | null>(null);

  async function crear() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          channel_id: channelId,
          line_id: lineId || null,
          template_id: template || null,
          base_id: baseId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.campaign) throw new Error(data.error ?? "No se pudo crear la campaña");
      if (data.warning) setError(data.warning);
      setCreated({
        id: data.campaign.id,
        elegibles: data.destinatarios?.elegibles ?? 0,
        detenidos: data.destinatarios?.detenidos ?? 0,
        contactados: data.destinatarios?.contactados_anteriormente ?? 0,
      });
      setConfirmedCampaign(data.campaign.id);
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setBusy(false);
    }
  }

  const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold";

  if (confirmedCampaign) {
    return (
      <div className="space-y-4">
        {created && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            Campaña creada en borrador con {created.elegibles} destinatarios ({created.detenidos} detenidos y {created.contactados} ya
            contactados quedaron afuera). Todavía no se envió nada.
          </div>
        )}
        <LaunchStep campaignId={confirmedCampaign} />
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 text-sm">
      <p className="font-medium text-slate-800">¿En qué campaña se usa esta base?</p>
      <div className="space-y-2">
        {available.map((c) => (
          <label key={c.id} className="flex items-start gap-2 rounded-lg border border-slate-200 p-2">
            <input type="radio" checked={choice === c.id} onChange={() => setChoice(c.id)} className="mt-1" />
            <span>
              <span className="font-medium text-slate-800">{c.name}</span>
              <span className="block text-xs text-slate-500">
                {CAMPAIGN_STATUS_LABEL[c.status] ?? c.status} · {c.channel_label ?? "sin canal"} · {c.line_label ?? "sin línea asignada"}
              </span>
            </span>
          </label>
        ))}
        {campaigns.some((c) => c.status === "en_curso") && (
          <p className="text-xs text-slate-400">Las campañas en curso no aparecen: hay que pausarlas antes de sumar contactos.</p>
        )}
        <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-2">
          <input type="radio" checked={choice === "nueva"} onChange={() => setChoice("nueva")} className="mt-1" />
          <span className="font-medium text-slate-800">Crear una campaña nueva (queda en borrador)</span>
        </label>
      </div>

      {choice === "nueva" ? (
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la campaña" className={inputCls} />
          <select value={channelId} onChange={(e) => setChannelId(e.target.value)} className={inputCls}>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={lineId}
            onChange={(e) => {
              setLineId(e.target.value);
              setTemplate("");
            }}
            className={inputCls}
          >
            <option value="">Línea: asignar después</option>
            {lines.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
          <TemplatePicker lineId={lineId || null} value={template} onChange={setTemplate} className={inputCls} />
          {channels.length === 0 && <p className="text-xs text-red-600">Este perfil no tiene canal de WhatsApp cargado.</p>}
          <button
            type="button"
            onClick={crear}
            disabled={busy || !name.trim() || !channelId}
            className="btn-gold w-full"
          >
            {busy ? "Creando…" : "Crear campaña con esta base (no envía)"}
          </button>
        </div>
      ) : (
        <AddBaseToCampaign baseId={baseId} campaignId={choice} onAdded={() => setConfirmedCampaign(choice)} />
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-[11px] text-slate-400">Área: {area}</p>
    </div>
  );
}

/** Confirmación final: muestra qué falta y solo deja iniciar si la campaña está lista. */
function LaunchStep({ campaignId }: { campaignId: string }) {
  const [prep, setPrep] = useState<{ ready: boolean; missing: string[]; pausa_general: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/campaigns/${campaignId}/preparacion`, { cache: "no-store" });
    if (res.ok) setPrep(await res.json());
  }, [campaignId]);
  useEffect(() => {
    load();
  }, [load]);

  async function iniciar() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/launch`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) setMsg({ ok: false, text: data.error ?? "No se pudo iniciar" });
      else setMsg({ ok: true, text: "Campaña iniciada. Los envíos siguen solos con el ritmo configurado." });
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm">
      <p className="font-medium text-slate-900">Iniciar la campaña</p>
      <p className="text-sm text-slate-700">Al confirmar empiezan a salir mensajes reales por WhatsApp. Lo enviado no se puede deshacer; se puede pausar desde la computadora.</p>
      {!prep && <p role="status" className="text-sm text-slate-700">Revisando…</p>}
      {prep && prep.pausa_general && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          La pausa general está activa: no se inicia ninguna campaña hasta levantarla desde Configuración.
        </p>
      )}
      {prep && prep.missing.length > 0 && (
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <p className="mb-1 font-medium">Falta para poder iniciarla:</p>
          <ul className="list-disc pl-4">
            {prep.missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}
      <button type="button" onClick={iniciar} disabled={busy || !prep?.ready} className="btn-gold w-full">
        {busy ? "Iniciando…" : "Confirmar e iniciar campaña"}
      </button>
      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-emerald-700" : "font-medium text-red-700"}`}>{msg.text}</p>}
    </div>
  );
}
