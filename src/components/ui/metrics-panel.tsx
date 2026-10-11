import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import { formatCount, formatRate, headlineRates, type ProfileMetrics } from "@/lib/metrics";

/**
 * Panel de cifras de un perfil (mismo cálculo en PC y teléfono). Las tasas
 * muestran numerador y denominador.
 */
export function MetricsPanel({ metrics, compact = false }: { metrics: ProfileMetrics | null; compact?: boolean }) {
  if (!metrics) {
    return <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-400">No se pudieron calcular las cifras.</p>;
  }
  const m = metrics;
  const rates = headlineRates(m);
  const grid = compact ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 gap-4 md:grid-cols-4";

  return (
    <div className="space-y-4">
      <div className={grid}>
        <StatCard label="Oportunidades" value={formatCount(m.oportunidades)} hint={`${formatCount(m.contactos)} contactos`} />
        <StatCard label="Captados" value={formatCount(m.captacion.captado)} hint={`${formatCount(m.derivacion.no_derivado)} sin derivar`} />
        <StatCard label="Respondieron" value={formatCount(m.contacto.respondio)} hint={`${formatCount(m.contacto.contactado_sin_respuesta)} contactados sin respuesta`} />
        <StatCard label="Detenidos" value={formatCount(m.detenidos)} hint={`${formatCount(m.retenidos_revision)} retenidos para revisión`} />
      </div>

      <div className={compact ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 gap-4 md:grid-cols-3"}>
        {rates.map((r) => (
          <div key={r.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{r.label}</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-slate-900">{formatRate(r)}</p>
            <p className="mt-1 text-xs text-slate-400">
              {formatCount(r.numerator)} de {formatCount(r.denominator)} · {r.definition}
            </p>
          </div>
        ))}
      </div>

      {!compact && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <p className="mb-2 font-semibold text-slate-700">Contacto y respuesta</p>
            <Row label="Sin contactar" value={m.contacto.sin_contactar} />
            <Row label="Contactados sin respuesta" value={m.contacto.contactado_sin_respuesta} />
            <Row label="Respondieron" value={m.contacto.respondio} />
            <Row label="Error de contacto" value={m.contacto.error_contacto} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <p className="mb-2 font-semibold text-slate-700">Captación</p>
            <Row label="Nuevos" value={m.captacion.nuevo} />
            <Row label="En conversación" value={m.captacion.en_conversacion} />
            <Row label="En seguimiento" value={m.captacion.en_seguimiento} />
            <Row label="Captados" value={m.captacion.captado} />
            <Row label="Perdidos" value={m.captacion.perdido} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <p className="mb-2 font-semibold text-slate-700">Atención y mensajes</p>
            <Row label="Requieren intervención humana" value={m.atencion.requiere_humano} />
            <Row label="Atención humana en curso" value={m.atencion.humano_en_curso} />
            <Row label="Mensajes enviados" value={m.mensajes.enviados} />
            <Row label="Mensajes recibidos" value={m.mensajes.recibidos} />
            <Row label="Seguimientos caídos" value={m.seguimiento.caido} />
            <p className="mt-2 text-xs">
              <Link href="/revision" className="text-slate-600 hover:underline">
                {formatCount(m.incidencias_abiertas)} incidencias abiertas →
              </Link>
            </p>
          </div>
        </div>
      )}
      <p className="text-[11px] text-slate-400">
        Unidad: oportunidad (una por consulta). Actualizado {new Date(m.calculado_en).toLocaleString("es-AR")}.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <p className="flex justify-between border-b border-slate-50 py-1 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{formatCount(value)}</span>
    </p>
  );
}
