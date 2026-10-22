"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PerfilStats } from "@/lib/perfiles-stats";
import type { ResumenCifras } from "@/lib/cartera-servidor";
import { marcaDe, temaDe, type SlugPerfil } from "@/lib/marca";
import { variablesAcento } from "@/lib/acento";
import { LogoPerfil } from "@/components/ui/logo-perfil";
import { Icono } from "@/components/ui/icono-seccion";
import { Chip, ESTADO_CAMPANA, EditarPerfil, MenuAcciones, usePerfilesEnVivo, type MarcaTarjeta } from "@/components/perfiles/perfil-selector";

function n(v: number | null | undefined) {
  return v === null || v === undefined ? "–" : v.toLocaleString("es-AR");
}

function porcentaje(parte: number, total: number) {
  return total > 0 ? Math.round((parte / total) * 100) : 0;
}

function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", timeZone: "America/Argentina/Buenos_Aires" });
}

/** Accesos directos de cada perfil (las páginas comunes reciben ?perfil=). */
function accesos(slug: SlugPerfil) {
  const base = slug === "juridico" ? "" : `/panel/${slug}`;
  return [
    { href: `/conversaciones?perfil=${slug}`, texto: "Conversaciones", icono: "inbox" },
    { href: `/contactos?perfil=${slug}`, texto: "Contactos", icono: "cerrados" },
    { href: `${base}/campanas`, texto: "Campañas", icono: "campanas" },
    { href: `${base}/estadisticas`, texto: "Historial", icono: "estadisticas" },
  ];
}

/**
 * Elegir perfil en la computadora (18/10, pedido de la responsable): una
 * tarjeta completa por marca sobre la pantalla oscura, con lo pendiente,
 * las cifras de la semana, la última base cargada, los últimos captados y
 * accesos directos. Lápiz (nombre, nombre interno, logo y color) y tres
 * puntos (campañas y publicaciones). Lo pendiente se actualiza solo.
 */
