import type { CampaignMetrics } from "@/lib/campaign-metrics";

function pct(n: number, d: number): string {
  if (d <= 0) return "Sin datos";
  return `${((n / d) * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })} %`;
}

/**
 * Cifras de una campaña (doc. 1, 3.3), iguales en PC y teléfono porque
 * salen del mismo cálculo (`campaign_metrics`). Cada tasa muestra su
 * numerador y su denominador.
 */
export function CampaignMetricsPanel({ m, compact = false }: { m: CampaignMetrics | null; compact?: boolean }) {
  if (!m) {
    return <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-400">No se pudieron calcular las cifras de la campaña.</p>;
  }
  const tiles: [string, number, string][] = [
    ["Prospectos", m.prospectos, "text-slate-900"],
    ["Pendientes", m.pendientes, "text-slate-500"],
    ["Mensajes enviados", m.mensajes_enviados, "text-blue-600"],
    ["Respuestas", m.respuestas, "text-indigo-600"],
    ["Personas que responden", m.personas_responden, "text-indigo-600"],
    ["Sin respuesta", m.sin_respuesta, "text-slate-600"],
    ["En seguimiento", m.en_seguimiento, "text-teal-600"],
    ["Caídos", m.caidos, "text-amber-600"],
    ["Cierres", m.cierres, "text-green-600"],
  ];
  return (
    <div>
      <div className={compact ? "grid grid-cols-3 gap-2" : "grid grid-cols-3 gap-3 md:grid-cols-9"}>
        {tiles.map(([label, value, color]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <p className="text-[10px] uppercase leading-tight text-slate-400">{label}</p>
            <p className={`text-lg font-semibold ${color}`}>{value.toLocaleString("es-AR")}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Tasa de respuesta: {pct(m.personas_responden, m.enviados)} ({m.personas_responden} de {m.enviados} destinatarios con envío) ·
        Cierres sobre respuestas: {pct(m.cierres, m.personas_responden)} ({m.cierres} de {m.personas_responden})
        {m.fallidos > 0 ? ` · ${m.fallidos} envíos fallidos` : ""}
        {(m.a_revisar ?? 0) > 0 ? ` · ${m.a_revisar} a revisar (no se reenvían solos)` : ""}
        {(m.en_envio ?? 0) > 0 ? ` · ${m.en_envio} en envío` : ""}
        {m.detenidos > 0 ? ` · ${m.detenidos} destinatarios detenidos (no reciben más envíos)` : ""}
      </p>
      <p className="text-[11px] text-slate-400">
        Unidad: destinatarios de la campaña (mensajes enviados y respuestas cuentan mensajes).
        {m.actualizado ? ` Última actividad: ${new Date(m.actualizado).toLocaleString("es-AR")}.` : " Todavía sin actividad."}
      </p>
    </div>
  );
}
