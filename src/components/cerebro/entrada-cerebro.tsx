import Link from "next/link";
import { ALERTAS, PREGUNTAS_ABIERTAS, conteoAlertas } from "@/lib/cerebro/contenido";

/**
 * Acceso al Cerebro del negocio arriba de todo en la selección de perfiles
 * (21/11, pedido de los dueños).
 */
export function EntradaCerebro() {
  const c = conteoAlertas(ALERTAS);
  return (
    <section
      aria-labelledby="entrada-cerebro-titulo"
      className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-white shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-500/20 text-gold-300">
          <IconoCerebro />
        </span>
        <div>
          <h2 id="entrada-cerebro-titulo" className="text-lg font-semibold">
            Cerebro del negocio
          </h2>
          <p className="mt-0.5 max-w-2xl text-sm text-slate-300">
            Lo que Claude entiende del panel, lo que ve esta semana, {c.alta} alertas altas y {PREGUNTAS_ABIERTAS.length} preguntas para ustedes. Desde ahí le pueden escribir.
          </p>
        </div>
      </div>
      <Link href="/cerebro" prefetch={false} className="btn-gold min-h-[44px] shrink-0">
        Abrir el cerebro
      </Link>
    </section>
  );
}

export function IconoCerebro({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true" focusable="false">
      <path
        d="M9 4.5a3 3 0 0 0-3 3v.2A3 3 0 0 0 4.5 13a3 3 0 0 0 1.8 4.6A3 3 0 0 0 9 19.5a2.5 2.5 0 0 0 3-.6V5.4a2.6 2.6 0 0 0-3-.9ZM15 4.5a3 3 0 0 1 3 3v.2A3 3 0 0 1 19.5 13a3 3 0 0 1-1.8 4.6 3 3 0 0 1-2.7 1.9 2.5 2.5 0 0 1-3-.6"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.5 10.5c1 0 1.8.6 2 1.5M15.5 10.5c-1 0-1.8.6-2 1.5M8 15h1.5M16 15h-1.5" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
    </svg>
  );
}
