"use client";

import { useState } from "react";
import clsx from "clsx";

export default function LandingPage() {
  const [area, setArea] = useState<"civil" | "penal">("civil");
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", consulta: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch("/api/landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, area }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="mb-2 text-2xl font-semibold text-slate-900">¡Listo, recibimos tu consulta!</h1>
          <p className="text-slate-600">
            En breve nos contactamos con vos por WhatsApp para coordinar los próximos pasos.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <section className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-4 py-16 md:flex-row md:py-24">
        <div className="flex-1">
          <span className="mb-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/70">
            Asesoramiento legal inicial gratuito
          </span>
          <h1 className="mb-4 text-3xl font-bold leading-tight md:text-4xl">
            Contanos tu situación y te ayudamos a dar el primer paso
          </h1>
          <p className="mb-6 text-white/70">
            Equipo de estudios jurídicos en las áreas Civil y Penal. Completá el formulario y un
            especialista se pone en contacto para coordinar tu consulta, sin costo ni compromiso.
          </p>
          <ul className="space-y-2 text-sm text-white/70">
            <li>✔ Respuesta rápida por WhatsApp</li>
            <li>✔ Evaluación inicial de tu caso sin cargo</li>
            <li>✔ Te derivamos con el estudio adecuado para tu consulta</li>
          </ul>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md flex-1 rounded-2xl bg-white p-6 text-slate-900 shadow-xl md:p-8"
        >
          <div className="mb-4 flex rounded-lg bg-slate-100 p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setArea("civil")}
              className={clsx(
                "flex-1 rounded-md py-2 transition",
                area === "civil" ? "bg-white shadow text-civil" : "text-slate-500"
              )}
            >
              Consulta Civil
            </button>
            <button
              type="button"
              onClick={() => setArea("penal")}
              className={clsx(
                "flex-1 rounded-md py-2 transition",
                area === "penal" ? "bg-white shadow text-penal" : "text-slate-500"
              )}
            >
              Consulta Penal
            </button>
          </div>

          <div className="space-y-3">
            <input
              required
              placeholder="Nombre y apellido"
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
            />
            <input
              required
              placeholder="WhatsApp (ej: 5491122223333)"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
            />
            <input
              type="email"
              placeholder="Email (opcional)"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
            />
            <textarea
              required
              placeholder="Contanos brevemente tu consulta"
              rows={4}
              value={form.consulta}
              onChange={(e) => setForm((f) => ({ ...f, consulta: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={status === "sending"}
            className={clsx(
              "mt-4 w-full rounded-lg py-3 text-sm font-semibold text-white transition disabled:opacity-60",
              area === "civil" ? "bg-civil" : "bg-penal"
            )}
          >
            {status === "sending" ? "Enviando..." : "Quiero mi consulta gratuita"}
          </button>

          {status === "error" && (
            <p className="mt-3 text-center text-sm text-red-600">
              Hubo un problema al enviar tu consulta. Probá de nuevo en unos minutos.
            </p>
          )}

          <p className="mt-3 text-center text-xs text-slate-400">
            Al enviar aceptás que te contactemos por WhatsApp para coordinar tu consulta.
          </p>
        </form>
      </section>
    </main>
  );
}
