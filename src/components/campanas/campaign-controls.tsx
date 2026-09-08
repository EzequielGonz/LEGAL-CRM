"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  status,
}: {
  campaignId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function launch() {
    setLoading(true);
    setMessage(null);
    const res = await fetch(`/api/campaigns/${campaignId}/launch`, { method: "POST" });
    const data = await res.json();
    setLoading(false);

    if (data.error) {
      setMessage(`Error: ${data.error}`);
    } else {
      setMessage(ACTION_MESSAGE[data.action] ?? "Campaña lanzada.");
    }
    router.refresh();
  }

  async function pause() {
    setLoading(true);
    await fetch(`/api/campaigns/${campaignId}/pause`, { method: "POST" });
    setLoading(false);
    setMessage("Campaña pausada: no se va a enviar nada más hasta que la reactives.");
    router.refresh();
  }

  return (
    <div>
      <div className="flex gap-2">
        {status === "en_curso" ? (
          <button
            onClick={pause}
            disabled={loading}
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700"
          >
            Pausar campaña
          </button>
        ) : (
          <button
            onClick={launch}
            disabled={loading || status === "finalizada"}
            className="btn-gold"
          >
            {loading ? "Lanzando..." : status === "pausada" ? "Reanudar" : "Lanzar campaña"}
          </button>
        )}
      </div>
      {message && <p className="mt-2 max-w-md text-xs text-slate-500">{message}</p>}
      {status === "en_curso" && !message && (
        <p className="mt-2 max-w-md text-xs text-slate-400">
          En curso: el sistema va enviando los mensajes solo, en segundo plano, respetando el
          ritmo configurado. Se actualiza acá a medida que van saliendo.
        </p>
      )}
    </div>
  );
}
