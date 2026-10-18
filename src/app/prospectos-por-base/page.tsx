import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageSession } from "@/lib/acceso/pagina";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { Icono } from "@/components/ui/icono-seccion";
import { createAdminClient } from "@/lib/supabase/admin";
import { rubroIdDe } from "@/lib/indicadores";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { AREAS_DE_PERFIL } from "@/lib/cartera-servidor";
import { conVolver } from "@/lib/navegacion";
import { estadoCorto } from "@/lib/inicio";
import { cuandoCorto, iniciales } from "@/lib/cartera";
import { textoBusquedaSeguro } from "@/lib/busqueda";

export const dynamic = "force-dynamic";
export const metadata = { title: "Prospectos" };

const MAX_BASES = 12;
const POR_BASE = 20;

type Cifras = { total: number | null; sinContactar: number | null; sinRespuesta: number | null; respondieron: number | null; captados: number | null };

async function cifras(rubroId: string, baseId: string | null): Promise<Cifras> {
  const s = createAdminClient();
  const q = () => {
    const x: any = s.from("opportunities").select("id", { count: "exact", head: true }).eq("rubro_id", rubroId);
    return baseId ? x.eq("imported_base_id", baseId) : x.is("imported_base_id", null);
  };
  const leer = async (x: any) => {
    const { count, error } = await x;
    return error ? null : count ?? 0;
  };
  const [total, sinContactar, sinRespuesta, respondieron, captados] = await Promise.all([
    leer(q()),
    leer(q().eq("contact_state", "sin_contactar")),
    leer(q().eq("contact_state", "contactado_sin_respuesta")),
    leer(q().eq("contact_state", "respondio")),
    leer(q().eq("capture_state", "captado")),
  ]);
  return { total, sinContactar, sinRespuesta, respondieron, captados };
}

async function primeros(rubroId: string, baseId: string | null) {
  let q: any = createAdminClient()
    .from("opportunities")
    .select("id, contact_id, contact_state, capture_state, attention_state, derivation_state, updated_at, contacts(full_name, phone)")
    .eq("rubro_id", rubroId)
    .order("updated_at", { ascending: false })
    .limit(POR_BASE);
  q = baseId ? q.eq("imported_base_id", baseId) : q.is("imported_base_id", null);
  const { data } = await q;
  return (data ?? []) as any[];
}

function Cifra({ n, texto }: { n: number | null; texto: string }) {
  return (
    <span className="min-w-[4.5rem]">
      <span className="block text-base font-semibold tabular-nums text-slate-950">{n === null ? "—" : n.toLocaleString("es-AR")}</span>
      <span className="block text-[11px] text-slate-500">{texto}</span>
    </span>
  );
}

/**
 * Prospectos (reorganización 2, 18/10): la base fría, agrupada por cada base
 * cargada y plegada. Al abrir una base se ven sus primeros contactos y el
 * acceso a la base completa. Solo lectura.
 */
