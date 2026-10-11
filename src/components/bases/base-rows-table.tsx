"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { SendLimitsFields } from "@/components/campanas/send-limits-fields";
import { TemplatePicker } from "@/components/plantillas/template-picker";

export interface BaseRowItem {
  id: string;
  row_number: number;
  status: "creado" | "duplicado" | "invalido";
  error: string | null;
  contact_id: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  /** tipo de coincidencia ya traducido (null en bases importadas antes del diagnóstico) */
  match_label: string | null;
  previously_contacted: boolean | null;
  /** fecha, campaña y línea del contacto anterior, ya en texto */
  previous_label: string | null;
  detained_label: string | null;
  conflict: string | null;
}

interface PlanSummary {
  candidatos: number;
  elegibles: number;
  detenidos: number;
  contactados_anteriormente: number;
  contactados_incluidos: number;
  ya_en_campana: number;
  filas_sin_contacto: number;
}

const STATUS_LABEL: Record<string, string> = {
  creado: "Nuevo contacto",
  duplicado: "Ya existía",
  invalido: "Requiere corrección",
};
const STATUS_COLOR: Record<string, string> = {
  creado: "text-green-600",
  duplicado: "text-slate-500",
  invalido: "text-red-600",
};

/**
 * Filas procesadas de una base (la página actual), con sus marcas:
 * coincidencia, contactado anteriormente, detención y conflicto. Desde acá
 * se prepara una campaña con toda la base o con las filas elegidas; la
 * campaña se crea en borrador y no envía nada hasta lanzarla.
 */
