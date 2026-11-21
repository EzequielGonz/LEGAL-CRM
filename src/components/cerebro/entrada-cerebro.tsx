import Link from "next/link";

/**
 * Acceso al Cerebro del negocio en Inicio (21/11): una píldora chica, con
 * un punto que late, que abre el cerebro en una pestaña nueva.
 */
export function EntradaCerebro() {
  return (
    <div className="mb-6 flex justify-center">
      <Link
        href="/cerebro"
        prefetch={false}
        target="_blank"
        rel="noopener"
        className="group inline-flex min-h-[40px] items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 text-sm font-medium text-white/90 backdrop-blur transition hover:border-[#ff4f9a]/70 hover:bg-[#ff4f9a]/10 hover:text-white motion-safe:hover:-translate-y-px"
      >
        <span aria-hidden="true" className="relative grid h-2.5 w-2.5 place-items-center">
          <span className="absolute inset-0 rounded-full bg-[#ff4f9a] opacity-70 motion-safe:animate-ping" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-[#ff4f9a] shadow-[0_0_10px_#ff4f9a]" />
        </span>
        Cerebro del negocio
        <span aria-hidden="true" className="text-white/50 transition group-hover:translate-x-0.5 group-hover:text-white">
          ↗
        </span>
        <span className="sr-only">(se abre en una pestaña nueva)</span>
      </Link>
    </div>
  );
}
