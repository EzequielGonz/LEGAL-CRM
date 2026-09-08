"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SendLimitsFields } from "@/components/campanas/send-limits-fields";

export interface BaseRowItem {
  id: string;
  row_number: number;
  status: "creado" | "duplicado" | "invalido";
  error: string | null;
  contact_id: string | null;
  contact_name: string | null;
  contact_phone: string | null;
}

export function BaseRowsTable({
  rows,
  channels,
}: {
  rows: BaseRowItem[];
  channels: { id: string; label: string }[];
}) {
  const router = useRouter();
  const selectable = useMemo(() => rows.filter((r) => r.contact_id), [rows]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [channelId, setChannelId] = useState(channels[0]?.id ?? "");
  const [template, setTemplate] = useState("");
  const [delaySeconds, setDelaySeconds] = useState(90);
  const [batchSize, setBatchSize] = useState(10);
  const [batchPauseSeconds, setBatchPauseSeconds] = useState(300);
  const [dailyLimit, setDailyLimit] = useState<number | "">("");
  const [creating, setCreating] = useState(false);

  const allSelected = selected.size > 0 && selected.size === selectable.length;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectable.map((r) => r.contact_id!)));
    }
  }

  function toggleOne(contactId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) next.delete(contactId);
      else next.add(contactId);
      return next;
    });
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: campaignName,
        channel_id: channelId,
        message_template_name: template,
        send_delay_seconds: delaySeconds,
        batch_size: batchSize,
        batch_pause_seconds: batchPauseSeconds,
        daily_send_limit: dailyLimit === "" ? null : dailyLimit,
        contact_ids: Array.from(selected),
      }),
    });
    const data = await res.json();
    setCreating(false);
    if (data.campaign) router.push(`/campanas/${data.campaign.id}`);
  }

  const statusLabel: Record<string, string> = {
    creado: "Nuevo contacto",
    duplicado: "Ya existía",
    invalido: "Inválido",
  };
  const statusColor: Record<string, string> = {
    creado: "text-green-600",
    duplicado: "text-slate-500",
    invalido: "text-red-600",
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} />
          Seleccionar todos los contactos válidos ({selectable.length})
        </label>
        {selected.size > 0 && (
          <button
            onClick={() => setShowCampaignForm(true)}
            className="btn-gold"
          >
            Crear campaña con {selected.size} seleccionados
          </button>
        )}
      </div>

      {showCampaignForm && (
        <form
          onSubmit={handleCreateCampaign}
          className="mb-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Nombre de la campaña
            </label>
            <input
              required
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Canal (WhatsApp)
            </label>
            <select
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
            >
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Plantilla aprobada de WhatsApp
            </label>
            <input
              required
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="ej: primer_contacto_civil"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
            />
          </div>

          <SendLimitsFields
            delaySeconds={delaySeconds}
            onDelayChange={setDelaySeconds}
            batchSize={batchSize}
            onBatchSizeChange={setBatchSize}
            batchPauseSeconds={batchPauseSeconds}
            onBatchPauseSecondsChange={setBatchPauseSeconds}
            dailyLimit={dailyLimit}
            onDailyLimitChange={setDailyLimit}
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="btn-gold"
            >
              {creating ? "Creando..." : "Crear campaña (queda en borrador)"}
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

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Fila</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2">
                  {r.contact_id && (
                    <input
                      type="checkbox"
                      checked={selected.has(r.contact_id)}
                      onChange={() => toggleOne(r.contact_id!)}
                    />
                  )}
                </td>
                <td className="px-4 py-2 text-slate-400">{r.row_number}</td>
                <td className="px-4 py-2">{r.contact_name ?? "—"}</td>
                <td className="px-4 py-2 text-slate-600">{r.contact_phone ?? "—"}</td>
                <td className={`px-4 py-2 font-medium ${statusColor[r.status]}`}>
                  {statusLabel[r.status]}
                </td>
                <td className="px-4 py-2 text-xs text-slate-400">{r.error ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
