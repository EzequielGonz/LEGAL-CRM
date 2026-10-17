"use client";

import { useState } from "react";

const EVENT_LABEL: Record<string, string> = {
  ingreso: "Ingreso",
  ingreso_fallido: "PIN incorrecto",
  bloqueo_origen: "Pausa de 15 minutos para un origen",
  intento_bloqueado: "Intento durante la pausa",
  salida: "Cierre de sesión",
  cambio_pin: "Cambio de PIN",
  cambio_pin_fallido: "Cambio de PIN rechazado",
  recuperacion_pin: "Recuperación del PIN",
  pin_inicial: "PIN inicial cargado",
  cierre_todas_sesiones: "Cierre en los demás dispositivos",
  pausa_general: "Cambio en la pausa general",
};

export interface AccessEventRow {
  id: number;
  at: string;
  kind: string;
  device: string | null;
}

function PinInput(props: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      aria-label={props.placeholder}
      autoComplete="off"
      type="password"
      inputMode="numeric"
      maxLength={6}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      placeholder={props.placeholder}
      className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-center font-mono text-sm tracking-widest outline-none focus-gold"
    />
  );
}

export function AccessSettings({
  pinSource,
  pinUpdatedAt,
  events,
}: {
  pinSource: string | null;
  pinUpdatedAt: string | null;
  events: AccessEventRow[];
}) {
  const [actual, setActual] = useState("");
  const [nuevo, setNuevo] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [pinOtras, setPinOtras] = useState("");
  const [msgOtras, setMsgOtras] = useState<{ ok: boolean; text: string } | null>(null);

  async function cambiar() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/acceso/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actual, nuevo, confirmacion }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setMsg({ ok: false, text: data.error ?? "No se pudo cambiar el PIN." });
      else {
        setMsg({ ok: true, text: "PIN cambiado. Las sesiones abiertas siguen abiertas." });
        setActual("");
        setNuevo("");
        setConfirmacion("");
      }
    } finally {
      setBusy(false);
    }
  }

  async function cerrarOtras() {
    setMsgOtras(null);
    const res = await fetch("/api/acceso/cerrar-otras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: pinOtras }),
    });
    const data = await res.json().catch(() => ({}));
    setPinOtras("");
    setMsgOtras(
      res.ok
        ? { ok: true, text: "Listo: los demás dispositivos van a tener que ingresar de nuevo (puede tardar hasta 30 segundos)." }
        : { ok: false, text: data.error ?? "No se pudo." }
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-500">
        PIN general de 6 números, sin vencimiento. La sesión de cada dispositivo sigue abierta hasta que se cierra a mano.
        Después de 5 intentos fallidos desde un mismo dispositivo o red, ese origen espera 15 minutos (no afecta a las sesiones abiertas).
        {pinUpdatedAt && (
          <>
            {" "}Último cambio: {new Date(pinUpdatedAt).toLocaleString("es-AR")}
            {pinSource === "inicial" ? " (PIN inicial)" : pinSource === "recuperacion" ? " (recuperación)" : " (desde el panel)"}.
          </>
        )}
      </p>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Cambiar el PIN</h3>
        <div className="flex flex-wrap items-center gap-2">
          <PinInput value={actual} onChange={setActual} placeholder="PIN actual" />
          <PinInput value={nuevo} onChange={setNuevo} placeholder="PIN nuevo" />
          <PinInput value={confirmacion} onChange={setConfirmacion} placeholder="Repetir nuevo" />
          <button
            type="button"
            onClick={cambiar}
            disabled={busy || actual.length !== 6 || nuevo.length !== 6 || confirmacion.length !== 6}
            className="btn-gold"
          >
            {busy ? "Guardando..." : "Cambiar PIN"}
          </button>
        </div>
        <p role="status" className={`mt-2 text-sm ${msg?.ok ? "text-green-700" : "font-medium text-red-700"}`}>{msg?.text ?? ""}</p>
        <p className="mt-2 text-[11px] text-slate-400">
          Si se olvida el PIN: cargar un valor nuevo en la variable privada ACCESS_PIN_RESET del servidor (se aplica una sola vez).
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Cerrar sesión en los demás dispositivos</h3>
        <div className="flex flex-wrap items-center gap-2">
          <PinInput value={pinOtras} onChange={setPinOtras} placeholder="PIN" />
          <button
            type="button"
            onClick={cerrarOtras}
            disabled={pinOtras.length !== 6}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cerrar en los demás
          </button>
        </div>
        <p role="status" className={`mt-2 text-sm ${msgOtras?.ok ? "text-green-700" : "font-medium text-red-700"}`}>{msgOtras?.text ?? ""}</p>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Últimos accesos</h3>
        {events.length === 0 ? (
          <p className="text-xs text-slate-400">Todavía no hay registros.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-xs">
            {events.map((e) => (
              <li key={e.id} className="flex justify-between gap-3 py-1.5">
                <span className="text-slate-700">{EVENT_LABEL[e.kind] ?? e.kind}</span>
                <span className="text-slate-400">
                  {e.device ? `${e.device} · ` : ""}
                  {new Date(e.at).toLocaleString("es-AR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
