"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buildShareText, type ShareField } from "@/lib/ficha";

const DETENTION_OPTIONS: Record<string, string> = {
  necesidad_resuelta: "Necesidad resuelta",
  compra_otro_canal: "Compró por otro canal",
  desinteres: "Desinterés",
  no_contacto: "Pidió no ser contactado",
  enojo: "Enojo por el contacto",
  numero_equivocado: "Número equivocado",
  abogado_existente: "Ya tiene abogado",
};

/**
 * Acciones de la ficha (bloques 1.7 y 1.8): las mismas en todas las
 * vistas y en el teléfono. Compartir el texto no cambia ningún estado;
 * "Derivado" se marca solo a mano.
 */
export function FichaActions({
  opportunity,
  contactId,
  fullName,
  phone,
  barrio,
  optionalFields,
  detention,
}: {
  opportunity: {
    id: string;
    capture_state: string;
    attention_state: string;
    derivation_state: string;
    review_required: boolean;
    followup_state?: string;
  } | null;
  contactId: string;
  fullName: string | null;
  phone: string | null;
  barrio: string | null;
  optionalFields: ShareField[];
  detention: { id: string; label: string; hard: boolean } | null;
}) {
  const router = useRouter();
  const [chosen, setChosen] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [form, setForm] = useState<null | { accion: string; label: string; field: "nota" | "motivo" | "destinatario"; placeholder: string; extra?: Record<string, unknown> }>(null);
  const [value, setValue] = useState("");
  const [value2, setValue2] = useState("");
  const [detMotive, setDetMotive] = useState("desinteres");

  const extras = optionalFields.filter((f) => chosen.includes(f.key));
  const faltantes = [!fullName?.trim() && "nombre y apellido", !barrio?.trim() && "barrio", !phone?.trim() && "teléfono"].filter(Boolean) as string[];
  const text = useMemo(() => buildShareText({ fullName, barrio, phone, extras }), [fullName, barrio, phone, extras]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMsg({ ok: false, text: "No se pudo copiar: seleccioná el texto y copialo a mano." });
    }
  }

  async function share() {
    const nav = navigator as Navigator & { share?: (data: { text: string }) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ text });
      } catch {
        // cancelado por la persona: no pasa nada (y no cambia ningún estado)
      }
    } else {
      await copy();
    }
  }

  async function run(accion: string, payload: Record<string, unknown>) {
    if (!opportunity) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/oportunidades/${opportunity.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setMsg({ ok: false, text: data.error ?? "No se pudo guardar." });
      else {
        setMsg({ ok: true, text: "Guardado." });
        setForm(null);
        setValue("");
        setValue2("");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function detener() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/revision/detenciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_id: contactId, motive: detMotive, nota: value.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setMsg({ ok: false, text: data.error ?? "No se pudo registrar." });
      else {
        setForm(null);
        setValue("");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  const btn = "rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50";

  return (
    <div className="space-y-5">
      {opportunity && (
        <div className="flex flex-wrap gap-2">
          {opportunity.capture_state === "captado" ? (
            opportunity.derivation_state === "derivado" ? (
              <button type="button" className={btn} disabled={busy} onClick={() => setForm({ accion: "no_derivar", label: "Volver a No derivado", field: "nota", placeholder: "Motivo" })}>
                Volver a No derivado
              </button>
            ) : (
              <button type="button" className="btn-gold px-3 py-1.5 text-xs" disabled={busy} onClick={() => setForm({ accion: "derivar", label: "Marcar Derivado", field: "destinatario", placeholder: "Destinatario (opcional)" })}>
                Marcar Derivado
              </button>
            )
          ) : (
            <button type="button" className={btn} disabled={busy} onClick={() => setForm({ accion: "captar", label: "Marcar Captado", field: "nota", placeholder: "Qué aceptó la persona (evidencia)" })}>
              Marcar Captado
            </button>
          )}
          {opportunity.capture_state !== "perdido" && (
            <button type="button" className={btn} disabled={busy} onClick={() => setForm({ accion: "perder", label: "Marcar Perdido", field: "motivo", placeholder: "Motivo" })}>
              Marcar Perdido
            </button>
          )}
          {opportunity.attention_state !== "humano_en_curso" ? (
            <button type="button" className={btn} disabled={busy} onClick={() => run("atencion", { estado: "humano_en_curso" })}>
              Tomar (atención humana)
            </button>
          ) : (
            <button type="button" className={btn} disabled={busy} onClick={() => run("atencion", { estado: "ia" })}>
              Devolver a la IA
            </button>
          )}
          {opportunity.followup_state === "activo" && (
            <>
              <button type="button" className={btn} disabled={busy} onClick={() => setForm({ accion: "seguimiento", label: "Seguimiento completado", field: "nota", placeholder: "Nota del seguimiento", extra: { estado: "completado" } })}>
                Seguimiento completado
              </button>
              <button type="button" className={btn} disabled={busy} onClick={() => setForm({ accion: "seguimiento", label: "Seguimiento caído", field: "nota", placeholder: "Por qué se cae", extra: { estado: "caido" } })}>
                Seguimiento caído
              </button>
            </>
          )}
          {opportunity.review_required && (
            <button type="button" className={btn} disabled={busy} onClick={() => setForm({ accion: "revisado", label: "Marcar revisado", field: "nota", placeholder: "Nota de la revisión" })}>
              Marcar revisado
            </button>
          )}
          {!detention && (
            <button type="button" className={btn} disabled={busy} onClick={() => setForm({ accion: "detener", label: "Detener contacto", field: "nota", placeholder: "Nota (opcional)" })}>
              Detener contacto…
            </button>
          )}
        </div>
      )}

      {form && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-3">
          {form.accion === "detener" && (
            <select value={detMotive} onChange={(e) => setDetMotive(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus-gold">
              {Object.entries(DETENTION_OPTIONS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          )}
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={form.placeholder} className="min-w-[14rem] flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus-gold" autoFocus />
          {form.accion === "derivar" && (
            <input value={value2} onChange={(e) => setValue2(e.target.value)} placeholder="Nota (opcional)" className="min-w-[10rem] flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus-gold" />
          )}
          <button
            type="button"
            disabled={busy}
            className="btn-gold px-3 py-1.5 text-xs"
            onClick={() =>
              form.accion === "detener"
                ? detener()
                : run(form.accion, form.accion === "derivar" ? { destinatario: value, nota: value2 } : { ...(form.extra ?? {}), [form.field]: value })
            }
          >
            {busy ? "Guardando..." : form.label}
          </button>
          <button type="button" onClick={() => setForm(null)} className="text-xs text-slate-500 hover:underline">
            Cancelar
          </button>
        </div>
      )}
      {msg && <p className={`text-xs ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.text}</p>}

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Texto para compartir</h3>
        {faltantes.length > 0 && (
          <p className="mb-2 text-xs text-amber-700">
            Datos faltantes: {faltantes.join(", ")}. Se puede compartir y derivar igual.
          </p>
        )}
        {optionalFields.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {optionalFields.map((f) => (
              <label key={f.key} className="flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={chosen.includes(f.key)}
                  onChange={(e) => setChosen(e.target.checked ? [...chosen, f.key] : chosen.filter((k) => k !== f.key))}
                />
                {f.label}
              </label>
            ))}
          </div>
        )}
        <pre className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 font-sans text-sm text-slate-800">{text}</pre>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={copy} className={btn}>
            {copied ? "Copiado ✓" : "Copiar"}
          </button>
          <button type="button" onClick={share} className={btn}>
            Compartir…
          </button>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Compartir o copiar no cambia el estado. Después de entregarlo, marcá Derivado.</p>
      </div>
    </div>
  );
}
