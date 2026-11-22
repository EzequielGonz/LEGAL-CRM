import type { CampaignMetrics } from "@/lib/campaign-metrics";
import type { SlugPerfil } from "@/lib/marca";
import { Anillo, Tarjeta, VerMas } from "@/components/premium";
import "@/app/chats-campanas.css";

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
export function CampaignMetricsPanel({ m, compact = false, enlaceRespondieron, rubro }: { m: CampaignMetrics | null; compact?: boolean; enlaceRespondieron?: string; rubro?: SlugPerfil }) {
  if (!m) {
    return <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">No se pudieron calcular las cifras de la campaña.</p>;
  }
  // 20/10: «Respondieron» cuenta personas (no mensajes) y abre la lista de quienes respondieron.
  const tiles: { corto: string; largo: string; valor: number; tono: Tono; href?: string }[] = [
    { corto: "Prospectos", largo: "Prospectos", valor: m.prospectos, tono: "fuerte" },
    { corto: "Pendientes", largo: "Pendientes", valor: m.pendientes, tono: "suave" },
    // 24/10: «Con envío» cuenta destinatarios (igual que la lista y el Inicio); los mensajes van abajo.
    { corto: "Con envío", largo: "Destinatarios con envío", valor: m.enviados, tono: "fuerte" },
    { corto: "Respondieron", largo: "Personas que respondieron", valor: m.personas_responden, tono: "fuerte", href: enlaceRespondieron },
    { corto: "Sin respuesta", largo: "Sin respuesta", valor: m.sin_respuesta, tono: "suave" },
    { corto: "Seguimiento", largo: "En seguimiento", valor: m.en_seguimiento, tono: "fuerte" },
    { corto: "Caídos", largo: "Caídos", valor: m.caidos, tono: m.caidos > 0 ? "atencion" : "fuerte" },
    { corto: "Cierres", largo: "Cierres", valor: m.cierres, tono: m.cierres > 0 ? "logro" : "fuerte" },
  ];
  const extras = [
    m.mensajes_enviados > 0 ? `${m.mensajes_enviados.toLocaleString("es-AR")} mensajes enviados en total (plantillas y respuestas)` : null,
    m.fallidos > 0 ? `${m.fallidos} envíos fallidos` : null,
    (m.a_revisar ?? 0) > 0 ? `${m.a_revisar} a revisar (no se reenvían solos)` : null,
    (m.en_envio ?? 0) > 0 ? `${m.en_envio} en envío` : null,
    m.detenidos > 0 ? `${m.detenidos} destinatarios detenidos (no reciben más envíos)` : null,
  ].filter(Boolean);
  if (rubro && !compact) {
    const pctEntero = (n: number, d: number) => (d > 0 ? Math.min(100, Math.round((n / d) * 100)) : 0);
    const chico = (titulo: string, detalle: string, valor: number, meta: number, unidad: string, retraso: number) => (
      <div className="cc-ring cc-ring--col" key={titulo}>
        <Anillo valor={valor} meta={Math.max(meta, valor, 1)} rubro={rubro} tamano="chico" nombre={titulo} unidad={unidad} retrasoMs={retraso} />
        <div className="cc-ring__texto">
          <p className="cc-ring__titulo" style={{ fontSize: "0.95rem" }}>{titulo}</p>
          <p className="cc-ring__detalle">{detalle}</p>
        </div>
      </div>
    );
    return (
      <div className="cc">
        <Tarjeta relieve rubro={rubro} aparecer={0}>
          <div className="cc-anillos">
            <div className="cc-ring cc-ring--col">
              <Anillo valor={pctEntero(m.personas_responden, m.enviados)} rubro={rubro} tamano="grande" sufijo="%" nombre="Tasa de respuesta" unidad={`${m.personas_responden} de ${m.enviados} con envío respondieron`} />
              <div className="cc-ring__texto">
                <h2 className="cc-ring__titulo">Tasa de respuesta</h2>
                <p className="cc-ring__detalle">{m.personas_responden} de {m.enviados} con envío</p>
              </div>
            </div>
            <div className="cc-anillos__chicos">
              {chico("Con envío", `de ${m.prospectos.toLocaleString("es-AR")}`, m.enviados, m.prospectos, `de ${m.prospectos} destinatarios`, 80)}
              {chico("Cierres", `de ${m.personas_responden.toLocaleString("es-AR")} que respondieron`, m.cierres, m.personas_responden, `de ${m.personas_responden} que respondieron`, 160)}
              {chico("Pendientes", "todavía sin enviar", m.pendientes, m.prospectos, `de ${m.prospectos} destinatarios`, 240)}
            </div>
          </div>
          <VerMas cerrado="Ver todas las cifras" abierto="Ocultar las cifras">
            <ul className="cc-metricas">
              {tiles.map((t) => {
                const clase = t.valor === 0 ? "cc-metricas__valor cc-metricas__valor--cero" : `cc-metricas__valor${t.tono === "atencion" ? " cc-metricas__valor--atencion" : t.tono === "logro" ? " cc-metricas__valor--logro" : ""}`;
                const cuerpo = (
                  <>
                    <p className="cc-metricas__rotulo">{t.corto}</p>
                    <p className={clase}>{t.valor.toLocaleString("es-AR")}</p>
                    {t.href ? <p className="cc-metricas__rotulo" style={{ color: "var(--d-acento-texto)" }}>Ver quiénes →</p> : null}
                  </>
                );
                return (
                  <li key={t.largo} title={t.largo}>
                    {t.href ? <a href={t.href} className="cc-metricas__item">{cuerpo}</a> : <div className="cc-metricas__item">{cuerpo}</div>}
                  </li>
                );
              })}
            </ul>
            {extras.length > 0 && <p className="mt-3 text-xs text-slate-600">{extras.join(" · ")}</p>}
            <p className="mt-2 text-xs text-slate-500">
              Todas las cifras cuentan destinatarios.
              {m.actualizado ? ` Última actividad: ${new Date(m.actualizado).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hourCycle: "h23" })}.` : " Todavía sin actividad."}
            </p>
          </VerMas>
        </Tarjeta>
      </div>
    );
  }
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
        Todas las cifras cuentan destinatarios.
        {m.actualizado ? ` Última actividad: ${new Date(m.actualizado).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hourCycle: "h23" })}.` : " Todavía sin actividad."}
      </p>
    </div>
  );
}
