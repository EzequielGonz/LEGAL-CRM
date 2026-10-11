"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SendLimitsFields } from "./send-limits-fields";
import { TemplatePicker } from "@/components/plantillas/template-picker";

export function NewCampaignForm({
  channels,
  lines = [],
  redirectBase = "/campanas",
}: {
  channels: { id: string; label: string }[];
  /** Líneas del perfil habilitadas para campañas (bloque 1.4). Se puede asignar después. */
  lines?: { id: string; label: string }[];
  /** Base de la URL a la que navegar después de crear la campaña, seguida
   * de "/<id>". Por defecto "/campanas" (panel de Jurídico); los paneles
   * de otros rubros pasan la suya, por ejemplo "/panel/agencia_0km/campanas". */
  redirectBase?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [channelId, setChannelId] = useState(channels[0]?.id ?? "");
  const [template, setTemplate] = useState("");
  const [lineId, setLineId] = useState(lines.length === 1 ? lines[0].id : "");
  const [minDelaySeconds, setMinDelaySeconds] = useState(50);
  const [maxDelaySeconds, setMaxDelaySeconds] = useState(200);
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
        template_id: template || null,
        min_send_delay_seconds: minDelaySeconds,
        max_send_delay_seconds: maxDelaySeconds,
        batch_size: batchSize,
        batch_pause_seconds: batchPauseSeconds,
        daily_send_limit: dailyLimit === "" ? null : dailyLimit,
        line_id: lineId || null,
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
    router.push(`${redirectBase}/${data.campaign.id}`);
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
        <label className="mb-1 block text-xs font-medium text-slate-600">Línea que envía</label>
        <select
          value={lineId}
          onChange={(e) => {
            setLineId(e.target.value);
            setTemplate("");
          }}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        >
          <option value="">Asignar después</option>
          {lines.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-400">
          Sin línea asignada la campaña queda en borrador y no se puede lanzar. Las líneas se cargan en Configuración.
        </p>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Plantilla (catálogo de la línea)</label>
        <TemplatePicker lineId={lineId || null} value={template} onChange={setTemplate} />
        <p className="mt-1 text-xs text-slate-400">
          Solo plantillas aprobadas según Meta y asignadas a la línea para campañas. Se puede elegir después.
        </p>
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
