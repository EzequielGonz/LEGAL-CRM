"use client";

import { useState } from "react";
import { etiquetaEstadoNumero, pasoSiguiente, type NumeroCuenta } from "@/lib/whatsapp/verificar-numero";

type NumeroVista = NumeroCuenta & { esElDeLaLinea: boolean };
type Mensaje = { ok: boolean; texto: string } | null;

/**
 * Verificar y registrar el número de una línea que quedó «Pendiente» en Meta
 * (19/10). Lee los números de la cuenta de la línea y guía los tres pasos:
 * pedir el código (llega al propio número), confirmarlo y registrar con un PIN.
 * El código y el PIN solo viajan a Meta: no se guardan.
 */
export function VerificarNumero({ lineId, onCambio }: { lineId: string; onCambio?: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [numeros, setNumeros] = useState<NumeroVista[] | null>(null);
  const [variable, setVariable] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<Mensaje>(null);
  const [codigo, setCodigo] = useState("");
  const [pin, setPin] = useState("");

  async function cargar() {
    setOcupado(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/lineas/numero?line_id=${encodeURIComponent(lineId)}`, { cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ ok: false, texto: j?.error ?? "No se pudo consultar a Meta." });
        return;
      }
      setNumeros(j.numeros ?? []);
      setVariable(j.variable ?? "");
    } catch {
      setMsg({ ok: false, texto: "No se pudo consultar a Meta." });
    } finally {
      setOcupado(false);
    }
  }

  async function paso(numeroId: string, accion: "pedir_codigo" | "verificar" | "registrar", extra: Record<string, unknown> = {}) {
    setOcupado(true);
    setMsg(null);
    try {
      const res = await fetch("/api/lineas/numero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line_id: lineId, numero_id: numeroId, accion, ...extra }),
      });
      const j = await res.json().catch(() => ({}));
      setMsg({ ok: !!j?.ok, texto: j?.mensaje ?? j?.error ?? "No se pudo completar el paso." });
      if (j?.ok) {
        if (accion === "verificar") setCodigo("");
        if (accion === "registrar") setPin("");
        await cargar();
        onCambio?.();
      }
    } catch {
      setMsg({ ok: false, texto: "No se pudo completar el paso." });
    } finally {
      setOcupado(false);
    }
  }

  const campo = "w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus-gold";

  return (
    <div className="mt-2 text-xs">
      <button
        type="button"
        onClick={() => {
          setAbierto((v) => !v);
          if (!abierto && numeros === null) void cargar();
        }}
        aria-expanded={abierto}
        className="btn-suave-sm"
      >
        {abierto ? "Ocultar la verificación del número" : "Verificar el número en Meta"}
      </button>
      {abierto && (
        <div className="mt-2 space-y-3 rounded-lg bg-slate-50 p-3 text-slate-700">
          <p>
            El código de verificación llega al propio número (por SMS o llamada), no a ningún contacto. Los pasos son: pedir el código, confirmarlo y registrar el número con un PIN de 6 dígitos que elegís vos (guardalo).
          </p>
          {ocupado && <p>Consultando a Meta…</p>}
          {numeros && numeros.length === 0 && <p>Meta no informa ningún número en la cuenta de esta línea.</p>}
          {(numeros ?? []).map((n) => {
            const siguiente = pasoSiguiente(n);
            return (
              <div key={n.id} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                <p className="font-medium text-slate-800">
                  {n.telefono ?? "Número sin teléfono informado"} <span className="font-normal text-slate-500">· {etiquetaEstadoNumero(n)}</span>
                </p>
                <p className="text-slate-600">
                  Identificador del número en Meta: <span className="font-mono">{n.id}</span>
                  {n.esElDeLaLinea ? (
                    " · es el que tiene cargado esta línea"
                  ) : (
                    <span className="block text-amber-800">
                      No es el que tiene cargado la línea: para usar este número, cargá este identificador en la variable {variable} (Vercel) y volvé a desplegar.
                    </span>
                  )}
                </p>
                {siguiente === null ? (
                  <p className="text-emerald-800">Este número ya figura conectado.</p>
                ) : (
                  <div className="space-y-2">
                    {siguiente === "pedir_codigo" && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" disabled={ocupado} onClick={() => paso(n.id, "pedir_codigo", { metodo: "SMS" })} className="btn-suave-sm">
                          Pedir código por SMS
                        </button>
                        <button type="button" disabled={ocupado} onClick={() => paso(n.id, "pedir_codigo", { metodo: "VOICE" })} className="btn-suave-sm">
                          Pedir código por llamada
                        </button>
                      </div>
                    )}
                    {siguiente === "pedir_codigo" && (
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-2">
                          Código recibido
                          <input inputMode="numeric" autoComplete="one-time-code" maxLength={7} value={codigo} onChange={(e) => setCodigo(e.target.value)} className={campo} aria-label="Código de 6 dígitos" />
                        </label>
                        <button type="button" disabled={ocupado || codigo.replace(/\D/g, "").length !== 6} onClick={() => paso(n.id, "verificar", { codigo })} className="btn-suave-sm">
                          Confirmar código
                        </button>
                      </div>
                    )}
                    {siguiente === "registrar" && (
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-2">
                        PIN para registrar (6 dígitos)
                        <input inputMode="numeric" autoComplete="off" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} className={campo} aria-label="PIN de 6 dígitos" />
                      </label>
                      <button type="button" disabled={ocupado || pin.replace(/\D/g, "").length !== 6} onClick={() => paso(n.id, "registrar", { pin })} className="btn-suave-sm">
                        Registrar número
                      </button>
                    </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {msg && (
            <p role="status" className={msg.ok ? "text-emerald-800" : "text-red-700"}>
              {msg.texto}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
