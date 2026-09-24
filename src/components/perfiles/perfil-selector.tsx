"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import { buildPerfiles, RELEVANT_STATUSES, type PerfilStats } from "@/lib/perfiles-stats";

const FALLBACK_POLL_MS = 60000;

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
  const supabase = createClient();
  const [perfiles, setPerfiles] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null);

  const refrescar = useCallback(async () => {
    const [{ data: rubros }, { data: rows }] = await Promise.all([
      supabase
        .from("rubros")
        .select("id, slug, name, emoji, description")
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("contacts")
        .select("id, full_name, phone, rubro_id, status, updated_at")
        .in("status", RELEVANT_STATUSES)
        .order("updated_at", { ascending: false })
        .limit(1000),
    ]);

    if (!rubros) return;
    setPerfiles(buildPerfiles(rubros as any, (rows ?? []) as any));
  }, [supabase]);

  useEffect(() => {
    const channel = supabase
      .channel("perfiles-contacts")
      .on("postgres_changes", { event: "*", schema: "public", table: "contacts" }, () => {
        refrescar();
      })
      .subscribe();

    const interval = setInterval(refrescar, FALLBACK_POLL_MS);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [supabase, refrescar]);

  const activo = perfiles.find((p) => p.id === selectedId) ?? perfiles[0] ?? null;

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
                "flex h-16 w-16 shrink-0 animate-scale-in items-center justify-center rounded-2xl border text-2xl transition-all duration-200 sm:h-20 sm:w-20",
                isActive
                  ? "scale-105 border-gold-400/70 bg-white/10 shadow-gold"
                  : "border-white/10 bg-white/5 hover:-translate-y-0.5 hover:bg-white/10"
              )}
              title={p.name}
            >
              {p.emoji ?? "•"}
            </button>
          );
        })}
      </div>

      {activo && (
        <div className="flex-1 animate-fade-in-up rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8">
          <p className="text-xs uppercase tracking-wider text-gold-300">{activo.name}</p>
          <h2 className="mb-1 font-serif text-2xl font-semibold text-white">Estadísticas</h2>
          {activo.description && (
            <p className="mb-6 text-sm leading-relaxed text-slate-400">{activo.description}</p>
          )}

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-400">Casos agendados</p>
              <p className="text-3xl font-semibold text-gold-200">{activo.agendados}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-400">Clientes cerrados</p>
              <p className="text-3xl font-semibold text-gold-200">{activo.cerrados}</p>
            </div>
          </div>

          <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">Últimos casos</p>
          <div className="mb-6 max-h-64 space-y-2 overflow-y-auto pr-1">
            {activo.casos.length === 0 && (
              <p className="text-sm text-slate-400">Todavía no hay casos cerrados en este rubro.</p>
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
            {activo.cerrados > activo.casos.length && (
              <p className="pt-1 text-center text-xs text-slate-500">
                +{activo.cerrados - activo.casos.length} más — entrá al panel para verlos todos
              </p>
            )}
          </div>

          <button onClick={() => router.push(`/panel/${activo.slug}`)} className="btn-gold px-6 py-2.5">
            Ingresar al panel →
          </button>
        </div>
      )}
    </div>
  );
}
