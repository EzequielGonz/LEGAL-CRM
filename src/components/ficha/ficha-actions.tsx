"use client";

import { useEffect, useMemo, useState } from "react";
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
  chat = null,
}: {
  /** 13/11: estado real del chat (quién lo atiende), para tomarlo o devolverlo al bot desde la ficha. */
  chat?: { aiEnabled: boolean; esperaRespuesta: boolean; href: string | null } | null;
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
  const [confirmaDevolver, setConfirmaDevolver] = useState(false);
  // El cambio de quién atiende se ve al instante; cuando llegan los datos nuevos del servidor, mandan ellos.
  const [atiendeBot, setAtiendeBot] = useState<boolean | null>(null);
  useEffect(() => setAtiendeBot(null), [chat?.aiEnabled]);
  const botAtiende = atiendeBot ?? chat?.aiEnabled ?? false;

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
      if (!res.ok) setMsg({ ok: false, text: data.error ?? "No se pudo guardar. Probá de nuevo; si sigue, recargá la página." });
      else {
        const texto =
          accion === "atencion" && payload.estado === "ia"
            ? data.respondio
              ? "Listo: el bot volvió a atender y ya le contestó el mensaje que estaba esperando."
              : "Listo: el bot volvió a atender este chat. Va a responder cuando la persona escriba."
            : accion === "atencion"
              ? "Listo: el chat es tuyo. El bot no va a responder hasta que se lo devuelvas."
              : "Guardado.";
        setMsg({ ok: true, text: texto });
        if (accion === "atencion") setAtiendeBot(payload.estado === "ia");
        setForm(null);
        setConfirmaDevolver(false);
        setValue("");
        setValue2("");
        router.refresh();
      }
    } catch {
      setMsg({ ok: false, text: "No hay conexión con el panel. Revisá internet y probá de nuevo." });
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

  const btn = "btn-suave-sm disabled:opacity-50";
  const captado = opportunity?.capture_state === "captado";

  return (
    <div className="space-y-5">
      {opportunity && chat && (
        <section aria-labelledby="ficha-quien" className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 id="ficha-quien" className="text-[13px] font-medium text-slate-600">
                Quién atiende este chat
              </h3>
              <p className="text-base font-semibold text-slate-950">{detention ? "Nadie: el contacto está detenido" : botAtiende ? "El bot" : "Una persona del equipo"}</p>
              <p className="mt-0.5 text-[13px] text-slate-600">
                {detention
                  ? "No sale ningún mensaje automático. Para volver a atenderlo, primero hay que levantar la detención."
                  : botAtiende
                    ? captado
                      ? "Ya está captado: el bot no sigue vendiendo. Si escribe, pasa a una persona."
                      : "Responde solo. Si querés escribirle vos, tomá el chat."
                    : chat.esperaRespuesta
                      ? "Escribió y está esperando. El bot no le contesta mientras el chat sea tuyo."
                      : "El bot no responde en este chat hasta que se lo devuelvas."}
              </p>
            </div>
            {!detention && (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {chat.href ? (
                  <a href={chat.href} className={chat.esperaRespuesta && !botAtiende ? "btn-gold-sm" : btn}>
                    {chat.esperaRespuesta && !botAtiende ? "Responder" : "Abrir el chat"}
                  </a>
                ) : null}
                {botAtiende ? (
                  <button type="button" className={btn} disabled={busy} onClick={() => run("atencion", { estado: "humano_en_curso" })}>
                    {busy ? "Guardando…" : "Tomar el chat"}
                  </button>
                ) : captado ? null : (
                  <button type="button" className={chat.esperaRespuesta ? btn : "btn-gold-sm"} disabled={busy} onClick={() => setConfirmaDevolver(true)}>
                    Devolver al bot
                  </button>
                )}
              </div>
            )}
          </div>
          {confirmaDevolver && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-sm text-slate-800">
                El bot vuelve a atender este chat.{" "}
                {chat.esperaRespuesta
                  ? "Si el mensaje que quedó sin respuesta es de las últimas 23 horas, el bot le contesta ahora (respeta el horario y las pausas)."
                  : "No manda nada ahora: responde cuando la persona vuelva a escribir."}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className="btn-gold-sm" disabled={busy} onClick={() => run("atencion", { estado: "ia" })}>
                  {busy ? "Devolviendo…" : "Sí, devolver al bot"}
                </button>
                <button type="button" className={btn} disabled={busy} onClick={() => setConfirmaDevolver(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {opportunity && (
        <div className="flex flex-wrap gap-2">
          {opportunity.capture_state === "captado" ? (
            opportunity.derivation_state === "derivado" ? (
              <button type="button" className={btn} disabled={busy} onClick={() => setForm({ accion: "no_derivar", label: "Deshacer la derivación", field: "nota", placeholder: "Por qué se deshace" })}>
                Deshacer la derivación
              </button>
            ) : (
              <button type="button" className="btn-gold-sm" disabled={busy} onClick={() => setForm({ accion: "derivar", label: "Marcar como derivado", field: "destinatario", placeholder: "A quién se lo pasaste (opcional)" })}>
                Marcar como derivado
              </button>
            )
          ) : (
            <button type="button" className={btn} disabled={busy} onClick={() => setForm({ accion: "captar", label: "Marcar como captado", field: "nota", placeholder: "Qué aceptó la persona" })}>
              Marcar como captado
            </button>
          )}
          {opportunity.capture_state !== "perdido" && (
            <button type="button" className={btn} disabled={busy} onClick={() => setForm({ accion: "perder", label: "Cerrar como perdido", field: "motivo", placeholder: "Por qué se cierra" })}>
              Cerrar como perdido
            </button>
          )}
          {!chat &&
            (opportunity.attention_state !== "humano_en_curso" ? (
              <button type="button" className={btn} disabled={busy} onClick={() => run("atencion", { estado: "humano_en_curso" })}>
                Tomar el chat
              </button>
            ) : (
              <button type="button" className={btn} disabled={busy} onClick={() => run("atencion", { estado: "ia" })}>
                Devolver al bot
              </button>
            ))}
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
            <button type="button" className={btn} disabled={busy} onClick={() => setForm({ accion: "detener", label: "No escribirle más", field: "nota", placeholder: "Nota (opcional)" })}>
              No escribirle más…
            </button>
          )}
        </div>
      )}

      {form && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-3">
          {form.accion === "detener" && (
            <select value={detMotive} onChange={(e) => setDetMotive(e.target.value)} className="tactil rounded-lg border border-slate-300 px-2 text-sm outline-none focus-gold" aria-label="Motivo">
              {Object.entries(DETENTION_OPTIONS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          )}
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={form.placeholder} className="tactil min-w-[14rem] flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus-gold" aria-label={form.placeholder} autoFocus />
          {form.accion === "derivar" && (
            <input value={value2} onChange={(e) => setValue2(e.target.value)} placeholder="Nota (opcional)" className="tactil min-w-[10rem] flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus-gold" aria-label="Nota (opcional)" />
          )}
          <button
            type="button"
            disabled={busy}
            className="btn-gold-sm"
            onClick={() =>
              form.accion === "detener"
                ? detener()
                : run(form.accion, form.accion === "derivar" ? { destinatario: value, nota: value2 } : { ...(form.extra ?? {}), [form.field]: value })
            }
          >
            {busy ? "Guardando…" : form.label}
          </button>
          <button type="button" onClick={() => setForm(null)} className={btn}>
            Cancelar
          </button>
        </div>
      )}
      {msg && (
        <p role="status" className={`rounded-lg border px-3 py-2 text-sm font-medium ${msg.ok ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-red-300 bg-red-50 text-red-900"}`}>
          {msg.text}
        </p>
      )}

      <details open={captado} className="rounded-xl border border-slate-200 p-4">
        <summary className="tactil flex cursor-pointer items-center text-sm font-semibold text-slate-900">Datos para pasarle a quien lo atiende</summary>
        <div className="mt-3">
        {faltantes.length > 0 && (
          <p className="mb-2 text-[13px] text-amber-800">
            Falta: {faltantes.join(", ")}. Se puede compartir y derivar igual.
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
            {copied ? "Copiado" : "Copiar"}
          </button>
          <button type="button" onClick={share} className={btn}>
            Compartir…
          </button>
        </div>
        <p className="mt-2 text-[13px] text-slate-600">Copiar o compartir no cambia nada. Cuando se lo hayas pasado, tocá «Marcar como derivado».</p>
        </div>
      </details>
    </div>
  );
}
