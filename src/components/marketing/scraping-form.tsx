"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SendLimitsFields } from "@/components/campanas/send-limits-fields";

interface ScrapeSummary {
  base_id: string;
  total: number;
  creados: number;
  duplicados: number;
  invalidos: number;
  campaign_id: string | null;
  warning?: string;
}

export function ScrapingForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rubro, setRubro] = useState("");
  const [zona, setZona] = useState("");
  const [cantidad, setCantidad] = useState(20);
  const [autoSend, setAutoSend] = useState(false);
  const [template, setTemplate] = useState("");
  const [minDelaySeconds, setMinDelaySeconds] = useState(50);
  const [maxDelaySeconds, setMaxDelaySeconds] = useState(200);
  const [batchSize, setBatchSize] = useState(10);
  const [batchPauseSeconds, setBatchPauseSeconds] = useState(300);
  const [dailyLimit, setDailyLimit] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ScrapeSummary | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSummary(null);

    const res = await fetch("/api/marketing/scraping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rubro,
        zona,
        cantidad,
        auto_send: autoSend,
        message_template_name: autoSend ? template : undefined,
        min_send_delay_seconds: minDelaySeconds,
        max_send_delay_seconds: maxDelaySeconds,
        batch_size: batchSize,
        batch_pause_seconds: batchPauseSeconds,
        daily_send_limit: dailyLimit === "" ? null : dailyLimit,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok || data.error) {
      setError(data.error ?? "No se pudo completar la búsqueda. Probá de nuevo.");
      return;
    }

    setSummary(data);
    router.refresh();
  }

  if (summary) {
    return (
      <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5 text-sm">
        <p className="mb-2 font-medium text-green-800">Búsqueda completada.</p>
        <ul className="space-y-1 text-green-700">
          <li>{summary.total} negocios encontrados en Google Maps</li>
          <li>{summary.creados} leads nuevos</li>
          <li>{summary.duplicados} ya estaban cargados de una búsqueda anterior</li>
          <li>{summary.invalidos} sin teléfono publicado</li>
          {summary.campaign_id && (
            <li>Se lanzó el primer mensaje automático a los {summary.creados} leads nuevos.</li>
          )}
        </ul>
        {summary.warning && <p className="mt-2 text-amber-700">{summary.warning}</p>}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => router.push(`/panel/marketing/captacion/${summary.base_id}`)}
            className="btn-gold-sm"
          >
            Ver detalle
          </button>
          <button
            onClick={() => {
              setSummary(null);
              setOpen(false);
            }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-gold">
        + Buscar negocios en Google Maps
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Rubro del negocio</label>
        <input
          required
          value={rubro}
          onChange={(e) => setRubro(e.target.value)}
          placeholder="Ej: restaurantes"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Zona</label>
        <input
          required
          value={zona}
          onChange={(e) => setZona(e.target.value)}
          placeholder="Ej: Vicente López"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Cantidad de negocios a buscar
        </label>
        <input
          required
          type="number"
          min={1}
          max={60}
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        />
        <p className="mt-1 text-xs text-slate-400">
          Máximo 60 por búsqueda (límite de paginación de Google).
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={autoSend} onChange={(e) => setAutoSend(e.target.checked)} />
        Enviar el primer mensaje de WhatsApp automáticamente a los leads nuevos
      </label>

      {autoSend && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Nombre de la plantilla aprobada en WhatsApp
            </label>
            <input
              required={autoSend}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="ej: primer_contacto_marketing"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
            />
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
        </div>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn-gold">
          {loading ? "Buscando..." : "Buscar y cargar"}
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
