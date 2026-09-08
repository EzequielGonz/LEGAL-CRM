"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      {/* Glow decorativo dorado, puramente ambiental */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 animate-float rounded-full bg-gold-500/10 blur-3xl" />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 animate-float rounded-full bg-gold-500/10 blur-3xl"
        style={{ animationDelay: "1.2s" }}
      />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm animate-scale-in rounded-2xl border border-white/10 bg-white/95 p-8 shadow-navy backdrop-blur"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 font-serif text-lg font-bold text-slate-950 shadow-gold">
            E
          </span>
          <h1 className="font-serif text-xl font-semibold text-slate-900">
            Panel de Captación
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Ingresá con tu cuenta de administrador.
          </p>
        </div>

        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        />

        <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        />

        {error && (
          <p className="mb-4 animate-fade-in text-sm text-red-600">{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-gold w-full py-2.5">
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
