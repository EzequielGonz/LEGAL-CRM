import { EnlaceDetalle } from "@/components/ui/enlaces-navegacion";
import Link from "next/link";
import { requirePageSession } from "@/lib/acceso/pagina";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { temaDe, esSlugPerfil, MARCAS } from "@/lib/marca";
import { experimentoActual, listaIndicador } from "@/lib/experimento/servicio";
import { FILTROS_METRICA, LETRAS, type Letra } from "@/lib/experimento/reglas";
import { CAPTURE_STATE_LABEL, CONTACT_STATE_LABEL } from "@/lib/opportunities";

export const dynamic = "force-dynamic";

const POR_PAGINA = 50;

/** Lista de un indicador de la comparación → ficha → conversación. */
export default async function ListaIndicadorPage({
  searchParams,
}: {
  searchParams: { perfil?: string; cand?: string; metrica?: string; rubro?: string; desde?: string; hasta?: string; pagina?: string };
}) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const perfil = temaDe(searchParams.perfil);
  const cand = (LETRAS as string[]).includes(searchParams.cand ?? "") ? (searchParams.cand as Letra) : null;
  const metrica = searchParams.metrica && FILTROS_METRICA[searchParams.metrica] ? searchParams.metrica : null;
  const actual = await experimentoActual();
  const fecha = (v?: string) => (v && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null);
  const desde = fecha(searchParams.desde);
  const hasta = fecha(searchParams.hasta);
  const rubro = esSlugPerfil(searchParams.rubro) ? searchParams.rubro : null;
  const pagina = Math.max(1, Number(searchParams.pagina) || 1);
  const volver = `/comparacion-agentes?perfil=${perfil}${rubro ? "&vista=perfil" : ""}`;

  if (!actual || !cand || !metrica) {
    return (
      <MarcoPerfil slug={perfil}>
        <p className="text-sm text-slate-700">Indicador no válido. <Link href={volver} className="underline">Volver</Link></p>
      </MarcoPerfil>
    );
  }
  const { label, filas } = await listaIndicador({ experimentId: actual.exp.id, candidato: cand, metrica, rubro, desde, hasta });
  const total = filas.length;
  const vista = filas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const aqui = `/comparacion-agentes/lista?${new URLSearchParams(Object.entries(searchParams).filter(([, v]) => typeof v === "string") as [string, string][]).toString()}`;

  return (
    <MarcoPerfil slug={perfil}>
      <div className="mx-auto max-w-4xl">
        <Link href={volver} className="text-sm text-slate-600 underline">← Volver a la comparación</Link>
        <h1 className="mt-2 font-serif text-2xl font-semibold text-slate-900">
          {label} · candidato {cand}
        </h1>
        <p className="text-sm text-slate-600">
          {total} oportunidad{total === 1 ? "" : "es"} · {rubro ? MARCAS[rubro].nombre : "todos los perfiles"} · {desde && hasta ? `${new Date(desde).toLocaleDateString("es-AR")} a ${new Date(hasta).toLocaleDateString("es-AR")}` : "acumulado"}
        </p>
        {total === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No hay oportunidades en este indicador.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {vista.map((o) => (
              <li key={o.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{o.nombre ?? "Sin nombre"}</p>
                  <p className="text-xs text-slate-600">
                    {MARCAS[o.rubro as keyof typeof MARCAS]?.nombre ?? o.rubro} · {(CONTACT_STATE_LABEL as any)[o.contact_state] ?? o.contact_state} · {(CAPTURE_STATE_LABEL as any)[o.capture_state] ?? o.capture_state}
                    {o.fase ? ` · fase: ${o.fase}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2 text-sm">
                  {o.contact_id && (
                    <Link href={`/ficha/${o.contact_id}?volver=${encodeURIComponent(aqui)}`} className="tactil inline-flex items-center rounded-lg border border-slate-300 px-3">Ficha</Link>
                  )}
                  {o.conversation_id && (
                    <EnlaceDetalle href={`/inbox/${o.conversation_id}`} className="tactil inline-flex items-center rounded-lg bg-slate-900 px-3 text-gold-100">Conversación</EnlaceDetalle>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {total > POR_PAGINA && (
          <nav aria-label="Páginas" className="mt-3 flex gap-2 text-sm">
            {pagina > 1 && <Link href={aqui.replace(/([?&])pagina=\d+/, "$1").replace(/[?&]$/, "") + `&pagina=${pagina - 1}`} className="underline">Anterior</Link>}
            {pagina * POR_PAGINA < total && <Link href={aqui.replace(/([?&])pagina=\d+/, "$1").replace(/[?&]$/, "") + `&pagina=${pagina + 1}`} className="underline">Siguiente</Link>}
          </nav>
        )}
      </div>
    </MarcoPerfil>
  );
}
