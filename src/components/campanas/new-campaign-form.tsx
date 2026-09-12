"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SendLimitsFields } from "./send-limits-fields";

export function NewCampaignForm({
  channels,
}: {
  channels: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [channelId, setChannelId] = useState(channels[0]?.id ?? "");
  const [template, setTemplate] = useState("");
  const [delaySeconds, setDelaySeconds] = useState(90);
  const [batchSize, setBatchSize] = useState(10);
  const [batchPauseSeconds, setBatchPauseSeconds] = useState(300);
  const [dailyLimit, setDailyLimit] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!channelId) {
      setLoading(false);
      setError(
        "No hay ningún canal de WhatsApp disponible para elegir. Recargá la página e intentá de nuevo."
      );
      return;
    }

    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        channel_id: channelId,
        message_template_name: template,
        send_delay_seconds: delaySeconds,
        batch_size: batchSize,
        batch_pause_seconds: batchPauseSeconds,
        daily_send_limit: dailyLimit === "" ? null : dailyLimit,
      }),
    });
    const data = await res.json();
    setLoading(false);

    // Antes, si esto fallaba (por ejemplo la sesión vencida o algún error del
    // servidor), el formulario se cerraba solo y no avisaba nada — parecía
    // que "no se podían crear más campañas" cuando en realidad no hay ningún
    // límite, solo faltaba mostrar el error.
    if (!res.ok || data.error || !data.campaign) {
      setError(data.error ?? "No se pudo crear la campaña. Probá de nuevo.");
      return;
    }

    setOpen(false);
    router.push(`/campanas/${data.campaign.id}`);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-gold"
      >
        + Nueva campaña
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Nombre</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          placeholder="Ej: Base clientes 2024 - Accidentes laborales"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Canal (WhatsApp)</label>
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
          Nombre de la plantilla aprobada en WhatsApp
        </label>
        <input
          required
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          placeholder="ej: primer_contacto_civil"
        />
        <p className="mt-1 text-xs text-slate-400">
          Debe existir y estar aprobada en Meta Business Manager antes de usarla acá.
        </p>
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

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="btn-gold"
        >
          {loading ? "Creando..." : "Crear campaña"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
