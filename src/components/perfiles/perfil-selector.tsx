"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PerfilStats } from "@/lib/perfiles-stats";
import { marcaDe, temaDe, type SlugPerfil } from "@/lib/marca";
import { variablesAcento } from "@/lib/acento";
import { LogoPerfil } from "@/components/ui/logo-perfil";
import { Icono } from "@/components/ui/icono-seccion";

/** La vista previa se vuelve a pedir al servidor cada 30 s (pestaña visible). */
const POLL_MS = 30000;

export interface MarcaTarjeta {
  nombre: string;
  logo: string | null;
  acento: string | null;
}

function base(slug: SlugPerfil) {
  return slug === "juridico" ? "" : `/panel/${slug}`;
}

const ESTADO_CAMPANA: Record<string, string> = { borrador: "en borrador", en_curso: "enviando", pausada: "pausada", finalizada: "finalizada" };

function Chip({ tono, children }: { tono: "urgente" | "info" | "ok"; children: React.ReactNode }) {
  const clase = tono === "urgente" ? "bg-amber-50 text-amber-900 ring-amber-200" : tono === "ok" ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-slate-50 text-slate-700 ring-slate-200";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${clase}`}>{children}</span>;
}

/** Menú de tres puntos: campañas, publicaciones y entrar. */
function MenuAcciones({ p, onPausar }: { p: PerfilStats; onPausar: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const slug = temaDe(p.slug);
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);
  const item = "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-950";
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setAbierto((v) => !v)} aria-haspopup="menu" aria-expanded={abierto} aria-label={`Más acciones de ${p.name}`} className="tactil grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900">
        <Icono nombre="puntos" className="h-5 w-5" />
      </button>
      {abierto && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-1 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-scale-in">
          <Link role="menuitem" href={`${base(slug)}/campanas`} className={item}>
            <Icono nombre="campanas" className="h-4 w-4" /> Cargar campaña
          </Link>
          {p.campana && (
            <Link role="menuitem" href={`${base(slug)}/campanas/${p.campana.id}`} className={item}>
              <Icono nombre="estadisticas" className="h-4 w-4" /> Revisar campaña
            </Link>
          )}
          {p.campana?.estado === "en_curso" && (
            <button
              type="button"
              role="menuitem"
              className={item}
              onClick={() => {
                setAbierto(false);
                onPausar();
              }}
            >
              <Icono nombre="alerta" className="h-4 w-4" /> Pausar campaña
            </button>
          )}
          {p.campana?.estado === "pausada" && (
            <Link role="menuitem" href={`${base(slug)}/campanas/${p.campana.id}`} className={item}>
              <Icono nombre="enviar" className="h-4 w-4" /> Reanudar campaña…
            </Link>
          )}
          <Link role="menuitem" href={`/redes?perfil=${slug}`} className={item}>
            <Icono nombre="contenido" className="h-4 w-4" /> Programar publicaciones
          </Link>
          <div className="my-1 h-px bg-slate-100" />
          <Link role="menuitem" href={`/panel/${slug}`} className={item}>
            <Icono nombre="flecha" className="h-4 w-4" /> Entrar al panel
          </Link>
        </div>
      )}
    </div>
  );
}

/** Lápiz: nombre, nombre interno, logo y color de acento. */
function EditarPerfil({ p, marca, onCerrar, onGuardado }: { p: PerfilStats; marca: MarcaTarjeta; onCerrar: () => void; onGuardado: (m: MarcaTarjeta, interno: string) => void }) {
  const slug = temaDe(p.slug);
  const original = marcaDe(slug);
  const [nombre, setNombre] = useState(marca.nombre);
  const [interno, setInterno] = useState(p.name);
  const [color, setColor] = useState(marca.acento ?? original.acento);
  const [usarColor, setUsarColor] = useState(!!marca.acento);
  const [logo, setLogo] = useState<File | null>(null);
  const [vista, setVista] = useState<string | null>(marca.logo);
  const [quitar, setQuitar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialogo.current?.showModal();
  }, []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    const f = new FormData();
    f.set("perfil", slug);
    f.set("nombre", nombre);
    f.set("nombre_interno", interno);
    f.set("color", usarColor ? color : "");
    if (logo) f.set("logo", logo);
    else if (quitar) f.set("quitar_logo", "1");
    try {
      const res = await fetch("/api/perfiles/marca", { method: "POST", body: f });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error ?? "No se pudo guardar.");
      onGuardado({ nombre, logo: d.logo ?? null, acento: usarColor ? color : null }, interno);
      onCerrar();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <dialog ref={dialogo} onClose={onCerrar} className="w-full max-w-md rounded-2xl border border-slate-200 p-0 shadow-2xl backdrop:bg-slate-950/40">
      <form onSubmit={guardar} className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-950">Editar perfil</h2>
          <button type="button" onClick={onCerrar} className="tactil grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Cerrar">
            <Icono nombre="cerrar" className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <span className="block h-16 w-16 shrink-0">
            <LogoPerfil slug={slug} src={quitar ? null : vista} tamano="lg" />
          </span>
          <div className="flex flex-col gap-1.5 text-sm">
            <label className="cursor-pointer font-medium text-slate-800 underline underline-offset-2">
              Cambiar logo
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setLogo(f);
                  setQuitar(false);
                  if (f) setVista(URL.createObjectURL(f));
                }}
              />
            </label>
            {(marca.logo || logo) && (
              <button
                type="button"
                className="text-left text-slate-600 underline underline-offset-2"
                onClick={() => {
                  setLogo(null);
                  setQuitar(true);
                }}
              >
                Volver al logo original
              </button>
            )}
          </div>
        </div>
        <label className="mt-5 block text-sm">
          <span className="font-medium text-slate-800">Nombre</span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <span className="mt-1 block text-xs text-slate-500">El que se ve en el panel y en las publicaciones.</span>
        </label>
        <label className="mt-4 block text-sm">
          <span className="font-medium text-slate-800">Nombre interno</span>
          <input value={interno} onChange={(e) => setInterno(e.target.value)} maxLength={60} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <div className="mt-4 flex items-center gap-3 text-sm">
          <label className="flex items-center gap-2 font-medium text-slate-800">
            <input type="checkbox" checked={usarColor} onChange={(e) => setUsarColor(e.target.checked)} className="h-4 w-4" />
            Color propio del panel
          </label>
          <input type="color" value={color} disabled={!usarColor} onChange={(e) => setColor(e.target.value)} className="h-9 w-14 cursor-pointer rounded-md border border-slate-300 p-0.5 disabled:opacity-40" aria-label="Color de acento" />
        </div>
        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCerrar} className="btn-suave">
            Cancelar
          </button>
          <button type="submit" disabled={guardando} className="btn-gold">
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

