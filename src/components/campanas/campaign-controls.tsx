"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

    if (data.dailyLimitReached) {
      setMessage(
        `Se alcanzó el límite de envíos de hoy (${data.sent} enviados en esta corrida). La campaña quedó pausada — volvé a apretar "Reanudar" mañana para que siga.`
      );
    } else if (data.sent || data.failed) {
      setMessage(`Terminó: ${data.sent} enviados, ${data.failed} fallidos.`);
    }
    router.refresh();
  }

  async function pause() {
    setLoading(true);
    await fetch(`/api/campaigns/${campaignId}/pause`, { method: "POST" });
    setLoading(false);
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
            {loading ? "Enviando..." : status === "pausada" ? "Reanudar" : "Lanzar campaña"}
          </button>
        )}
      </div>
      {message && <p className="mt-2 max-w-md text-xs text-slate-500">{message}</p>}
    </div>
  );
}
