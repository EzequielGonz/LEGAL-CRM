"use client";

import { useEffect, useRef, useState } from "react";

interface StatusSnapshot {
  campaign: {
    id: string;
    name: string;
    status: string;
    min_send_delay_seconds: number;
    max_send_delay_seconds: number;
    next_delay_seconds: number | null;
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
  // Esto NO es un error ni la campaña trabada: ya se cumplió el tiempo de
  // espera entre mensajes, pero el envío real lo hace el cron que revisa
  // cada campaña una vez por minuto (ver docs/SETUP.md §6.1) — así que puede
  // tardar hasta 60 segundos en pasar de acá a "Próximo mensaje en...". Es
  // normal verlo así un ratito en cada mensaje.
  listo: "Preparando el próximo envío (puede tardar hasta 1 minuto)...",
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
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchSnapshotRef = useRef<() => void>(() => {});

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
        setLastUpdatedAt(new Date());
      } catch {
        if (!cancelled) setErrored(true);
      }
    }
    fetchSnapshotRef.current = fetchSnapshot;

    function startPolling() {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(fetchSnapshot, POLL_MS);
    }

    // Bug reportado: el panel se quedaba mostrando "69 enviados" aunque el
    // servidor ya hubiera llegado a 100. La causa es que este setInterval
    // corre en el navegador (o en la app del celular) y, cuando la pantalla
    // se bloquea o la pestaña pasa a segundo plano, el sistema operativo lo
    // pausa para ahorrar batería — durante ese tiempo el panel deja de
    // pedirle la novedad al servidor y se queda "congelado" en el último
    // dato que llegó a tener, aunque los envíos hayan seguido su curso
    // normalmente en el fondo. Al volver a primer plano refrescamos al
    // toque (en vez de esperar hasta 4 segundos, o los minutos que haya
    // estado en pausa) y reiniciamos el intervalo.
    function handleWake() {
      if (document.visibilityState === "visible") {
        fetchSnapshot();
        startPolling();
      }
    }

    fetchSnapshot();
    startPolling();
    document.addEventListener("visibilitychange", handleWake);
    window.addEventListener("focus", handleWake);

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener("visibilitychange", handleWake);
      window.removeEventListener("focus", handleWake);
    };
  }, [open, campaignId]);

  async function handleManualRefresh() {
    setRefreshing(true);
    await fetchSnapshotRef.current();
    setRefreshing(false);
  }

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

  // Solo estético: bloquea el scroll de fondo mientras el modal está
  // abierto, para que en el celular no queden dos cosas scrolleando a la
  // vez (la página de atrás y el modal) — eso es parte de lo que se veía
  // "corrompido" en pantallas chicas. No toca ningún dato ni lógica de
  // envío, solo un estilo del <body> que se deshace al cerrar.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const s = snapshot;
  const progressPct = s && s.counts.total > 0 ? Math.round((s.counts.enviados_total / s.counts.total) * 100) : 0;
  const isWaitingCountdown = s?.waitReason === "esperando_intervalo" || s?.waitReason === "pausa_entre_lotes";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-[2px] sm:p-4"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Seguimiento en vivo — ${campaignName}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Header fijo: siempre visible arriba, aunque el contenido de abajo
            haga scroll en pantallas chicas — así los botones nunca quedan
            fuera de alcance. */}
        <div className="shrink-0 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Seguimiento en vivo
              </p>
              <h2 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
                {campaignName}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="flex h-10 w-10 items-center justify-center rounded-full text-base text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 active:bg-slate-200 disabled:opacity-50"
                aria-label="Actualizar ahora"
                title="Actualizar ahora"
              >
                <span className={refreshing ? "animate-spin" : ""}>↻</span>
              </button>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full text-base text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 active:bg-slate-200"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
          </div>

          {lastUpdatedAt && (
            <p className="mt-1.5 text-[11px] leading-snug text-slate-400">
              Actualizado {lastUpdatedAt.toLocaleTimeString("es-AR")}
              {" · "}
              si bloqueás la pantalla o cambiás de app, tocá ↻ al volver.
            </p>
          )}
        </div>

        {/* Cuerpo con scroll propio, separado del header, para que en
            celulares con poca altura de pantalla el contenido no se corte
            ni empuje el diálogo fuera de la vista. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
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
                  <span className="font-medium text-slate-600">{progressPct}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gold-500 transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Cuenta regresiva / estado del ritmo */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-center sm:py-4">
                <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                  {s.waitReason === "listo" && (
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-gold-500" />
                  )}
                  <span className="break-words">{WAIT_LABEL[s.waitReason]}</span>
                </p>
                {isWaitingCountdown && (
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900 sm:text-3xl">
                    {formatCountdown(countdown)}
                  </p>
                )}
              </div>

              {/* Último enviado / próximo en la fila */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="min-w-0 rounded-xl border border-slate-200 p-3">
                  <p className="mb-1 text-[11px] uppercase text-slate-400">Último enviado</p>
                  {s.lastSent ? (
                    <>
                      <p className="truncate text-sm font-medium text-slate-800">
                        {s.lastSent.full_name || "Sin nombre"}
                      </p>
                      <p className="truncate text-xs text-slate-500">{formatPhone(s.lastSent.phone)}</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {new Date(s.lastSent.sent_at).toLocaleTimeString("es-AR")}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400">Todavía no se mandó ninguno.</p>
                  )}
                </div>
                <div className="min-w-0 rounded-xl border border-slate-200 p-3">
                  <p className="mb-1 text-[11px] uppercase text-slate-400">Próximo en la fila</p>
                  {s.nextUp ? (
                    <>
                      <p className="truncate text-sm font-medium text-slate-800">
                        {s.nextUp.full_name || "Sin nombre"}
                      </p>
                      <p className="truncate text-xs text-slate-500">{formatPhone(s.nextUp.phone)}</p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400">No quedan pendientes.</p>
                  )}
                </div>
              </div>

              {/* Desglose de estados */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  ["Pendientes", s.counts.pendiente, "text-slate-700"],
                  [
                    "Enviados",
                    s.counts.enviado + s.counts.entregado + s.counts.leido,
                    "text-blue-600",
                  ],
                  ["Respondieron", s.counts.respondio, "text-indigo-600"],
                  ["Fallidos", s.counts.fallo, "text-red-600"],
                  ["Lote actual", `${s.campaign.sent_in_batch}/${s.campaign.batch_size}`, "text-slate-700"],
                  [
                    "Ritmo",
                    `${s.campaign.min_send_delay_seconds}-${s.campaign.max_send_delay_seconds}s`,
                    "text-slate-700",
                  ],
                ].map(([label, value, color]) => (
                  <div
                    key={label as string}
                    className="min-w-0 rounded-lg bg-slate-50 px-2 py-2.5 text-center"
                  >
                    <p className="truncate text-[10px] uppercase text-slate-400">{label}</p>
                    <p className={`truncate text-sm font-semibold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              <p className="text-center text-[11px] leading-snug text-slate-400">
                Los envíos siguen solos en segundo plano aunque cierres esta ventana.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
