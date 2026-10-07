"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Prende / apaga el envío automático del primer mensaje a los prospectos mejor calificados. */
export function AutoOutreachControl({
  status,
  templateName,
  dailyLimit,
}: {
  status: string | null;
  templateName: string;
  dailyLimit: number;
}) {
  const router = useRouter();
  const [template, setTemplate] = useState(templateName);
  const [limit, setLimit] = useState<number>(dailyLimit);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = status === "en_curso";

  async function send(action: "activar" | "pausar") {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/marketing/auto-outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, message_template_name: template, daily_send_limit: limit }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok || data.error) {
      setError(data.error ?? "No se pudo actualizar.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-green-500" : "bg-slate-300"}`} />
        <h2 className="text-sm font-semibold text-slate-800">
          Envío automático del primer mensaje: {active ? "ACTIVADO" : status === "pausada" ? "pausado" : "apagado"}
        </h2>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Cuando está activado, cada negocio que sale del análisis con prioridad alta o media recibe solo el mensaje inicial
        (con el dato detectado), de a uno, con el ritmo y el límite diario de abajo, de 9 a 20 hs. Nunca se le escribe dos
        veces a un mismo negocio.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Plantilla aprobada (nombre exacto)</label>
          <input
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            placeholder="kocos_primer_contacto"
            className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Máximo por día</label>
          <input
            type="number"
            min={1}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          />
        </div>
        {active ? (
          <button onClick={() => send("pausar")} disabled={loading} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Pausar
          </button>
        ) : (
          <button onClick={() => send("activar")} disabled={loading} className="btn-gold">
            Activar
          </button>
        )}
        {active && (
          <button onClick={() => send("activar")} disabled={loading} className="text-sm text-slate-500 hover:underline">
            Guardar cambios
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
