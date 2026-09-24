"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

type Perfil = {
  id: string;
  slug: string;
  name: string;
  emoji: string | null;
  description: string | null;
  agendados: number;
  cerrados: number;
};

/**
 * Selector de perfiles estilo Netflix para la pantalla de Computadora: a
 * la izquierda los 4 rubros como íconos, a la derecha una vista previa de
 * estadísticas (casos agendados / clientes cerrados) del rubro elegido.
 * "Ingresar →" recién ahí lleva al panel completo de ese rubro
 * (/panel/[slug]) — elegir un perfil acá NO entra directo, primero
 * muestra el preview, como pidió Vita.
 */
export function PerfilSelector({ perfiles }: { perfiles: Perfil[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(perfiles[0]?.id ?? null);

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

          <div className="mb-8 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-400">Casos agendados</p>
              <p className="text-3xl font-semibold text-gold-200">{activo.agendados}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-400">Clientes cerrados</p>
              <p className="text-3xl font-semibold text-gold-200">{activo.cerrados}</p>
            </div>
          </div>

          <button onClick={() => router.push(`/panel/${activo.slug}`)} className="btn-gold px-6 py-2.5">
            Ingresar →
          </button>
        </div>
      )}
    </div>
  );
}
