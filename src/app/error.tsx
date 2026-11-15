"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Pantalla de error común (15/11): si una pantalla falla al armarse, se avisa en
 * castellano y se ofrece reintentar o volver a Hoy, sin mostrar detalles técnicos.
 */
export default function ErrorDePantalla({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[pantalla] Error al mostrar la pantalla:", error.digest ?? error.message);
  }, [error]);

  return (
    <main id="contenido" tabIndex={-1} className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <section role="alert" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-950">Algo salió mal al mostrar esta pantalla</h1>
        <p className="mt-2 text-sm text-slate-700">No se perdió nada. Podés reintentar ahora o volver a Hoy y entrar de nuevo.</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link href="/hoy" className="btn-suave tactil inline-flex items-center justify-center">
            Volver a Hoy
          </Link>
          <button type="button" onClick={() => reset()} className="btn-gold tactil">
            Reintentar
          </button>
        </div>
      </section>
    </main>
  );
}
