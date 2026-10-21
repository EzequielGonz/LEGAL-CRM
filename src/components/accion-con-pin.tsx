"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface CampoAccion {
  nombre: string;
  etiqueta: string;
  tipo?: "text" | "number" | "select" | "textarea" | "datetime-local";
  min?: string;
  opciones?: { valor: string; etiqueta: string }[];
  requerido?: boolean;
  valorInicial?: string;
  ayuda?: string;
}

/**
 * Botón de acción del panel (16/10): manda `cuerpo` + campos al endpoint,
 * pide el PIN si corresponde y muestra el resultado en un aviso accesible.
 */
export function AccionConPin({
  endpoint,
  cuerpo,
  etiqueta,
  pidePin = false,
  confirmacion,
  campos = [],
  variante = "principal",
  exito,
}: {
  endpoint: string;
  cuerpo: Record<string, unknown>;
  etiqueta: string;
  pidePin?: boolean;
  confirmacion?: string;
  campos?: CampoAccion[];
  variante?: "principal" | "secundaria" | "peligro";
  exito?: string;
}) {
  const router = useRouter();
  const [valores, setValores] = useState<Record<string, string>>(Object.fromEntries(campos.map((c) => [c.nombre, c.valorInicial ?? ""])));
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const clase =
    variante === "peligro"
      ? "bg-red-700 text-white"
      : variante === "secundaria"
        ? "border border-slate-300 bg-white text-slate-800"
        : "bg-slate-900 text-gold-100";

  return (
    <form
      className="space-y-2 text-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        if (confirmacion && !window.confirm(confirmacion)) return;
        setBusy(true);
        setMsg(null);
        try {
          const extra: Record<string, unknown> = {};
          for (const c of campos) {
            const v = valores[c.nombre];
            if (v === "" || v == null) continue;
            extra[c.nombre] = c.tipo === "number" ? Number(v.replace(",", ".")) : v;
          }
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...cuerpo, ...extra, ...(pidePin ? { pin } : {}) }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) setMsg({ ok: false, text: data.error ?? "No se pudo completar." });
          else {
            setMsg({ ok: true, text: exito ?? data.detalle ?? "Listo." });
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
      {campos.map((c) => (
        <label key={c.nombre} className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">{c.etiqueta}</span>
          {c.tipo === "select" ? (
            <select
              value={valores[c.nombre]}
              required={c.requerido}
              onChange={(e) => setValores({ ...valores, [c.nombre]: e.target.value })}
              className="tactil w-full rounded-lg border border-slate-300 bg-white px-2"
            >
              <option value="">Elegí…</option>
              {(c.opciones ?? []).map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.etiqueta}
                </option>
              ))}
            </select>
          ) : c.tipo === "textarea" ? (
            <textarea
              value={valores[c.nombre]}
              required={c.requerido}
              onChange={(e) => setValores({ ...valores, [c.nombre]: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-2 py-1"
            />
          ) : (
            <input
              value={valores[c.nombre]}
              required={c.requerido}
              type={c.tipo === "datetime-local" ? "datetime-local" : undefined}
              min={c.min}
              inputMode={c.tipo === "number" ? "decimal" : undefined}
              onChange={(e) => setValores({ ...valores, [c.nombre]: e.target.value })}
              className="tactil w-full rounded-lg border border-slate-300 px-2"
            />
          )}
          {c.ayuda && <span className="mt-0.5 block text-xs text-slate-500">{c.ayuda}</span>}
        </label>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        {pidePin && (
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            placeholder="PIN"
            required
            aria-label="PIN"
            className="tactil w-28 rounded-lg border border-slate-300 px-2"
          />
        )}
        <button type="submit" disabled={busy} className={`tactil rounded-lg px-4 text-sm font-medium disabled:opacity-60 ${clase}`}>
          {busy ? "Procesando…" : etiqueta}
        </button>
      </div>
      <p role="status" aria-live="polite" className={msg ? (msg.ok ? "text-emerald-700" : "font-medium text-red-700") : "sr-only"}>
        {msg?.text ?? ""}
      </p>
    </form>
  );
}
