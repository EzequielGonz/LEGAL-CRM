"use client";

import { useState } from "react";

export function PinLoginForm({ configured, next }: { configured: boolean; next: string | null }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(pin)) {
      setError("El PIN tiene 6 números.");
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
        setError(data.error ?? "No se pudo ingresar.");
        setPin("");
        setLoading(false);
        return;
      }
      // Navegación completa: así el servidor ya ve la cookie nueva.
      window.location.assign(data.next ?? "/inicio");
    } catch {
      setError("No hay conexión con el servidor. Probá de nuevo.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full max-w-sm animate-scale-in rounded-2xl border border-white/10 bg-white/95 p-8 shadow-navy backdrop-blur"
    >
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 font-serif text-lg font-bold text-slate-950 shadow-gold">
          E
        </span>
        <h1 className="font-serif text-xl font-semibold text-slate-900">Panel de Captación</h1>
        <p className="mt-1 text-sm text-slate-500">Ingresá el PIN del panel.</p>
      </div>

      {!configured ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          El PIN todavía no está configurado. Hay que cargar la variable privada{" "}
          <span className="font-mono">ACCESS_PIN</span> (6 números) en el servidor y volver a entrar.
        </p>
      ) : (
        <>
          <label htmlFor="pin" className="mb-1 block text-sm font-medium text-slate-700">
            PIN
          </label>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            pattern="\d{6}"
            maxLength={6}
            required
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-center font-mono text-2xl tracking-[0.5em] outline-none focus-gold"
          />

          {error && <p className="mb-4 animate-fade-in text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading || pin.length !== 6} className="btn-gold w-full py-2.5">
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </>
      )}
    </form>
  );
}
