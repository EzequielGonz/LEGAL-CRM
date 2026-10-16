"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { PerfilStats } from "@/lib/perfiles-stats";
import { marcaDe, temaDe } from "@/lib/marca";

/** La vista previa se vuelve a pedir al servidor cada 30 s (pestaña visible). */
const POLL_MS = 30000;

/**
 * Selector de perfiles estilo Netflix para la pantalla de Computadora: a
 * la izquierda los 4 rubros como íconos, a la derecha una vista previa en
 * vivo (casos agendados, clientes cerrados, y el nombre + teléfono de los
 * últimos casos cerrados) del rubro elegido. "Ingresar al panel →" recién
 * ahí lleva al panel de ese rubro (/panel/[slug], que para Jurídico manda
 * directo a la sección de Casos) — elegir un perfil acá NO entra directo,
 * primero muestra la vista previa.
 *
 * La vista previa se mantiene sola: se subscribe a cambios en tiempo real
 * de la tabla "contacts" (Supabase Realtime) — apenas se cierra un caso o
 * se agenda algo, se refresca sin que haga falta recargar la página. Como
 * red de seguridad por si se corta esa conexión un rato, también se
 * refresca solo cada 60 segundos.
 */
export function PerfilSelector({ perfiles: initial }: { perfiles: PerfilStats[] }) {
  const router = useRouter();
  const [perfiles, setPerfiles] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null);

  // Lectura del lado del servidor (la clave pública ya no lee tablas).
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

  const activo = perfiles.find((p) => p.id === selectedId) ?? perfiles[0] ?? null;

  // La pantalla toma la paleta del perfil elegido (16/10).
  useEffect(() => {
    const tema = temaDe(activo?.slug);
    document.body.dataset.tema = tema;
    return () => {
      delete document.body.dataset.tema;
    };
  }, [activo?.slug]);

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="flex flex-row gap-4 sm:flex-col">
        {perfiles.map((p, i) => {
          const isActive = p.id === activo?.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              style={{ animationDelay: `${i * 60}ms` }}
              className={clsx(
                "flex h-16 w-16 shrink-0 animate-scale-in items-center justify-center overflow-hidden rounded-2xl border text-2xl transition-all duration-300 sm:h-20 sm:w-20",
                isActive
                  ? "scale-105 border-gold-400/70 bg-white/10 shadow-gold ring-2 ring-gold-400/40 ring-offset-2 ring-offset-slate-950"
                  : "border-white/10 bg-white/5 opacity-70 hover:-translate-y-0.5 hover:bg-white/10 hover:opacity-100"
              )}
              title={p.name}
              aria-label={`Ver perfil ${p.name}`}
              aria-pressed={isActive}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={marcaDe(p.slug).logo} alt={p.name} className="h-full w-full rounded-2xl bg-white/95 object-contain p-2" />
            </button>
          );
        })}
      </div>

      {activo && (
        <div key={activo.id} className="flex-1 animate-fade-in-up rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 shadow-navy backdrop-blur sm:p-8">
          <p className="text-xs uppercase tracking-wider text-gold-300">{activo.name}</p>
          <h2 className="mb-1 font-serif text-2xl font-semibold text-white">Estadísticas</h2>
          {activo.description && (
            <p className="mb-6 text-sm leading-relaxed text-slate-400">{activo.description}</p>
          )}

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-400">Captados</p>
              <p className="cifra text-3xl font-semibold text-gold-200">{activo.agendados}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-400">Sin derivar</p>
              <p className="cifra text-3xl font-semibold text-gold-200">{activo.cerrados}</p>
            </div>
          </div>

          {activo.accion && (
            <div className="mb-6 rounded-xl border border-gold-500/30 bg-gold-500/10 p-4">
              <p className="mb-1 text-xs uppercase tracking-wider text-gold-300">Requiere acción</p>
              {activo.accion.humano + activo.accion.sin_derivar + activo.accion.revision === 0 ? (
                <p className="text-sm text-slate-300">Nada pendiente de una persona en este perfil.</p>
              ) : (
                <ul className="space-y-1 text-sm text-white">
                  {activo.accion.humano > 0 && <li>{activo.accion.humano} piden atención humana (Inbox).</li>}
                  {activo.accion.sin_derivar > 0 && <li>{activo.accion.sin_derivar} captados sin derivar (Agenda).</li>}
                  {activo.accion.revision > 0 && <li>{activo.accion.revision} en revisión pendiente.</li>}
                </ul>
              )}
            </div>
          )}

          <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">Últimos captados</p>
          <div className="mb-6 max-h-64 space-y-2 overflow-y-auto pr-1">
            {activo.casos.length === 0 && (
              <p className="text-sm text-slate-400">Todavía no hay captados en este perfil.</p>
            )}
            {activo.casos.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              >
                <span className="truncate text-sm font-medium text-white">
                  {c.full_name ?? "Sin nombre"}
                </span>
                <span className="shrink-0 text-xs text-slate-400">{c.phone ?? "—"}</span>
              </div>
            ))}
            {activo.agendados > activo.casos.length && (
              <p className="pt-1 text-center text-xs text-slate-500">
                +{activo.agendados - activo.casos.length} más — entrá al panel para verlos todos
              </p>
            )}
          </div>

          <button onClick={() => router.push(`/panel/${activo.slug}`)} className="btn-gold px-6 py-2.5">
            Ingresar al panel <span className="flecha-desliza" aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </div>
  );
}
