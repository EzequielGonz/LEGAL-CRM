import Link from "next/link";
import { unstable_cache } from "next/cache";
import { leerSalud, resumenSalud, type ItemSalud } from "@/lib/salud";
import { lecturaSimple } from "@/lib/salud/reglas";
import { Icono } from "@/components/ui/icono-seccion";

const COLOR: Record<ItemSalud["estado"], string> = {
  rojo: "border-red-300 bg-red-50 text-red-900",
  amarillo: "border-amber-300 bg-amber-50 text-amber-900",
  verde: "border-emerald-300 bg-emerald-50 text-emerald-900",
};

/**
 * La barra es un resumen: se recalcula como mucho una vez por minuto en vez
 * de en cada navegación (son ~14 consultas). El tablero /salud sigue leyendo
 * en vivo.
 */
const saludResumida = unstable_cache(() => leerSalud(), ["barra-salud"], { revalidate: 60 });

/**
 * Barra de salud arriba de cada panel (16/10): lo que frena la operación se
 * ve apenas se entra, con el botón para resolverlo. Si está todo bien, un
 * aviso mínimo.
 */
export async function BarraSalud({ slug }: { slug: string }) {
  let items: ItemSalud[] = [];
  try {
    items = await saludResumida();
  } catch {
    return null;
  }
  const r = resumenSalud(items);
  const verTodo = `/salud?perfil=${encodeURIComponent(slug)}`;
  // Todo en orden: no se muestra nada (menos ruido). El detalle sigue en Inicio › Salud.
  if (r.rojo === 0 && r.amarillo === 0) return null;
  const urgentes = items.filter((i) => i.estado === "rojo").slice(0, 3);
  const mostrar = urgentes.length ? urgentes : items.filter((i) => i.estado === "amarillo").slice(0, 2);
  const titulo = r.rojo ? `${r.rojo} problema(s) frenan la operación` : `${r.amarillo} punto(s) para revisar`;
  const primero = lecturaSimple(mostrar[0]);
  return (
    <section aria-label="Salud del sistema" className={`barra-salud mb-5 rounded-xl border p-3 ${r.rojo ? COLOR.rojo : COLOR.amarillo}`}>
      {/* Simple: una línea con lo más importante. Los problemas se ven igual en los dos niveles. */}
      <div className="solo-simple flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="flex min-w-0 items-start gap-2 text-sm">
          {r.rojo ? <Icono nombre="alerta" className="mt-0.5 h-4 w-4 shrink-0" /> : null}
          <span className="min-w-0 [overflow-wrap:anywhere]">
            <strong className="font-semibold">{titulo}.</strong> {primero.que}
          </span>
        </p>
        <Link href={verTodo} className="shrink-0 rounded-lg bg-white/70 px-3 py-1 text-xs font-semibold underline">
          Ver qué hacer
        </Link>
      </div>
      <div className="solo-avanzado">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-semibold">
            {r.rojo ? <Icono nombre="alerta" className="h-4 w-4 shrink-0" /> : null}
            {titulo}
            {r.rojo && r.amarillo ? ` · ${r.amarillo} para revisar` : ""}
          </p>
          <Link href={verTodo} className="rounded-lg bg-white/70 px-3 py-1 text-xs font-semibold underline">
            Ver tablero de salud
          </Link>
        </div>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {mostrar.map((i) => (
            <li key={i.clave} className="rounded-lg bg-white/70 p-2 text-xs">
              <p className="font-semibold">{i.titulo}</p>
              <p className="mt-0.5 [overflow-wrap:anywhere]">{i.detalle}</p>
              {i.accion && (i.href ? <Link href={i.href} className="mt-1 inline-block font-semibold underline">{i.accion} →</Link> : <p className="mt-1 font-semibold [overflow-wrap:anywhere]">{i.accion}</p>)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
