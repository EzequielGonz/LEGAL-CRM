import Link from "next/link";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { leerSalud, resumenSalud, type ItemSalud } from "@/lib/salud";

export const dynamic = "force-dynamic";

const ESTILO: Record<ItemSalud["estado"], { caja: string; punto: string; texto: string }> = {
  rojo: { caja: "border-red-300 bg-red-50", punto: "bg-red-500", texto: "Frena la operación" },
  amarillo: { caja: "border-amber-300 bg-amber-50", punto: "bg-amber-500", texto: "Para revisar" },
  verde: { caja: "border-emerald-200 bg-white", punto: "bg-emerald-500", texto: "En orden" },
};

/** Tablero de salud: qué anda, qué no y qué hacer, en una sola pantalla. */
export default async function SaludPage({ searchParams }: { searchParams: { perfil?: string } }) {
  const slug: SlugPerfil = esSlugPerfil(searchParams.perfil) ? searchParams.perfil : "juridico";
  const items = await leerSalud();
  const r = resumenSalud(items);
  return (
    <MarcoPerfil slug={slug} sinSalud>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Salud del sistema</h1>
        <p className="text-sm text-slate-500">
          {r.rojo} que frenan la operación · {r.amarillo} para revisar · {r.verde} en orden. Se actualiza cada vez que entrás.
        </p>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {items.map((i) => (
          <li key={i.clave} className={`rounded-xl border p-4 ${ESTILO[i.estado].caja}`}>
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-600">
              <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${ESTILO[i.estado].punto}`} /> {ESTILO[i.estado].texto}
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">{i.titulo}</p>
            <p className="mt-1 text-sm text-slate-700">{i.detalle}</p>
            {i.accion &&
              (i.href ? (
                <Link href={i.href} className="mt-3 inline-flex min-h-[44px] items-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-gold-100">
                  {i.accion}
                </Link>
              ) : (
                <p className="mt-3 text-sm font-semibold text-slate-900">Qué hacer: {i.accion}</p>
              ))}
          </li>
        ))}
      </ul>
    </MarcoPerfil>
  );
}
