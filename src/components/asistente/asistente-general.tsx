import Link from "next/link";
import { Icono } from "@/components/ui/icono-seccion";

/**
 * Acceso al asistente general desde la pantalla de Perfiles. Desde el 15/11
 * el asistente tiene su pantalla propia (/asistente): la semana de todo el
 * panel, accesos directos y el chat grande, en vez del diálogo al costado.
 */
export function AsistenteGeneral() {
  return (
    <section aria-labelledby="asistente-general-titulo" className="mt-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-700">
          <Icono nombre="asistente" className="h-6 w-6" />
        </span>
        <div>
          <h2 id="asistente-general-titulo" className="text-xl font-semibold text-slate-900">
            Asistente general
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            La semana de los cuatro perfiles y un asistente que te ayuda con campañas desde planillas, bots, publicaciones y chats. Nada cambia hasta que confirmes.
          </p>
        </div>
      </div>
      <Link href="/asistente" prefetch={false} className="btn-gold min-h-[44px] shrink-0">
        <Icono nombre="asistente" className="h-4 w-4" />
        Abrir el asistente
      </Link>
    </section>
  );
}
