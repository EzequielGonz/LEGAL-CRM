"use client";

import { useEffect, useRef, useState } from "react";

interface StatusSnapshot {
  campaign: {
    id: string;
    name: string;
    status: string;
    send_delay_seconds: number;
    batch_size: number;
    batch_pause_seconds: number;
    daily_send_limit: number | null;
    sent_in_batch: number;
    last_sent_at: string | null;
    batch_paused_until: string | null;
    started_at: string | null;
    finished_at: string | null;
  };
  counts: {
    total: number;
    pendiente: number;
    enviado: number;
    entregado: number;
    leido: number;
    respondio: number;
    fallo: number;
    opt_out: number;
    enviados_total: number;
  };
  lastSent: { full_name: string | null; phone: string | null; sent_at: string } | null;
  nextUp: { full_name: string | null; phone: string | null } | null;
  waitSeconds: number;
  waitReason:
    | "listo"
    | "esperando_intervalo"
    | "pausa_entre_lotes"
    | "limite_diario"
    | "detenida"
    | "finalizada";
}

const WAIT_LABEL: Record<StatusSnapshot["waitReason"], string> = {
  listo: "Preparando el próximo envío...",
  esperando_intervalo: "Próximo mensaje en:",
  pausa_entre_lotes: "En pausa entre lotes. Se reanuda en:",
  limite_diario: "Límite diario de envíos alcanzado por hoy.",
  detenida: "La campaña no está en curso.",
  finalizada: "Campaña finalizada: no quedan destinatarios pendientes.",
};

function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${m}:${rest.toString().padStart(2, "0")}`;
}

function formatPhone(phone: string | null): string {
  return phone ?? "—";
}

const POLL_MS = 4000;

export function CampaignLiveModal({
  campaignId,
  campaignName,
  open,
  onClose,
}: {
  campaignId: string;
  campaignName: string;
  open: boolean;
  onClose: () => void;
}) {
  const [snapshot, setSnapshot] = useState<StatusSnapshot | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [errored, setErrored] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function fetchSnapshot() {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}/status`);
        if (!res.ok) throw new Error("status not ok");
        const data: StatusSnapshot = await res.json();
        if (cancelled) return;
        setSnapshot(data);
        setCountdown(data.waitSeconds);
        setErrored(false);
      } catch {
        if (!cancelled) setErrored(true);
      }
    }

    fetchSnapshot();
    pollRef.current = setInterval(fetchSnapshot, POLL_MS);

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open, campaignId]);

  // Cuenta regresiva local, segundo a segundo, entre cada refresco del
  // servidor (que es el que manda la posta cada POLL_MS).
  useEffect(() => {
    if (!open) return;
    tickRef.current = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [open]);

  if (!open) return null;

  const s = snapshot;
  const progressPct = s && s.counts.total > 0 ? Math.round((s.counts.enviados_total / s.counts.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Seguimiento en vivo</p>
            <h2 className="text-lg font-semibold text-slate-900">{campaignName}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full px-2 py-1 text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {!s && !errored && <p className="py-8 text-center text-sm text-slate-400">Cargando...</p>}
        {errored && !s && (
          <p className="py-8 text-center text-sm text-red-500">
            No se pudo cargar el estado de la campaña.
          </p>
        )}

        {s && (
          <div className="space-y-4">
            {/* Progreso general */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                <span>
                  {s.counts.enviados_total} / {s.counts.total} contactos
                </span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gold-500 transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Cuenta regresiva / estado del ritmo */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-xs text-slate-500">{WAIT_LABEL[s.waitReason]}</p>
              {(s.waitReason === "esperando_intervalo" || s.waitReason === "pausa_entre_lotes") && (
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {formatCountdown(countdown)}
                </p>
              )}
            </div>

            {/* Último enviado / próximo en la fila */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="mb-1 text-[11px] uppercase text-slate-400">Último enviado</p>
                {s.lastSent ? (
                  <>
                    <p className="truncate text-sm font-medium text-slate-800">
                      {s.lastSent.full_name || "Sin nombre"}
                    </p>
                    <p className="text-xs text-slate-500">{formatPhone(s.lastSent.phone)}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {new Date(s.lastSent.sent_at).toLocaleTimeString("es-AR")}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-slate-400">Todavía no se mandó ninguno.</p>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="mb-1 text-[11px] uppercase text-slate-400">Próximo en la fila</p>
                {s.nextUp ? (
                  <>
                    <p className="truncate text-sm font-medium text-slate-800">
                      {s.nextUp.full_name || "Sin nombre"}
                    </p>
                    <p className="text-xs text-slate-500">{formatPhone(s.nextUp.phone)}</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-400">No quedan pendientes.</p>
                )}
              </div>
            </div>

            {/* Desglose de estados */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ["Pendientes", s.counts.pendiente],
                ["Enviados", s.counts.enviado + s.counts.entregado + s.counts.leido],
                ["Respondieron", s.counts.respondio],
                ["Fallidos", s.counts.fallo],
                ["Lote actual", `${s.campaign.sent_in_batch}/${s.campaign.batch_size}`],
                ["Ritmo", `1 cada ${s.campaign.send_delay_seconds}s`],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-lg bg-slate-50 p-2">
                  <p className="text-[10px] uppercase text-slate-400">{label}</p>
                  <p className="text-sm font-semibold text-slate-700">{value}</p>
                </div>
              ))}
            </div>

            <p className="text-center text-[11px] text-slate-400">
              Los envíos siguen solos en segundo plano aunque cierres esta ventana.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
