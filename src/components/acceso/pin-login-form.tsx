"use client";

import { useState } from "react";
import { MarcaPanel } from "@/components/ui/marca-panel";
import { Paralaje } from "@/components/vivo/paralaje";
import { Cartel } from "@/components/vivo/cartel";

export function PinLoginForm({ configured, next }: { configured: boolean; next: string | null }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sacudir, setSacudir] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  function avisarError(msg: string) {
    setError(msg);
    setSacudir(true);
    window.setTimeout(() => setSacudir(false), 450);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // 15/11: los códigos nuevos tienen 8 números; el anterior de 6 sigue sirviendo.
    if (!/^(\d{6}|\d{8})$/.test(pin)) {
      avisarError("El PIN tiene 8 números (o 6, si todavía no lo cambiaste).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/acceso/ingresar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        avisarError(data.error ?? "No se pudo ingresar.");
        setPin("");
        setLoading(false);
        return;
      }
      // Navegación completa: así el servidor ya ve la cookie nueva.
      // Vuelta 6: transición al entrar (la tarjeta se agranda y se desvanece) antes de cambiar de pantalla.
      const destino = data.next ?? "/inicio";
      const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setSaliendo(true);
      window.setTimeout(() => window.location.assign(destino), quieto ? 0 : 480);
    } catch {
      avisarError("No hay conexión con el servidor. Probá de nuevo.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`pin-tarjeta${sacudir ? " pin-sacudida" : ""}${saliendo ? " vv-saliendo" : ""}`}
      aria-busy={loading}
    >
      {/* Vuelta 6: escena parallax en capas con el logo que se dibuja (trazo animado). */}
      <Paralaje compacta className="vv-ingreso-escena">
        <span className="vv-logo-trazo">
          <MarcaPanel animada />
          <svg className="vv-trazo" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <rect x="2" y="2" width="96" height="96" rx="24" pathLength={1} vectorEffect="non-scaling-stroke" />
          </svg>
        </span>
      </Paralaje>
      <div className="mb-6 flex flex-col items-center text-center">
        {/* 22/11: rótulo mono como /cerebro, arriba del título. */}
        <p className="pin-kicker mb-2">Acceso privado · 4 perfiles</p>
        <Cartel como="h1" tamano="l" texto="Panel [central]" retrasoMs={250} className="pin-titulo" />
        <p className="pin-bajada mt-1.5 text-sm">Ingresá el PIN del panel para entrar.</p>
      </div>

      {!configured ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          El PIN todavía no está configurado. Hay que cargar la variable privada{" "}
          <span className="font-mono">ACCESS_PIN</span> (8 números) en el servidor y volver a entrar.
        </p>
      ) : (
        <>
          <label htmlFor="pin" className="pin-etiqueta">
            PIN
          </label>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            pattern="\d{6}|\d{8}"
            maxLength={8}
            required
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "pin-error" : undefined}
            className="pin-campo"
          />
          {error && (
            <p id="pin-error" role="alert" className="pin-error animate-fade-in">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading || (pin.length !== 6 && pin.length !== 8)} className="btn-gold pin-boton w-full">
            {loading ? (
              <>
                <span className="pin-spinner" aria-hidden="true" /> Ingresando...
              </>
            ) : (
              <>
                Ingresar <span className="flecha-desliza" aria-hidden="true">→</span>
              </>
            )}
          </button>
        </>
      )}
    </form>
  );
}
