import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import { formatCount, formatRate, headlineRates, type ProfileMetrics } from "@/lib/metrics";
import { enlaceIndicador } from "@/lib/indicadores";

/**
 * Panel de cifras de un perfil (mismo cálculo en PC y teléfono). Las tasas
 * muestran numerador y denominador.
 */
export function MetricsPanel({
  metrics,
  compact = false,
  perfil,
  volver,
}: {
  metrics: ProfileMetrics | null;
  compact?: boolean;
  /** Con el perfil, cada cifra de oportunidades abre su lista (misma consulta). */
  perfil?: string;
  /** Ruta a la que vuelve la lista (conserva filtros de esta pantalla). */
  volver?: string;
}) {
  const to = (clave: string) => (perfil ? enlaceIndicador(perfil, clave, volver) : undefined);
  if (!metrics) {
    return <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-400">No se pudieron calcular las cifras.</p>;
  }
  const m = metrics;
  const rates = headlineRates(m);
  const grid = compact ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 gap-4 md:grid-cols-4";

  return (
    <div className="space-y-4">
      <div className={grid}>
        <StatCard label="Oportunidades" value={formatCount(m.oportunidades)} hint={`${formatCount(m.contactos)} contactos`} href={to("oportunidades")} />
        <StatCard label="Captados" value={formatCount(m.captacion.captado)} hint={`${formatCount(m.derivacion.no_derivado)} sin derivar`} href={to("captado")} />
        <StatCard label="Respondieron" value={formatCount(m.contacto.respondio)} hint={`${formatCount(m.contacto.contactado_sin_respuesta)} contactados sin respuesta`} href={to("respondio")} />
        <StatCard label="Detenidos" value={formatCount(m.detenidos)} hint={`${formatCount(m.retenidos_revision)} retenidos para revisión`} />
      </div>

      <div className={compact ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 gap-4 md:grid-cols-3"}>
        {rates.map((r) => (
          <div key={r.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{r.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{formatRate(r)}</p>
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
            <Row label="Sin contactar" value={m.contacto.sin_contactar}  href={to("sin_contactar")} />
            <Row label="Contactados sin respuesta" value={m.contacto.contactado_sin_respuesta}  href={to("contactado_sin_respuesta")} />
            <Row label="Respondieron" value={m.contacto.respondio}  href={to("respondio")} />
            <Row label="Error de contacto" value={m.contacto.error_contacto}  href={to("error_contacto")} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <p className="mb-2 font-semibold text-slate-700">Captación</p>
            <Row label="Nuevos" value={m.captacion.nuevo}  href={to("nuevo")} />
            <Row label="En conversación" value={m.captacion.en_conversacion}  href={to("en_conversacion")} />
            <Row label="En seguimiento" value={m.captacion.en_seguimiento}  href={to("en_seguimiento")} />
            <Row label="Captados" value={m.captacion.captado}  href={to("captado")} />
            <Row label="Perdidos" value={m.captacion.perdido}  href={to("perdido")} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <p className="mb-2 font-semibold text-slate-700">Atención y mensajes</p>
            <Row label="Requieren intervención humana" value={m.atencion.requiere_humano}  href={to("requiere_humano")} />
            <Row label="Atención humana en curso" value={m.atencion.humano_en_curso}  href={to("humano_en_curso")} />
            <Row label="Mensajes enviados" value={m.mensajes.enviados} />
            <Row label="Mensajes recibidos" value={m.mensajes.recibidos} />
            <Row label="Seguimientos caídos" value={m.seguimiento.caido}  href={to("seguimiento_caido")} />
            <p className="mt-2 text-xs">
              <Link href="/revision" className="text-slate-600 hover:underline">
                {formatCount(m.incidencias_abiertas)} incidencias abiertas →
              </Link>
            </p>
          </div>
        </div>
      )}
      <p className="text-xs text-slate-400">
        Unidad: oportunidad (una por consulta). Actualizado {new Date(m.calculado_en).toLocaleString("es-AR")}.
      </p>
    </div>
  );
}

function Row({ label, value, href }: { label: string; value: number; href?: string }) {
  if (href) {
    return (
      <p className="border-b border-slate-50 last:border-0">
        <Link href={href} className="flex justify-between rounded py-1 hover:bg-slate-50" aria-label={`${label}: ${value}. Ver la lista`}>
          <span className="text-slate-600 underline-offset-2 hover:underline">{label}</span>
          <span className="font-medium text-slate-800">{value.toLocaleString("es-AR")}</span>
        </Link>
      </p>
    );
  }
  return (
    <p className="flex justify-between border-b border-slate-50 py-1 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{formatCount(value)}</span>
    </p>
  );
}
