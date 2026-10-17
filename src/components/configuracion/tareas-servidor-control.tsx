"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Etapa 3 · Ejecutor de tareas del servidor: citas de Fase 2 (mensaje de
 * inicio a la hora acordada) y publicación de contenido vencido. Apagado
 * por defecto; cambiar pide el PIN. Encenderlo no levanta la pausa general:
 * con la pausa puesta, igual no sale nada.
 */
export function TareasServidorControl({ citas, contenido, configProblem = null }: { citas: boolean; contenido: boolean; configProblem?: string | null }) {
  const router = useRouter();
  const [c, setC] = useState(citas);
  const [k, setK] = useState(contenido);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      className="space-y-2 text-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        try {
          const res = await fetch("/api/acceso/tareas-servidor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ citas: c, contenido: k, pin }) });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) setMsg({ ok: false, text: data.error ?? "No se pudo cambiar." });
          else {
            setMsg({ ok: true, text: `Guardado: citas ${data.citas ? "encendidas" : "apagadas"}, contenido ${data.contenido ? "encendido" : "apagado"}. La pausa general sigue mandando.` });
            router.refresh();
          }
        } catch {
          setMsg({ ok: false, text: "Sin conexión: no se cambió nada." });
        } finally {
          setBusy(false);
          setPin("");
        }
      }}
    >
      <p className="text-slate-700">
        Estado: citas <strong>{citas ? "encendidas" : "apagadas"}</strong> · contenido <strong>{contenido ? "encendido" : "apagado"}</strong>.
        {configProblem ? ` ${configProblem}` : ""}
      </p>
      <label className="flex items-center gap-2">
        <input type="checkbox" className="h-4 w-4 shrink-0" checked={c} onChange={(e) => setC(e.target.checked)} /> Ejecutar las tareas de cita (mensaje de inicio de Fase 2 a la hora acordada)
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" className="h-4 w-4 shrink-0" checked={k} onChange={(e) => setK(e.target.checked)} /> Publicar las piezas de contenido programadas (solo con política habilitada y cuenta conectada)
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <input value={pin} onChange={(e) => setPin(e.target.value)} type="password" inputMode="numeric" autoComplete="off" placeholder="PIN" required aria-label="PIN" className="tactil w-32 rounded-lg border border-slate-300 px-2" />
        <button type="submit" disabled={busy} className="tactil rounded-lg bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-60">
          {busy ? "Guardando…" : "Guardar"}
        </button>
        <p role="status" aria-live="polite" className={msg ? (msg.ok ? "text-emerald-700" : "font-medium text-red-700") : "sr-only"}>
          {msg?.text ?? ""}
        </p>
      </div>
    </form>
  );
}
