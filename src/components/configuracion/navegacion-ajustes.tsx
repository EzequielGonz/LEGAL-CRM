"use client";

import { useState } from "react";
import { EnlaceAvanzado } from "@/components/nivel/nivel";

export interface GrupoNav {
  id: string;
  titulo: string;
  resumen?: string;
}

/**
 * Navegación interna y buscador de Configuración (rediseño 17/10, bloque 3).
 * En Simple: tarjetas de los grupos con su estado y acceso a la
 * configuración completa. En Avanzado: índice de grupos y búsqueda que
 * filtra las secciones por título y palabras clave (solo oculta; no
 * desmonta formularios ni descarta lo escrito).
 */
export function NavegacionAjustes({ grupos }: { grupos: GrupoNav[] }) {
  const [q, setQ] = useState("");
  const [aviso, setAviso] = useState("");
  const filtrar = (texto: string) => {
    setQ(texto);
    const t = texto.trim().toLowerCase();
    let visibles = 0;
    document.querySelectorAll<HTMLElement>("[data-grupo-ajustes]").forEach((g) => {
      let enGrupo = 0;
      g.querySelectorAll<HTMLElement>("[data-buscar]").forEach((s) => {
        const ok = !t || (s.dataset.buscar ?? "").includes(t);
        s.hidden = !ok;
        if (ok) enGrupo++;
      });
      g.hidden = enGrupo === 0;
      visibles += enGrupo;
    });
    setAviso(t ? `${visibles} ${visibles === 1 ? "sección coincide" : "secciones coinciden"} con «${texto.trim()}».` : "");
  };
  return (
    <>
      <nav aria-label="Grupos de configuración" className="solo-simple">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Configuración completa</h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {grupos.map((g) => (
            <li key={g.id}>
              <EnlaceAvanzado href={`#grupo-${g.id}`} className="tactil flex h-full flex-col justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-slate-400">
                <span className="text-sm font-medium text-slate-900">{g.titulo}</span>
                {g.resumen && <span className="text-xs text-slate-600">{g.resumen}</span>}
              </EnlaceAvanzado>
            </li>
          ))}
        </ul>
      </nav>
      <div className="solo-avanzado space-y-3 lg:sticky lg:top-14 lg:z-10 lg:-mx-2 lg:bg-slate-50/95 lg:px-2 lg:py-2">
        <label className="block">
          <span className="sr-only">Buscar en Configuración</span>
          <input
            type="search"
            value={q}
            onChange={(e) => filtrar(e.target.value)}
            placeholder="Buscar un ajuste (por ejemplo: horario, PIN, plantillas)"
            className="tactil w-full rounded-lg border border-slate-300 bg-white px-3"
          />
        </label>
        <p role="status" aria-live="polite" className={aviso ? "text-sm text-slate-700" : "sr-only"}>
          {aviso}
        </p>
        <nav aria-label="Ir a un grupo de configuración">
          <ul className="flex flex-wrap gap-2">
            {grupos.map((g) => (
              <li key={g.id}>
                <a href={`#grupo-${g.id}`} className="chip-opcion tactil">
                  {g.titulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
