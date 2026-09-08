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
  const [delaySeconds, setDelaySeconds] = useState(3);
  const [dailyLimit, setDailyLimit] = useState<number | "">("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        channel_id: channelId,
        message_template_name: template,
        send_delay_seconds: delaySeconds,
        daily_send_limit: dailyLimit === "" ? null : dailyLimit,
      }),
    });
    const { campaign } = await res.json();
    setLoading(false);
    setOpen(false);
    router.push(`/campanas/${campaign.id}`);
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
        dailyLimit={dailyLimit}
        onDailyLimitChange={setDailyLimit}
      />

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
