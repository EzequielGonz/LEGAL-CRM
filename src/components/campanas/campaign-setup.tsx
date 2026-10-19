"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TemplatePicker } from "@/components/plantillas/template-picker";

// Los domingos no se envía (pregunta 39): el horario general es de lunes a sábado de 8 a 21.
const DAYS = [
  { n: 1, label: "Lun" },
  { n: 2, label: "Mar" },
  { n: 3, label: "Mié" },
  { n: 4, label: "Jue" },
  { n: 5, label: "Vie" },
  { n: 6, label: "Sáb" },
];

/** Línea asignada, días de ejecución y plantilla del catálogo de una campaña (bloque 1.8). */
export function CampaignSetup({
  campaignId,
  lines,
  lineId,
  runDays,
  archivedAt,
  templateId,
  legacyTemplateName,
  running,
  dailyLimit = null,
}: {
  campaignId: string;
  lines: { id: string; label: string; ok: boolean; motivo?: string | null; daily_limit: number | null }[];
  lineId: string | null;
  runDays: number[] | null;
  archivedAt: string | null;
  templateId: string | null;
  /** nombre escrito antes, sin confirmar en Meta (solo referencia) */
  legacyTemplateName: string | null;
  /** en curso: la plantilla no se cambia hasta pausarla */
  running: boolean;
  /** 20/10: límite diario de envíos de la campaña (editable también en curso). */
  dailyLimit?: number | null;
}) {
  const router = useRouter();
  const [line, setLine] = useState(lineId ?? "");
  const [days, setDays] = useState<number[]>((runDays ?? []).filter((d) => d >= 1 && d <= 6));
  const [tpl, setTpl] = useState(templateId ?? "");
  const [limite, setLimite] = useState(dailyLimit ? String(dailyLimit) : "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const payload: Record<string, unknown> = { line_id: line || null, run_days: days, daily_send_limit: limite.trim() === "" ? null : Number(limite) };
      if (!running && (tpl || null) !== (templateId ?? null)) payload.template_id = tpl || null;
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      setMsg(res.ok ? { ok: true, text: "Guardado." } : { ok: false, text: data.error ?? "No se pudo guardar." });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      {archivedAt && (
        <p className="mb-3 rounded-lg bg-slate-100 p-2 text-xs text-slate-600">
          Campaña archivada el {new Date(archivedAt).toLocaleString("es-AR")}. Se conserva todo; para lanzarla primero hay que recuperarla.
        </p>
      )}
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-xs font-medium text-slate-600">
          Línea que envía
          <select
            value={line}
            onChange={(e) => {
              setLine(e.target.value);
              setTpl("");
            }}
            className="mt-1 block w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          >
            <option value="">Sin asignar</option>
            {lines.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
                {l.ok ? "" : ` (${l.motivo ?? "faltan credenciales"})`}
                {l.daily_limit ? ` · ${l.daily_limit}/día` : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="text-xs font-medium text-slate-600">
          Días de ejecución
          <div className="mt-1 flex gap-1">
            {DAYS.map((d) => {
              const on = days.includes(d.n);
              return (
                <button
                  key={d.n}
                  type="button"
                  onClick={() => setDays(on ? days.filter((x) => x !== d.n) : [...days, d.n].sort())}
                  className={`rounded-md border px-2 py-1.5 text-xs ${on ? "border-gold-400 bg-slate-900 text-gold-100" : "border-slate-300 text-slate-600"}`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
          <p className="mt-1 font-normal text-slate-400">
            {days.length === 0 ? "Sin selección = de lunes a sábado" : ""} Los domingos no se envía; horario de 8 a 21.
          </p>
        </div>
        <div className="w-72 text-xs font-medium text-slate-600">
          Plantilla (catálogo de la línea)
          <div className="mt-1 font-normal">
            {running ? (
              <p className="text-slate-500">Pausá la campaña para cambiar la plantilla.</p>
            ) : (
              <TemplatePicker lineId={line || null} value={tpl} onChange={setTpl} />
            )}
          </div>
          {!templateId && legacyTemplateName && (
            <p className="mt-1 font-normal text-amber-700">
              Escrita antes: «{legacyTemplateName}». No cuenta como aprobada hasta elegirla del catálogo.
            </p>
          )}
        </div>
        <label className="text-xs font-medium text-slate-600">
          Máximo de mensajes por día
          <input
            type="number"
            min={1}
            max={1000}
            inputMode="numeric"
            value={limite}
            onChange={(e) => setLimite(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Sin límite propio"
            className="mt-1 block w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          />
          <span className="mt-1 block font-normal text-slate-400">Se puede cambiar aunque esté en curso.</span>
        </label>
        <button type="button" onClick={save} disabled={busy} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          {busy ? "Guardando..." : "Guardar"}
        </button>
        {msg && <span className={`text-xs ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.text}</span>}
      </div>
      {lines.length === 0 && (
        <p className="mt-2 text-xs text-amber-700">Este perfil no tiene líneas habilitadas para campañas: se registran en Configuración → Perfil, nombres y líneas.</p>
      )}
    </div>
  );
}
