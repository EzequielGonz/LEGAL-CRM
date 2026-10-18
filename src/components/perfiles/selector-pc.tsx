"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PerfilStats } from "@/lib/perfiles-stats";
import { marcaDe, temaDe, type SlugPerfil } from "@/lib/marca";
import { variablesAcento } from "@/lib/acento";
import { LogoPerfil } from "@/components/ui/logo-perfil";
import { Icono } from "@/components/ui/icono-seccion";
import { EditarPerfil, type MarcaTarjeta } from "@/components/perfiles/perfil-selector";

/**
 * Elegir perfil en la computadora (reorganización 2, 18/10): como antes, un
 * perfil por marca, grande y sin cifras; se toca y se entra. El lápiz edita
 * nombre, nombre interno, logo y color.
 */
export function SelectorPerfilesPC({ perfiles: inicial, marcas: marcasIniciales }: { perfiles: PerfilStats[]; marcas: Partial<Record<SlugPerfil, MarcaTarjeta>> }) {
  const router = useRouter();
  const [perfiles, setPerfiles] = useState(inicial);
  const [marcas, setMarcas] = useState(marcasIniciales);
  const [editando, setEditando] = useState<string | null>(null);

  return (
    <ul className="mx-auto grid max-w-4xl grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
      {perfiles.map((p, i) => {
        const slug = temaDe(p.slug);
        const original = marcaDe(slug);
        const m = marcas[slug] ?? { nombre: original.nombre, logo: null, acento: null };
        const estilo = (variablesAcento(m.acento) ?? undefined) as React.CSSProperties | undefined;
        return (
          <li key={p.id} data-tema={slug} style={{ ...estilo, animationDelay: `${i * 70}ms` }} className="perfil-pc group flex flex-col items-center text-center">
            <div className="relative w-full max-w-[11rem]">
            <Link href={`/panel/${slug}`} className="perfil-pc-tarjeta relative block aspect-square w-full overflow-hidden rounded-[1.75rem]" aria-label={`Entrar a ${m.nombre}`}>
              <LogoPerfil slug={slug} src={m.logo} alt="" tamano="lg" className="perfil-pc-placa" />
              <span className="perfil-pc-brillo" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => setEditando(p.id)}
              aria-label={`Editar ${m.nombre}`}
              className="perfil-pc-lapiz absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-slate-800 shadow-md transition sm:right-3 sm:top-3"
            >
              <Icono nombre="lapiz" className="h-4 w-4" />
            </button>
            </div>
            <button type="button" onClick={() => router.push(`/panel/${slug}`)} className="mt-4 max-w-full px-1">
              <span className="block truncate text-[15px] font-semibold text-white">{m.nombre}</span>
              <span className="block truncate text-xs text-slate-400">{p.name}</span>
            </button>
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
  );
}