export default async function ProspectosPorBasePage({ searchParams }: { searchParams: { perfil?: string; q?: string } }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const perfil = searchParams.perfil ?? "juridico";
  const rubroId = rubroIdDe(perfil);
  if (!rubroId || !esSlugPerfil(perfil)) notFound();
  const slug: SlugPerfil = perfil;
  const areas = AREAS_DE_PERFIL[slug];
  const prefijo = slug === "juridico" ? "" : `/panel/${slug}`;
  const aqui = `/prospectos-por-base?perfil=${slug}`;
  const s = createAdminClient();

  const qSeguro = textoBusquedaSeguro(searchParams.q?.trim());
  const [{ data: bases }, sinBase, encontrados] = await Promise.all([
    s.from("imported_bases").select("id, name, file_name, source_label, created_at, total_rows, created_rows").in("area", areas).is("archived_at", null).order("created_at", { ascending: false }).limit(MAX_BASES),
    cifras(rubroId, null),
    qSeguro
      ? s
          .from("opportunities")
          .select("id, contact_id, contact_state, capture_state, attention_state, derivation_state, updated_at, contacts!inner(full_name, phone)")
          .eq("rubro_id", rubroId)
          .or(`full_name.ilike.%${qSeguro}%,phone.ilike.%${qSeguro}%`, { referencedTable: "contacts" })
          .limit(30)
          .then((r: any) => (r.data ?? []) as any[])
      : Promise.resolve(null),
  ]);
  const grupos = await Promise.all(
    ((bases ?? []) as any[]).map(async (b) => ({ base: b, cifras: await cifras(rubroId, b.id), filas: await primeros(rubroId, b.id) }))
  );
  const filasSinBase = (sinBase.total ?? 0) > 0 ? await primeros(rubroId, null) : [];

  const Lista = ({ filas }: { filas: any[] }) => (
    <ul className="divide-y divide-slate-100">
      {filas.map((o) => (
        <li key={o.id} className="flex items-center gap-3 px-4 py-2.5">
          <span aria-hidden="true" className="avatar-ficha grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold">
            {iniciales(o.contacts?.full_name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{o.contacts?.full_name ?? "Sin nombre"}</p>
            <p className="truncate text-xs text-slate-500">
              <span className="tabular-nums">{o.contacts?.phone ?? "Sin teléfono"}</span> · {estadoCorto(o).texto} · {cuandoCorto(o.updated_at)}
            </p>
          </div>
          {o.contact_id ? (
            <Link href={conVolver(`/ficha/${o.contact_id}`, aqui)} className="btn-suave-sm">
              Ficha
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  );

  return (
    <MarcoPerfil slug={slug}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">Prospectos</h1>
            <p className="mt-1 text-sm text-slate-600">La base fría, agrupada por cada base que cargaste. Abrí una para ver sus contactos.</p>
          </div>
          <Link href={`${prefijo}/bases`} className="btn-suave">
            <Icono nombre="bases" className="h-4 w-4" /> Cargar o gestionar bases
          </Link>
        </div>

        <form action="/prospectos-por-base" method="GET" className="flex gap-2">
          <input type="hidden" name="perfil" value={slug} />
          <label htmlFor="buscar-prospecto" className="sr-only">
            Buscar por nombre o teléfono
          </label>
          <input id="buscar-prospecto" name="q" defaultValue={searchParams.q ?? ""} placeholder="Buscar por nombre o teléfono en todas las bases" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm" />
          <button type="submit" className="btn-gold">
            Buscar
          </button>
        </form>

        {encontrados ? (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">Resultados para «{searchParams.q?.trim()}»</h2>
              <Link href={aqui} className="text-xs font-medium text-slate-600 underline">
                Limpiar
              </Link>
            </div>
            {encontrados.length ? <Lista filas={encontrados} /> : <p className="px-4 py-6 text-sm text-slate-600">No hay coincidencias.</p>}
          </section>
        ) : null}

        <div className="space-y-3">
          {grupos.map(({ base, cifras: c, filas }) => (
            <details key={base.id} className="grupo-base group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-500/10 text-gold-700">
                    <Icono nombre="bases" className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-950">{base.name || base.file_name || "Base sin nombre"}</span>
                    <span className="block text-xs text-slate-500">Cargada {cuandoCorto(base.created_at)}{base.source_label ? ` · ${base.source_label}` : ""}</span>
                  </span>
                </span>
                <span className="flex flex-wrap gap-4">
                  <Cifra n={c.total} texto="contactos" />
                  <Cifra n={c.sinContactar} texto="sin contactar" />
                  <Cifra n={c.sinRespuesta} texto="sin respuesta" />
                  <Cifra n={c.respondieron} texto="respondieron" />
                  <Cifra n={c.captados} texto="captados" />
                </span>
                <span aria-hidden="true" className="text-slate-400 transition group-open:rotate-180">▾</span>
              </summary>
              <div className="border-t border-slate-100">
                {filas.length ? <Lista filas={filas} /> : <p className="px-4 py-4 text-sm text-slate-600">Esta base no tiene contactos.</p>}
                <div className="border-t border-slate-100 px-4 py-3 text-right">
                  <Link href={`${prefijo}/bases/${base.id}`} className="text-sm font-medium text-slate-800 underline underline-offset-2">
                    Abrir la base completa
                  </Link>
                </div>
              </div>
            </details>
          ))}

          {(sinBase.total ?? 0) > 0 ? (
            <details className="grupo-base group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500">
                    <Icono nombre="prospectos" className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-950">Sin base asignada</span>
                    <span className="block text-xs text-slate-500">Cargados antes de las bases o llegados por mensaje</span>
                  </span>
                </span>
                <span className="flex flex-wrap gap-4">
                  <Cifra n={sinBase.total} texto="contactos" />
                  <Cifra n={sinBase.sinContactar} texto="sin contactar" />
                  <Cifra n={sinBase.sinRespuesta} texto="sin respuesta" />
                  <Cifra n={sinBase.respondieron} texto="respondieron" />
                  <Cifra n={sinBase.captados} texto="captados" />
                </span>
                <span aria-hidden="true" className="text-slate-400 transition group-open:rotate-180">▾</span>
              </summary>
              <div className="border-t border-slate-100">
                <Lista filas={filasSinBase} />
                <div className="border-t border-slate-100 px-4 py-3 text-right">
                  <Link href={slug === "juridico" ? "/prospectos" : `/oportunidades?perfil=${slug}`} className="text-sm font-medium text-slate-800 underline underline-offset-2">
                    Ver todos con filtros
                  </Link>
                </div>
              </div>
            </details>
          ) : null}

          {grupos.length === 0 && !(sinBase.total ?? 0) ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <p className="text-base font-semibold text-slate-900">Todavía no cargaste bases</p>
              <p className="mt-1 text-sm text-slate-600">Cuando cargues una, aparece acá con sus cifras.</p>
            </div>
          ) : null}
        </div>
      </div>
    </MarcoPerfil>
  );
}
