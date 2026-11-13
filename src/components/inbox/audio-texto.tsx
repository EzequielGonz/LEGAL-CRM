"use client";

import { useState } from "react";
import { ESTADO_AUDIO_TEXTO, type EstadoAudio } from "@/lib/audios/reglas";

export interface AudioEnTexto {
  audio_texto?: string | null;
  audio_texto_estado?: string | null;
  audio_texto_detalle?: string | null;
}

/**
 * Lo que dijo la persona en un audio, debajo del reproductor. Si todavía no
 * se pasó a texto, el botón lo hace en el momento: solo escribe el texto, no
 * le contesta ni le manda nada a la persona.
 */
export function AudioTexto({ messageId, audio, onCambio }: { messageId: string; audio: AudioEnTexto; onCambio: (a: AudioEnTexto) => void }) {
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const estado = (audio.audio_texto_estado ?? null) as EstadoAudio | null;
  const hecho = estado === "hecha" && !!audio.audio_texto;

  async function pasar() {
    setOcupado(true);
    setError(null);
    try {
      const res = await fetch(`/api/audios/${messageId}/texto`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No se pudo pasar a texto. Probá de nuevo.");
        return;
      }
      onCambio({ audio_texto: data.texto ?? null, audio_texto_estado: data.estado ?? null, audio_texto_detalle: data.detalle ?? null });
    } catch {
      setError("No se pudo conectar. Probá de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="mt-1.5 border-t border-slate-200 pt-1.5">
      {hecho ? (
        <>
          <p className="text-xs font-semibold text-slate-500">{ESTADO_AUDIO_TEXTO.hecha}</p>
          <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-800">{audio.audio_texto}</p>
          {audio.audio_texto_detalle && <p className="mt-0.5 text-xs text-amber-800">{audio.audio_texto_detalle}</p>}
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {estado && (
            <p className="text-xs text-slate-500">
              {ESTADO_AUDIO_TEXTO[estado] ?? "No se pasó a texto"}
              {audio.audio_texto_detalle ? `: ${audio.audio_texto_detalle}` : ""}
            </p>
          )}
          <button
            type="button"
            onClick={pasar}
            disabled={ocupado}
            aria-busy={ocupado}
            className="tactil rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-gold-300 disabled:opacity-50"
          >
            {ocupado ? "Pasando a texto…" : estado ? "Intentar de nuevo" : "Pasar a texto"}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
