import type { CampaignMetrics } from "@/lib/campaign-metrics";

function pct(n: number, d: number): string {
  if (d <= 0) return "Sin datos";
  return `${((n / d) * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })} %`;
}

/** Tono de la cifra: neutro; solo avisan con color los caídos y los cierres. */
type Tono = "fuerte" | "suave" | "atencion" | "logro";
const TONO: Record<Tono, string> = {
  fuerte: "text-slate-950",
  suave: "text-slate-600",
  atencion: "text-amber-700",
  logro: "text-emerald-700",
};

/**
 * Cifras de una campaña (doc. 1, 3.3), iguales en PC y teléfono porque
 * salen del mismo cálculo (`campaign_metrics`). Cada tasa muestra su
 * numerador y su denominador. Afinado 19/10: paleta de la marca (el color
 * queda solo para lo que avisa algo) y etiquetas cortas en una línea; el
 * nombre completo de cada cifra queda en el título de la tarjeta.
 */
export function CampaignMetricsPanel({ m, compact = false, enlaceRespondieron }: { m: CampaignMetrics | null; compact?: boolean; enlaceRespondieron?: string }) {
  if (!m) {
    return <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">No se pudieron calcular las cifras de la campaña.</p>;
  }
  // 20/10: «Respondieron» cuenta personas (no mensajes) y abre la lista de quienes respondieron.
  const tiles: { corto: string; largo: string; valor: number; tono: Tono; href?: string }[] = [
    { corto: "Prospectos", largo: "Prospectos", valor: m.prospectos, tono: "fuerte" },
    { corto: "Pendientes", largo: "Pendientes", valor: m.pendientes, tono: "suave" },
    { corto: "Enviados", largo: "Mensajes enviados", valor: m.mensajes_enviados, tono: "fuerte" },
    { corto: "Respondieron", largo: "Personas que respondieron", valor: m.personas_responden, tono: "fuerte", href: enlaceRespondieron },
    { corto: "Sin respuesta", largo: "Sin respuesta", valor: m.sin_respuesta, tono: "suave" },
    { corto: "Seguimiento", largo: "En seguimiento", valor: m.en_seguimiento, tono: "fuerte" },
    { corto: "Caídos", largo: "Caídos", valor: m.caidos, tono: m.caidos > 0 ? "atencion" : "fuerte" },
    { corto: "Cierres", largo: "Cierres", valor: m.cierres, tono: m.cierres > 0 ? "logro" : "fuerte" },
  ];
  const extras = [
    m.fallidos > 0 ? `${m.fallidos} envíos fallidos` : null,
    (m.a_revisar ?? 0) > 0 ? `${m.a_revisar} a revisar (no se reenvían solos)` : null,
    (m.en_envio ?? 0) > 0 ? `${m.en_envio} en envío` : null,
    m.detenidos > 0 ? `${m.detenidos} destinatarios detenidos (no reciben más envíos)` : null,
  ].filter(Boolean);
  return (
    <div>
      <div className={compact ? "grid grid-cols-4 gap-2" : "grid grid-cols-4 gap-3 md:grid-cols-8"}>
        {tiles.map((t) => {
          const contenido = (
            <>
              <p className="truncate text-xs font-medium text-slate-600">{t.corto}</p>
              <p className={`mt-0.5 text-xl font-semibold tabular-nums ${t.valor === 0 ? "text-slate-400" : TONO[t.tono]}`}>{t.valor.toLocaleString("es-AR")}</p>
              {t.href ? <p className="mt-0.5 text-[11px] font-medium text-gold-800">Ver quiénes →</p> : null}
            </>
          );
          return t.href ? (
            <a key={t.largo} href={t.href} title={t.largo} className="rounded-xl border border-slate-200 bg-white px-2 py-3 text-center hover:border-gold-500/50">
              {contenido}
            </a>
          ) : (
            <div key={t.largo} title={t.largo} className="rounded-xl border border-slate-200 bg-white px-2 py-3 text-center">
              {contenido}
            </div>
          );
        })}
      </div>
      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <dt className="text-slate-600">Tasa de respuesta</dt>
          <dd className="font-semibold tabular-nums text-slate-950">
            {pct(m.personas_responden, m.enviados)} <span className="font-normal text-slate-600">· {m.personas_responden} de {m.enviados} con envío</span>
          </dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <dt className="text-slate-600">Cierres sobre respuestas</dt>
          <dd className="font-semibold tabular-nums text-slate-950">
            {pct(m.cierres, m.personas_responden)} <span className="font-normal text-slate-600">· {m.cierres} de {m.personas_responden}</span>
          </dd>
        </div>
      </dl>
      {extras.length > 0 && <p className="mt-2 text-xs text-slate-600">{extras.join(" · ")}</p>}
      <p className="mt-2 text-xs text-slate-500">
        Cuenta destinatarios; «Enviados» cuenta mensajes.
        {m.actualizado ? ` Última actividad: ${new Date(m.actualizado).toLocaleString("es-AR")}.` : " Todavía sin actividad."}
      </p>
    </div>
  );
}