/**
 * Pantalla de perfiles (renovada 18/10): una tarjeta alargada por perfil con
 * lo que está pendiente (captados sin derivar, chats que piden una persona,
 * mensajes del día, campaña y publicaciones). Lápiz para nombre, logo y
 * color; tres puntos para campañas y publicaciones. Se actualiza sola.
 */
export function PerfilSelector({ perfiles: initial, marcas: marcasIniciales }: { perfiles: PerfilStats[]; marcas: Partial<Record<SlugPerfil, MarcaTarjeta>> }) {
  const router = useRouter();
  const [perfiles, setPerfiles] = useState(initial);
  const [marcas, setMarcas] = useState(marcasIniciales);
  const [editando, setEditando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const refrescar = useCallback(async () => {
    try {
      const res = await fetch("/api/perfiles/estado", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { perfiles: PerfilStats[] };
      if (Array.isArray(data.perfiles)) setPerfiles(data.perfiles);
    } catch {
      // sin conexión: se reintenta en el próximo ciclo
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") refrescar();
    };
    const interval = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refrescar]);

  async function pausar(p: PerfilStats) {
    if (!p.campana) return;
    if (!window.confirm(`¿Pausar la campaña «${p.campana.nombre}»? Deja de enviar hasta que la reanudes.`)) return;
    const res = await fetch(`/api/campaigns/${p.campana.id}/pause`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ motivo: "Pausada desde la pantalla de perfiles" }) });
    setAviso(res.ok ? `Campaña «${p.campana.nombre}» pausada.` : "No se pudo pausar la campaña.");
    refrescar();
  }

  return (
    <div>
      {aviso && (
        <p role="status" className="mb-4 rounded-xl bg-white px-4 py-3 text-sm text-slate-800 shadow-sm ring-1 ring-slate-200">
          {aviso}
        </p>
      )}
      <ul className="space-y-3">
        {perfiles.map((p) => {
          const slug = temaDe(p.slug);
          const original = marcaDe(slug);
          const m = marcas[slug] ?? { nombre: original.nombre, logo: null, acento: null };
          const estilo = (variablesAcento(m.acento) ?? undefined) as React.CSSProperties | undefined;
          const pendientes = p.accion.sin_derivar + p.accion.humano;
          return (
            <li key={p.id} data-tema={slug} style={estilo} className="tarjeta-perfil group relative overflow-hidden rounded-2xl border border-slate-200 !bg-white shadow-sm transition-shadow hover:shadow-md">
              <span className="absolute inset-y-0 left-0 w-1.5 bg-gold-500" aria-hidden="true" />
              <div className="flex flex-col gap-4 p-4 pl-6 sm:flex-row sm:items-center sm:p-5 sm:pl-7">
                <Link href={`/panel/${slug}`} className="flex min-w-0 flex-1 items-center gap-4">
                  <span className="block h-14 w-14 shrink-0 sm:h-16 sm:w-16">
                    <LogoPerfil slug={slug} src={m.logo} alt="" tamano="lg" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-lg font-semibold text-slate-950">{m.nombre}</span>
                    <span className="block truncate text-sm text-slate-500">{p.name}</span>
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {p.accion.sin_derivar > 0 && <Chip tono="urgente">{p.accion.sin_derivar === 1 ? "1 captado sin derivar" : `${p.accion.sin_derivar} captados sin derivar`}</Chip>}
                      {p.accion.humano > 0 && <Chip tono="urgente">{p.accion.humano === 1 ? "1 pide una persona" : `${p.accion.humano} piden una persona`}</Chip>}
                      {(p.recibidos24h ?? 0) > 0 && <Chip tono="info">{p.recibidos24h} mensaje(s) hoy</Chip>}
                      {p.campana && <Chip tono={p.campana.estado === "en_curso" ? "ok" : "info"}>Campaña {ESTADO_CAMPANA[p.campana.estado] ?? p.campana.estado}</Chip>}
                      {(p.programadas ?? 0) > 0 && <Chip tono="info">{p.programadas} publicaciones programadas</Chip>}
                      {pendientes === 0 && !(p.recibidos24h ?? 0) && <Chip tono="ok">Todo al día</Chip>}
                    </span>
                  </span>
                </Link>
                <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
                  <button type="button" onClick={() => setEditando(p.id)} aria-label={`Editar ${m.nombre}`} className="tactil grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                    <Icono nombre="lapiz" className="h-[18px] w-[18px]" />
                  </button>
                  <MenuAcciones p={p} onPausar={() => pausar(p)} />
                  <button type="button" onClick={() => router.push(`/panel/${slug}`)} className="btn-gold ml-1">
                    Entrar <Icono nombre="flecha" className="h-4 w-4" />
                  </button>
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
