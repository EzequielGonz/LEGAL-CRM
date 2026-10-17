import Link from "next/link";
import { EnlaceAvanzado } from "@/components/nivel/nivel";

export type TonoResumen = "bloqueo" | "atencion" | "ok" | "info";

export interface PuntoResumen {
  texto: string;
  /** Cantidad a la vista; null = no se pudo leer («Sin datos», nunca cero). */
  cantidad?: number | null;
  href?: string;
  tono?: TonoResumen;
  /** Una línea más de contexto, en lenguaje llano. */
  detalle?: string;
}

export interface AccionResumen {
  texto: string;
  href: string;
}

const BORDE: Record<TonoResumen, string> = {
  bloqueo: "border-l-red-600",
  atencion: "border-l-amber-500",
  ok: "border-l-emerald-600",
  info: "border-l-slate-400",
};

/**
 * Enlace del resumen. Un destino dentro de la misma página (#ancla) va con
 * un <a> común: así el navegador desplaza, actualiza la dirección y avisa el
 * cambio de ancla (lo usan, por ejemplo, «Probar una conversación» o las
 * listas de Seguimiento). El resto, con la navegación de Next.
 */
function Enlace({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  if (href.startsWith("#")) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

const ETIQUETA_TONO: Record<TonoResumen, string> = {
  bloqueo: "Frena el trabajo",
  atencion: "Requiere atención",
  ok: "En orden",
  info: "Para tener en cuenta",
};

/**
 * Resumen del nivel Simple para cualquier sección (rediseño 17/10, bloque 3):
 * qué pasa, qué requiere atención, la tarea principal en un paso y el acceso
 * a «Personalizar» en Avanzado. Se oculta en Avanzado sin desmontarse; la
 * capacidad completa de la sección sigue debajo, igual en los dos niveles o
 * marcada como `solo-avanzado`. No guarda ni envía nada.
 */
export function ResumenSeccion({
  id,
  etiqueta = "Ahora",
  estado,
  detalle,
  tono = "info",
  puntos = [],
  vacio,
  principal,
  secundarias = [],
  personalizar,
}: {
  id?: string;
  etiqueta?: string;
  /** Qué pasa, en una frase. */
  estado: string;
  detalle?: React.ReactNode;
  tono?: TonoResumen;
  puntos?: PuntoResumen[];
  /** Texto cuando no hay nada que atender. */
  vacio?: string;
  principal?: AccionResumen | null;
  secundarias?: AccionResumen[];
  /** Abre Avanzado en el apartado exacto (ruta y/o #ancla). */
  personalizar?: { href: string; texto?: string } | null;
}) {
  const titulo = id ? `${id}-titulo` : undefined;
  return (
    <section aria-labelledby={titulo} className={`resumen-seccion solo-simple rounded-2xl border border-slate-300 border-l-4 bg-white p-5 sm:p-6 ${BORDE[tono]}`}>
      <p className="text-sm font-medium text-slate-600">
        {etiqueta} <span className="sr-only">· {ETIQUETA_TONO[tono]}</span>
      </p>
      <h2 id={titulo} className="mt-1 text-xl font-semibold text-slate-900 [overflow-wrap:anywhere]">
        {estado}
      </h2>
      {detalle ? <div className="mt-1 max-w-2xl text-sm text-slate-700">{detalle}</div> : null}

      {puntos.length > 0 ? (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {puntos.map((p) => {
            const cuerpo = (
              <>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-900 [overflow-wrap:anywhere]">{p.texto}</span>
                  {p.detalle ? <span className="mt-0.5 block text-xs text-slate-600">{p.detalle}</span> : null}
                </span>
                {p.cantidad !== undefined ? (
                  <span className="shrink-0 text-lg font-semibold tabular-nums text-slate-900">
                    {p.cantidad === null ? "Sin datos" : p.cantidad.toLocaleString("es-AR")}
                  </span>
                ) : null}
              </>
            );
            const clase = `flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-slate-200 border-l-4 bg-white px-3 py-2 ${BORDE[p.tono ?? "info"]}`;
            return (
              <li key={p.texto}>
                {p.href ? (
                  <Enlace href={p.href} className={`${clase} hover:border-slate-400 hover:bg-slate-50`}>
                    {cuerpo}
                  </Enlace>
                ) : (
                  <div className={clase}>{cuerpo}</div>
                )}
              </li>
            );
          })}
        </ul>
      ) : vacio ? (
        <p className="mt-3 text-sm text-slate-700">{vacio}</p>
      ) : null}

      {principal || secundarias.length || personalizar ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {principal ? (
            <Enlace href={principal.href} className="tactil inline-flex items-center rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800">
              {principal.texto}
            </Enlace>
          ) : null}
          {secundarias.map((a) => (
            <Enlace key={a.texto} href={a.href} className="tactil inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-50">
              {a.texto}
            </Enlace>
          ))}
          {personalizar ? (
            <EnlaceAvanzado href={personalizar.href} className="tactil ml-auto inline-flex items-center gap-1.5 px-2 text-sm font-medium text-slate-700 underline underline-offset-2 hover:text-slate-950">
              {personalizar.texto ?? "Personalizar"}
            </EnlaceAvanzado>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/** Título de la parte completa (solo Avanzado) para que se entienda dónde empieza. */
export function TituloAvanzado({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="solo-avanzado mb-3 text-base font-semibold text-slate-900">
      {children}
    </h2>
  );
}
