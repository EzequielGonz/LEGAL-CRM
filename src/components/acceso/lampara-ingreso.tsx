"use client";

import { useState } from "react";

/**
 * Escena de bienvenida del ingreso (16/10, «Lamp Login»): una lámpara de pie
 * con cordón. Al tirar del cordón se prende o se apaga la luz cálida que
 * ilumina la tarjeta del PIN. Solo visual: no cambia nada del ingreso.
 */
export function LamparaIngreso({ children }: { children: React.ReactNode }) {
  const [prendida, setPrendida] = useState(true);
  const [tirando, setTirando] = useState(false);

  function tirar() {
    setTirando(true);
    setPrendida((v) => !v);
    window.setTimeout(() => setTirando(false), 350);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#120d0a] px-4 py-10">
      {/* Cono de luz y resplandor */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none"
        style={{
          opacity: prendida ? 1 : 0.08,
          background:
            "radial-gradient(60% 55% at 28% 30%, rgba(255,196,120,0.22), transparent 70%), conic-gradient(from 160deg at 28% 26%, transparent 0deg, rgba(255,190,110,0.16) 18deg, rgba(255,190,110,0.05) 42deg, transparent 60deg)",
        }}
      />
      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-10 lg:flex-row lg:justify-between">
        {/* Lámpara (oculta en teléfonos chicos para no empujar el formulario) */}
        <div className="relative hidden h-[420px] w-[220px] shrink-0 sm:block">
          {/* Pantalla */}
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-6 h-24 w-40 -translate-x-1/2 transition-[filter,background] duration-700 motion-reduce:transition-none"
            style={{
              clipPath: "polygon(22% 0, 78% 0, 100% 100%, 0 100%)",
              background: prendida ? "linear-gradient(180deg,#f7d9a8,#e9b46b)" : "linear-gradient(180deg,#5b4733,#3a2d21)",
              filter: prendida ? "drop-shadow(0 0 28px rgba(255,190,110,0.55))" : "none",
            }}
          />
          {/* Lamparita */}
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-[118px] h-6 w-6 -translate-x-1/2 rounded-full transition-all duration-700 motion-reduce:transition-none"
            style={{ background: prendida ? "#fff3d6" : "#6b5a46", boxShadow: prendida ? "0 0 30px 10px rgba(255,214,150,0.6)" : "none" }}
          />
          {/* Pie */}
          <div aria-hidden="true" className="absolute left-1/2 top-[132px] h-[250px] w-2 -translate-x-1/2 rounded bg-gradient-to-b from-[#2b231c] to-[#120d0a]" />
          <div aria-hidden="true" className="absolute left-1/2 top-[250px] h-2 w-4 -translate-x-1/2 rounded bg-[#b08a4a]" />
          <div aria-hidden="true" className="absolute bottom-6 left-1/2 h-4 w-28 -translate-x-1/2 rounded-[50%] bg-[#1c1611] shadow-[0_6px_18px_rgba(0,0,0,0.7)]" />
          {/* Cordón: el botón real, accesible con teclado */}
          <button
            type="button"
            onClick={tirar}
            aria-pressed={prendida}
            aria-label={prendida ? "Apagar la luz" : "Prender la luz"}
            className="group absolute left-[calc(50%+34px)] top-[112px] z-20 flex flex-col items-center"
          >
            <span
              className="block w-px bg-[#c9a36a] transition-all duration-300 motion-reduce:transition-none"
              style={{ height: tirando ? 92 : 70 }}
            />
            <span className="block h-3 w-3 rounded-full border border-[#c9a36a] bg-[#e7c48a] shadow group-focus-visible:ring-2 group-focus-visible:ring-amber-300" />
            <span className="mt-2 whitespace-nowrap text-[10px] uppercase tracking-[0.2em] text-[#c9a36a]/80">
              {prendida ? "Tirá para apagar" : "Tirá para prender"}
            </span>
          </button>
        </div>
        {/* Tarjeta del ingreso */}
        <div
          className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-1 backdrop-blur-md transition-shadow duration-700 motion-reduce:transition-none"
          style={{ boxShadow: prendida ? "0 0 60px rgba(255,190,110,0.18)" : "0 0 0 rgba(0,0,0,0)" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
