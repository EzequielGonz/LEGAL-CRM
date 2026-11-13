"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * «El bot entiende los audios» de un perfil (13/11). Encendido: cuando una
 * persona manda un audio, se pasa a texto y el bot le contesta a lo que
 * dijo. Apagado: el bot le pide que lo escriba, como antes.
 */
export function AudiosControl({ perfil, encendido }: { perfil: string; encendido: boolean }) {
  const router = useRouter();
  const [activo, setActivo] = useState(encendido);
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  async function cambiar() {
    const nuevo = !activo;
    setOcupado(true);
    setMsg(null);
    try {
      const res = await fetch("/api/audios/ajuste", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ perfil, encendido: nuevo }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ ok: false, texto: data.error ?? "No se pudo cambiar. Probá de nuevo." });
        return;
      }
      setActivo(nuevo);
      setMsg({ ok: true, texto: nuevo ? "Encendido: los audios que lleguen se pasan a texto." : "Apagado: el bot vuelve a pedir que lo escriban." });
      router.refresh();
    } catch {
      setMsg({ ok: false, texto: "Sin conexión: no se cambió nada." });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="space-y-2 text-sm">
      <p className="text-slate-700">
        Cuando una persona manda un audio, el sistema lo pasa a texto y el bot le contesta a lo que dijo. El texto queda escrito debajo del audio en el chat. Si un audio dura más de 5 minutos o no se
        entiende, el bot le pide que lo escriba.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={activo}
          onClick={cambiar}
          disabled={ocupado}
          className={`tactil rounded-lg px-4 text-sm font-medium disabled:opacity-60 ${activo ? "border border-slate-300 bg-white text-slate-800" : "bg-slate-900 text-white"}`}
        >
          {ocupado ? "Guardando…" : activo ? "Apagar" : "Encender"}
        </button>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${activo ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{activo ? "Encendido" : "Apagado"}</span>
        <p role="status" aria-live="polite" className={msg ? (msg.ok ? "text-emerald-700" : "font-medium text-red-700") : "sr-only"}>
          {msg?.texto ?? ""}
        </p>
      </div>
      <p className="text-xs text-slate-500">Esto no enciende el bot ni levanta la pausa general: el bot sigue contestando solo donde ya contesta.</p>
    </div>
  );
}
