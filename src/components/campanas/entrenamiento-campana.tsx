"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ENTRENAMIENTO, ETIQUETA_RESULTADO, RESULTADOS_SEMANA, estadoEntrenamiento, type ResultadoSemana } from "@/lib/campanas/entrenamiento";

/**
 * 15/11: estado del modo entrenamiento en la ficha de la campaña y, desde el
 * día 7, los botones del resultado de la semana (avanzó / no avanzó / vendido).
 * Cargar el resultado no cambia el ritmo: subir el límite se hace a mano.
 */
export function EntrenamientoCampana({
  campaignId,
  entrenamientoDesde,
  resultado,
}: {
  campaignId: string;
  entrenamientoDesde: string | null;
  resultado: string | null;
}) {
  const router = useRouter();
  const [guardando, setGuardando] = useState<ResultadoSemana | "activar" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const estado = estadoEntrenamiento({ entrenamiento_desde: entrenamientoDesde, resultado_semana: resultado });

  async function enviar(cuerpo: Record<string, unknown>, cual: ResultadoSemana | "activar") {
    setGuardando(cual);
    setMsg(null);
    const res = await fetch(`/api/campaigns/${campaignId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    const data = await res.json().catch(() => ({}));
    setGuardando(null);
    if (!res.ok) {
      setMsg({ ok: false, text: data.error ?? "No se pudo guardar. Probá de nuevo." });
      return;
    }
    setMsg({ ok: true, text: cual === "activar" ? "Listo: la campaña queda en modo entrenamiento." : "Resultado guardado." });
    router.refresh();
  }

  if (!estado) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <span>Sin modo entrenamiento (ritmo elegido a mano).</span>
        <button
          type="button"
          onClick={() => enviar({ entrenamiento: true }, "activar")}
          disabled={guardando !== null}
          className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {guardando === "activar" ? "Guardando..." : `Pasar a entrenamiento (${ENTRENAMIENTO.porDia} por día)`}
        </button>
        <p role="status" className={`w-full text-sm ${msg?.ok ? "text-green-700" : "font-medium text-red-700"}`}>{msg?.text ?? ""}</p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
      <p className="font-semibold">
        {estado.enEntrenamiento
          ? `Modo entrenamiento: día ${estado.dia} de ${ENTRENAMIENTO.dias} · hasta ${ENTRENAMIENTO.porDia} envíos por día.`
          : `La semana de entrenamiento terminó (día ${estado.dia}). El límite sigue en ${ENTRENAMIENTO.porDia} por día hasta que lo cambies.`}
      </p>
      {resultado ? (
        <p className="mt-1">Resultado de la semana: {ETIQUETA_RESULTADO[resultado as ResultadoSemana] ?? resultado}.</p>
      ) : estado.pideResultado ? (
        <div className="mt-2">
          <p id={`resultado-semana-${campaignId}`}>¿Cómo le fue a la campaña esta semana?</p>
          <div role="group" aria-labelledby={`resultado-semana-${campaignId}`} className="mt-2 flex flex-wrap gap-2">
            {RESULTADOS_SEMANA.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => enviar({ resultado_semana: r }, r)}
                disabled={guardando !== null}
                className="inline-flex min-h-[44px] items-center rounded-lg border border-emerald-700 bg-white px-3 py-2 font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
              >
                {guardando === r ? "Guardando..." : ETIQUETA_RESULTADO[r]}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-1">Al día {ENTRENAMIENTO.dias} te pedimos el resultado. Si querés más volumen antes, subí el límite diario a mano (el entrenamiento se apaga).</p>
      )}
      <p role="status" className={`mt-1 text-sm ${msg?.ok ? "text-green-700" : "font-medium text-red-700"}`}>{msg?.text ?? ""}</p>
    </div>
  );
}