export function BaseRowsTable({
  rows,
  baseId,
  baseContactCount,
  channels,
  lines = [],
  redirectBase = "/campanas",
  fichaHref = null,
}: {
  rows: BaseRowItem[];
  baseId: string;
  /** contactos distintos de toda la base (todas las páginas) */
  baseContactCount: number;
  channels: { id: string; label: string }[];
  lines?: { id: string; label: string }[];
  /** Base de la URL a la que navegar después de crear la campaña, seguida de "/<id>". */
  redirectBase?: string;
  /** ficha del contacto: "{id}" se reemplaza por el contacto (misma ficha que en las demás vistas) */
  fichaHref?: string | null;
}) {
  const router = useRouter();
  const selectable = useMemo(() => rows.filter((r) => r.contact_id), [rows]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [scope, setScope] = useState<"base" | "seleccion">("base");
  const [includePrev, setIncludePrev] = useState(false);
  const [plan, setPlan] = useState<PlanSummary | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [channelId, setChannelId] = useState(channels[0]?.id ?? "");
  const [lineId, setLineId] = useState(lines.length === 1 ? lines[0].id : "");
  const [template, setTemplate] = useState("");
  const [minDelaySeconds, setMinDelaySeconds] = useState(50);
  const [maxDelaySeconds, setMaxDelaySeconds] = useState(200);
  const [batchSize, setBatchSize] = useState(10);
  const [batchPauseSeconds, setBatchPauseSeconds] = useState(300);
  const [dailyLimit, setDailyLimit] = useState<number | "">("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected = selectable.length > 0 && selectable.every((r) => selected.has(r.contact_id!));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) selectable.forEach((r) => next.delete(r.contact_id!));
      else selectable.forEach((r) => next.add(r.contact_id!));
      return next;
    });
  }

  function toggleOne(contactId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) next.delete(contactId);
      else next.add(contactId);
      return next;
    });
  }

  const target = useMemo(
    () => (scope === "base" ? { base_id: baseId } : { contact_ids: Array.from(selected) }),
    [scope, baseId, selected]
  );

  const loadPlan = useCallback(async () => {
    if (scope === "seleccion" && selected.size === 0) {
      setPlan(null);
      return;
    }
    setPlanLoading(true);
    try {
      const res = await fetch("/api/campaigns/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...target, include_previously_contacted: includePrev }),
      });
      const data = await res.json().catch(() => ({}));
      setPlan(res.ok ? data.plan : null);
      if (!res.ok) setError(data.error ?? "No se pudo calcular cuántos entran");
    } finally {
      setPlanLoading(false);
    }
  }, [target, includePrev, scope, selected.size]);

  useEffect(() => {
    if (showCampaignForm) loadPlan();
  }, [showCampaignForm, loadPlan]);

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: campaignName,
        channel_id: channelId,
        line_id: lineId || null,
        template_id: template || null,
        min_send_delay_seconds: minDelaySeconds,
        max_send_delay_seconds: maxDelaySeconds,
        batch_size: batchSize,
        batch_pause_seconds: batchPauseSeconds,
        daily_send_limit: dailyLimit === "" ? null : dailyLimit,
        include_previously_contacted: includePrev,
        ...target,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setCreating(false);
    if (!res.ok || !data.campaign) {
      setError(data.error ?? "No se pudo crear la campaña.");
      return;
    }
    if (data.warning) setError(data.warning);
    router.push(`${redirectBase}/${data.campaign.id}`);
  }

  const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold";

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={selectable.length === 0} />
          Seleccionar los contactos de esta página ({selectable.length})
          {selected.size > 0 && <span className="text-xs text-slate-400">· {selected.size} seleccionados</span>}
        </label>
        <button
          onClick={() => {
            setScope(selected.size > 0 ? "seleccion" : "base");
            setShowCampaignForm(true);
          }}
          className="btn-gold"
        >
          Preparar campaña con esta base
        </button>
      </div>

      {showCampaignForm && (
        <form onSubmit={handleCreateCampaign} className="mb-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" checked={scope === "base"} onChange={() => setScope("base")} />
              Toda la base ({baseContactCount} contactos)
            </label>
            <label className={clsx("flex items-center gap-2", selected.size === 0 && "text-slate-300")}>
              <input type="radio" checked={scope === "seleccion"} onChange={() => setScope("seleccion")} disabled={selected.size === 0} />
              Solo los seleccionados ({selected.size})
            </label>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
            {planLoading && <p className="text-slate-400">Calculando cuántos entran…</p>}
            {!planLoading && plan && (
              <ul className="space-y-0.5">
                <li>
                  <span className="font-semibold text-slate-900">{plan.elegibles}</span> entrarían como pendientes
                </li>
                <li>{plan.detenidos} detenidos: no entran</li>
                <li>
                  {plan.contactados_anteriormente} ya contactados antes {includePrev ? "(incluidos por decisión explícita)" : "(no entran)"}
                </li>
                {plan.filas_sin_contacto > 0 && <li>{plan.filas_sin_contacto} filas sin teléfono utilizable</li>}
              </ul>
            )}
            {!planLoading && plan && plan.contactados_anteriormente > 0 && (
              <label className="mt-2 flex items-start gap-2 text-amber-800">
                <input type="checkbox" checked={includePrev} onChange={(e) => setIncludePrev(e.target.checked)} className="mt-0.5" />
                <span>Incluir también a los ya contactados (queda registrado como decisión de esta campaña).</span>
              </label>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Nombre de la campaña</label>
            <input required value={campaignName} onChange={(e) => setCampaignName(e.target.value)} className={inputCls} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Canal (WhatsApp)</label>
              <select value={channelId} onChange={(e) => setChannelId(e.target.value)} className={inputCls}>
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Línea que envía</label>
              <select
                value={lineId}
                onChange={(e) => {
                  setLineId(e.target.value);
                  setTemplate("");
                }}
                className={inputCls}
              >
                <option value="">Asignar después</option>
                {lines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Plantilla (catálogo de la línea)</label>
            <TemplatePicker lineId={lineId || null} value={template} onChange={setTemplate} className={inputCls} />
          </div>

          <SendLimitsFields
            minDelaySeconds={minDelaySeconds}
            onMinDelayChange={setMinDelaySeconds}
            maxDelaySeconds={maxDelaySeconds}
            onMaxDelayChange={setMaxDelaySeconds}
            batchSize={batchSize}
            onBatchSizeChange={setBatchSize}
            batchPauseSeconds={batchPauseSeconds}
            onBatchPauseSecondsChange={setBatchPauseSeconds}
            dailyLimit={dailyLimit}
            onDailyLimitChange={setDailyLimit}
          />

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={creating || !plan || plan.elegibles === 0} className="btn-gold">
              {creating ? "Creando..." : `Crear campaña en borrador con ${plan?.elegibles ?? 0} (no envía)`}
            </button>
            <button
              type="button"
              onClick={() => setShowCampaignForm(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Fila</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Resultado</th>
              <th className="px-4 py-3">Marcas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2">
                  {r.contact_id && (
                    <input type="checkbox" checked={selected.has(r.contact_id)} onChange={() => toggleOne(r.contact_id!)} />
                  )}
                </td>
                <td className="px-4 py-2 text-slate-400">{r.row_number}</td>
                <td className="px-4 py-2">
                  {r.contact_id && fichaHref ? (
                    <a href={fichaHref.replace("{id}", r.contact_id)} className="font-medium text-slate-900 hover:underline">
                      {r.contact_name ?? "Sin nombre"}
                    </a>
                  ) : (
                    r.contact_name ?? "—"
                  )}
                </td>
                <td className="px-4 py-2 text-slate-600">{r.contact_phone ?? "—"}</td>
                <td className={`px-4 py-2 font-medium ${STATUS_COLOR[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                  {r.match_label && r.status !== "invalido" && (
                    <span className="block text-[11px] font-normal text-slate-400">{r.match_label}</span>
                  )}
                </td>
                <td className="px-4 py-2 text-xs">
                  <div className="flex flex-col gap-0.5">
                    {r.previously_contacted && (
                      <span className="text-indigo-700">Contactado anteriormente{r.previous_label ? ` · ${r.previous_label}` : ""}</span>
                    )}
                    {r.detained_label && <span className="text-red-600">Detenido · {r.detained_label}</span>}
                    {r.conflict && <span className="text-amber-700">{r.conflict}</span>}
                    {r.error && <span className="text-slate-400">{r.error}</span>}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No hay filas con este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
