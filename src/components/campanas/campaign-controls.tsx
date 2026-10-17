"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CampaignLiveModal } from "./campaign-live-modal";

const ACTION_MESSAGE: Record<string, string> = {
  sent: "Primer mensaje enviado. El resto de los envíos van a seguir en segundo plano, solos, respetando el ritmo configurado — no hace falta dejar esta pantalla abierta.",
  finished: "No había destinatarios pendientes: la campaña ya está finalizada.",
  daily_limit_reached:
    "Se alcanzó el límite de envíos de hoy. La campaña quedó pausada — se reanuda sola apenas la reactives.",
  failed_send: "El primer intento de envío falló (revisá el detalle en la tabla de destinatarios). El sistema va a seguir intentando con los siguientes en segundo plano.",
  waiting_interval: "Campaña lanzada. Todavía no le tocaba enviar el primer mensaje según el ritmo configurado — va a salir solo en los próximos minutos.",
  batch_pause: "Campaña lanzada, está en pausa entre lotes en este momento — va a seguir sola cuando termine la pausa.",
  not_running: "La campaña no está activa.",
};

export function CampaignControls({
  campaignId,
  campaignName,
  status,
}: {
  campaignId: string;
  campaignName: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showLive, setShowLive] = useState(false);
  const [prep, setPrep] = useState<{ ready: boolean; missing: string[]; pausa_general: boolean; pause_reason: string | null } | null>(null);
  const [pauseReason, setPauseReason] = useState("");
  const [askingPause, setAskingPause] = useState(false);
  // Lanzar o reanudar envía mensajes reales: siempre se confirma aparte (rediseño 17/10).
  const [confirmando, setConfirmando] = useState(false);

  // Qué falta para lanzar (configuración del perfil, línea, plantilla, pausa general).
  const loadPrep = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/preparacion`, { cache: "no-store" });
      if (res.ok) setPrep(await res.json());
    } catch {
      // sin datos: el servidor igual rechaza el lanzamiento si falta algo
    }
  }, [campaignId]);
  useEffect(() => {
    loadPrep();
  }, [loadPrep, status]);

  async function launch() {
    setConfirmando(false);
    setLoading(true);
    setMessage(null);
    const res = await fetch(`/api/campaigns/${campaignId}/launch`, { method: "POST" });
    const data = await res.json();
    setLoading(false);

    if (data.error) {
      setMessage(`Error: ${data.error}`);
    } else {
      setMessage(ACTION_MESSAGE[data.action] ?? "Campaña lanzada.");
      // Al lanzar, abrimos directo el panel de seguimiento en vivo para que
      // se vea el progreso sin tener que buscarlo aparte.
      setShowLive(true);
    }
    router.refresh();
  }

  async function pause() {
    setLoading(true);
    await fetch(`/api/campaigns/${campaignId}/pause`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivo: pauseReason.trim() || undefined }),
    });
    setLoading(false);
    setAskingPause(false);
    setPauseReason("");
    setMessage("Campaña pausada: no se va a enviar nada más hasta que la reactives.");
    router.refresh();
  }

  // Mientras no se sabe si está lista, no se ofrece lanzar (el servidor igual lo rechazaría).
  const blocked = prep ? !prep.ready : true;

  return (
    <div>
      <div className="flex gap-2">
        {status === "en_curso" ? (
          askingPause ? (
            <span className="flex flex-wrap items-center gap-2">
              <input
                aria-label="Motivo de la pausa (opcional)"
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="Motivo de la pausa (opcional)"
                className="w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
              />
              <button
                onClick={pause}
                disabled={loading}
                className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700"
              >
                Confirmar pausa
              </button>
            </span>
          ) : (
            <button
              onClick={() => setAskingPause(true)}
              disabled={loading}
              className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700"
            >
              Pausar campaña
            </button>
          )
        ) : (
          <button
            onClick={() => setConfirmando(true)}
            disabled={loading || status === "finalizada" || blocked || confirmando}
            aria-describedby={blocked ? `campana-falta-${campaignId}` : undefined}
            className="btn-gold"
          >
            {loading ? "Lanzando..." : status === "pausada" ? "Reanudar envíos…" : "Lanzar campaña…"}
          </button>
        )}
        {(status === "en_curso" || status === "pausada" || status === "finalizada") && (
          <button
            onClick={() => setShowLive(true)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:border-gold-300"
          >
            Ver seguimiento en vivo
          </button>
        )}
      </div>
      {confirmando && (
        <div role="alertdialog" aria-labelledby={`confirmar-${campaignId}`} className="mt-2 max-w-md rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          <p id={`confirmar-${campaignId}`} className="font-semibold">
            {status === "pausada" ? "¿Reanudar los envíos?" : "¿Lanzar la campaña?"}
          </p>
          <p className="mt-1">
            Empieza a enviar mensajes reales por WhatsApp a las personas de esta campaña, con el ritmo configurado. Lo que se
            envía no se puede deshacer; podés pausarla en cualquier momento.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={launch} disabled={loading} className="btn-gold">
              Sí, {status === "pausada" ? "reanudar" : "lanzar"} y enviar
            </button>
            <button onClick={() => setConfirmando(false)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800">
              Cancelar
            </button>
          </div>
        </div>
      )}
      {prep?.pause_reason && status === "pausada" && (
        <p className="mt-2 max-w-md text-sm text-slate-700">Motivo de la pausa: {prep.pause_reason}</p>
      )}
      {prep && blocked && status !== "en_curso" && status !== "finalizada" && (
        <div id={`campana-falta-${campaignId}`} className="mt-2 max-w-md rounded-lg border border-amber-200 bg-amber-50 p-2 text-sm text-amber-950">
          {prep?.pausa_general && <p>Pausa general de envíos activa (Configuración → Pausa general).</p>}
          {prep && prep.missing.length > 0 && (
            <>
              <p className="font-semibold">Falta antes de lanzar:</p>
              <ul className="list-disc pl-4">
                {prep.missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      {message && <p role="status" className="mt-2 max-w-md text-sm text-slate-700">{message}</p>}
      {status === "en_curso" && !message && (
        <p className="mt-2 max-w-md text-sm text-slate-700">
          En curso: el sistema va enviando los mensajes solo, en segundo plano, respetando el
          ritmo configurado. Se actualiza acá a medida que van saliendo.
        </p>
      )}

      <CampaignLiveModal
        campaignId={campaignId}
        campaignName={campaignName}
        open={showLive}
        onClose={() => setShowLive(false)}
      />
    </div>
  );
}
