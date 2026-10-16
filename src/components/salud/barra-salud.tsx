import Link from "next/link";
import { leerSalud, resumenSalud, type ItemSalud } from "@/lib/salud";

const COLOR: Record<ItemSalud["estado"], string> = {
  rojo: "border-red-300 bg-red-50 text-red-900",
  amarillo: "border-amber-300 bg-amber-50 text-amber-900",
  verde: "border-emerald-300 bg-emerald-50 text-emerald-900",
};

/**
 * Barra de salud arriba de cada panel (16/10): lo que frena la operación se
 * ve apenas se entra, con el botón para resolverlo. Si está todo bien, un
 * aviso mínimo.
 */
export async function BarraSalud({ slug }: { slug: string }) {
  let items: ItemSalud[] = [];
  try {
    items = await leerSalud();
  } catch {
    return null;
  }
  const r = resumenSalud(items);
  const verTodo = `/salud?perfil=${encodeURIComponent(slug)}`;
  if (r.rojo === 0 && r.amarillo === 0) {
    return (
      <Link href={verTodo} className="mb-4 inline-flex items-center gap-2.5 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-xs font-medium text-emerald-900 transition-shadow hover:shadow-md">
        <span aria-hidden="true" className="punto-vivo text-emerald-500" /> Sistema en orden
      </Link>
    );
  }
  const urgentes = items.filter((i) => i.estado === "rojo").slice(0, 3);
  const mostrar = urgentes.length ? urgentes : items.filter((i) => i.estado === "amarillo").slice(0, 2);
  return (
    <section aria-label="Salud del sistema" className={`mb-5 rounded-xl border p-3 ${r.rojo ? COLOR.rojo : COLOR.amarillo}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">
          {r.rojo ? `⚠ ${r.rojo} problema(s) frenan la operación` : `${r.amarillo} punto(s) para revisar`}
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
            <p className="mt-0.5 opacity-80">{i.detalle}</p>
            {i.accion && (i.href ? <Link href={i.href} className="mt-1 inline-block font-semibold underline">{i.accion} →</Link> : <p className="mt-1 font-semibold">{i.accion}</p>)}
          </li>
        ))}
      </ul>
    </section>
  );
}
