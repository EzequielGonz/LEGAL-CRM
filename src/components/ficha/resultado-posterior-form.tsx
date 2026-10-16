"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MOTIVO_NO_AVANCE_LABEL,
  MOTIVOS_NO_AVANCE,
  RESULTADO_POSTERIOR_LABEL,
  RESULTADOS_POSTERIORES,
  type ResultadoPosterior,
} from "@/lib/captacion/reglas";

/**
 * Resultado posterior a la derivación (parche 2.0, 10.2): otra dimensión,
 * con fecha, fuente y nota. No cambia la captación ni la derivación y no
 * inicia ninguna secuencia automática. Solo muestra «Guardado» cuando el
 * servidor lo confirma; si falla, el error queda visible.
 */
export function ResultadoPosteriorForm({ opportunityId, actual }: { opportunityId: string; actual: ResultadoPosterior | null }) {
  const router = useRouter();
  const [resultado, setResultado] = useState<ResultadoPosterior>(actual ?? "contacto_previsto");
  const [fuente, setFuente] = useState("profesional");
  const [motivo, setMotivo] = useState<string>("no_se_pudo_contactar");
  const [nota, setNota] = useState("");
  const [previsto, setPrevisto] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const pideMotivo = resultado === "no_avanzo" || resultado === "necesita_nueva_gestion";

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/oportunidades/${opportunityId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "resultado_posterior",
          resultado,
          fuente,
          motivo: pideMotivo ? motivo : undefined,
          nota,
          contacto_previsto: resultado === "contacto_previsto" && previsto ? new Date(previsto).toISOString() : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ ok: false, text: data?.error ?? `No se pudo guardar (error ${res.status}).` });
        return;
      }
      setMsg({ ok: true, text: "Guardado." });
      setNota("");
      router.refresh();
    } catch {
      setMsg({ ok: false, text: "No se pudo guardar: sin conexión. No se registró nada." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-2 rounded-lg border border-slate-200 p-3 text-sm" aria-describedby="rp-ayuda">
      <p id="rp-ayuda" className="text-xs text-slate-600">
        Registrá qué pasó después de derivar. No cambia la captación ni inicia seguimientos.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-slate-700">Resultado</span>
          <select value={resultado} onChange={(e) => setResultado(e.target.value as ResultadoPosterior)} className="tactil mt-1 w-full rounded-lg border border-slate-300 px-2">
            {RESULTADOS_POSTERIORES.map((r) => (
              <option key={r} value={r}>
                {RESULTADO_POSTERIOR_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-700">Fuente</span>
          <select value={fuente} onChange={(e) => setFuente(e.target.value)} className="tactil mt-1 w-full rounded-lg border border-slate-300 px-2">
            <option value="profesional">El profesional</option>
            <option value="operador">Operador</option>
            <option value="prospecto">La persona</option>
          </select>
        </label>
        {pideMotivo && (
          <label className="block">
            <span className="text-xs font-medium text-slate-700">Motivo</span>
            <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className="tactil mt-1 w-full rounded-lg border border-slate-300 px-2">
              {MOTIVOS_NO_AVANCE.map((m) => (
                <option key={m} value={m}>
                  {MOTIVO_NO_AVANCE_LABEL[m]}
                </option>
              ))}
            </select>
          </label>
        )}
        {resultado === "contacto_previsto" && (
          <label className="block">
            <span className="text-xs font-medium text-slate-700">Contacto previsto (opcional)</span>
            <input type="datetime-local" value={previsto} onChange={(e) => setPrevisto(e.target.value)} className="tactil mt-1 w-full rounded-lg border border-slate-300 px-2" />
          </label>
        )}
      </div>
      <label className="block">
        <span className="text-xs font-medium text-slate-700">Nota (opcional)</span>
        <textarea value={nota} onChange={(e) => setNota(e.target.value)} maxLength={1000} rows={2} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1" />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className="tactil rounded-lg bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-60">
          {busy ? "Guardando…" : "Guardar resultado"}
        </button>
        <p role="status" aria-live="polite" className={msg ? (msg.ok ? "text-sm text-emerald-700" : "text-sm font-medium text-red-700") : "sr-only"}>
          {msg?.text ?? ""}
        </p>
      </div>
    </form>
  );
}