export function SelectorPerfilesPC({
  perfiles: inicial,
  marcas: marcasIniciales,
  cifras: cifrasIniciales,
}: {
  perfiles: PerfilStats[];
  marcas: Partial<Record<SlugPerfil, MarcaTarjeta>>;
  cifras: Record<string, ResumenCifras | null>;
}) {
  const router = useRouter();
  const { perfiles, setPerfiles, aviso, pausar, cifras: cifrasVivas } = usePerfilesEnVivo(inicial, { cifras: cifrasIniciales });
  const cifras = cifrasVivas ?? cifrasIniciales;
  const [marcas, setMarcas] = useState(marcasIniciales);
  const [editando, setEditando] = useState<string | null>(null);

  return (
    <div>
      {aviso && (
        <p role="status" className="mx-auto mb-5 max-w-xl rounded-xl bg-white px-4 py-3 text-center text-sm text-slate-800 shadow-sm">
          {aviso}
        </p>
      )}
      <ul className="grid gap-5 lg:grid-cols-2">
        {perfiles.map((p, i) => {
          const slug = temaDe(p.slug);
          const original = marcaDe(slug);
          const m = marcas[slug] ?? { nombre: original.nombre, logo: null, acento: null };
          const estilo = (variablesAcento(m.acento) ?? undefined) as React.CSSProperties | undefined;
          const c = cifras[p.id] ?? null;
          const b = c?.ultimaBase ?? null;
          const pendientes = p.accion.sin_derivar + p.accion.humano;
          const ficha = (id: string) => (slug === "juridico" ? `/prospectos/${id}` : `/ficha/${id}`);
          return (
            <li key={p.id} data-tema={slug} style={{ ...estilo, animationDelay: `${i * 70}ms` }} className="perfil-pc tarjeta-perfil relative flex flex-col overflow-hidden rounded-3xl">
              <span className="absolute inset-x-0 top-0 h-1 bg-gold-500" aria-hidden="true" />
              <div className="flex flex-1 flex-col p-5 pt-6">
                {/* Marca */}
                <div className="flex items-start gap-4">
                  <Link href={`/panel/${slug}`} className="perfil-pc-logo block h-16 w-16 shrink-0 overflow-hidden rounded-2xl" aria-label={`Entrar a ${m.nombre}`}>
                    <LogoPerfil slug={slug} src={m.logo} alt="" tamano="lg" className="perfil-pc-placa" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/panel/${slug}`} className="block truncate text-lg font-semibold tracking-tight text-slate-950 hover:underline">
                      {m.nombre}
                    </Link>
                    <p className="truncate text-sm text-slate-500">{p.name}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.accion.sin_derivar > 0 && <Chip tono="urgente">{p.accion.sin_derivar === 1 ? "1 captado sin derivar" : `${p.accion.sin_derivar} captados sin derivar`}</Chip>}
                      {p.accion.humano > 0 && <Chip tono="urgente">{p.accion.humano === 1 ? "1 pide una persona" : `${p.accion.humano} piden una persona`}</Chip>}
                      {(p.recibidos24h ?? 0) > 0 && <Chip tono="info">{p.recibidos24h} mensaje(s) en 24 h</Chip>}
                      {p.campana && <Chip tono={p.campana.estado === "en_curso" ? "ok" : "info"}>Campaña {ESTADO_CAMPANA[p.campana.estado] ?? p.campana.estado}</Chip>}
                      {(p.programadas ?? 0) > 0 && <Chip tono="info">{p.programadas} publicaciones programadas</Chip>}
                      {pendientes === 0 && !(p.recibidos24h ?? 0) && <Chip tono="ok">Todo al día</Chip>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <button type="button" onClick={() => setEditando(p.id)} aria-label={`Editar ${m.nombre}`} className="tactil grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                      <Icono nombre="lapiz" className="h-[18px] w-[18px]" />
                    </button>
                    <MenuAcciones p={p} onPausar={() => pausar(p)} modo="pc" />
                  </div>
                </div>

                {/* Esta semana */}
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Esta semana</p>
                  <dl className="mt-2 grid grid-cols-4 gap-2">
                    {[
                      { t: "Mensajes", v: c?.semana.respuestas },
                      { t: "Captados", v: c?.semana.captados },
                      { t: "Citas", v: c?.semana.citas },
                      { t: "Derivados", v: c?.semana.derivados },
                    ].map((x) => (
                      <div key={x.t} className="perfil-pc-cifra rounded-2xl px-3 py-2.5">
                        <dd className="text-xl font-semibold tabular-nums text-slate-950">{n(x.v)}</dd>
                        <dt className="text-xs text-slate-500">{x.t}</dt>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Última base y captados */}
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Última base</p>
                    {b ? (
                      <div className="mt-2">
                        <p className="truncate text-sm font-medium text-slate-900" title={b.nombre}>
                          {b.nombre} <span className="font-normal text-slate-500">· {fechaCorta(b.fecha)}</span>
                        </p>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                          <div className="h-full rounded-full bg-gold-500" style={{ width: `${porcentaje(b.contactados, b.cargados)}%` }} />
                        </div>
                        <p className="mt-1.5 text-xs text-slate-600 tabular-nums">
                          {n(b.cargados)} cargados · {n(b.contactados)} contactados · {n(b.respondieron)} respondieron · {n(b.captados)} captados
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">Todavía no hay bases cargadas.</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Captados <span className="font-normal normal-case tracking-normal">({n(p.agendados)} en total)</span>
                    </p>
                    {p.casos.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {p.casos.slice(0, 3).map((x) => (
                          <li key={x.id}>
                            <Link href={ficha(x.id)} className="block truncate text-sm text-slate-800 hover:text-slate-950 hover:underline">
                              {x.full_name || "Sin nombre"}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">Sin captados todavía.</p>
                    )}
                  </div>
                </div>

                {/* Accesos */}
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                  <button type="button" onClick={() => router.push(`/panel/${slug}`)} className="btn-gold">
                    Entrar al panel <Icono nombre="flecha" className="h-4 w-4" />
                  </button>
                  {accesos(slug).map((a) => (
                    <Link key={a.href} href={a.href} className="btn-suave-sm inline-flex items-center gap-1.5">
                      <Icono nombre={a.icono} className="h-4 w-4" />
                      {a.texto}
                    </Link>
                  ))}
                </div>
              </div>
              {editando === p.id && (
                <EditarPerfil
                  p={p}
                  marca={m}
                  onCerrar={() => setEditando(null)}
                  onGuardado={(nueva, interno) => {
                    setMarcas((x) => ({ ...x, [slug]: nueva }));
                    setPerfiles((ps) => ps.map((y) => (y.id === p.id ? { ...y, name: interno || y.name } : y)));
                    router.refresh();
                  }}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
