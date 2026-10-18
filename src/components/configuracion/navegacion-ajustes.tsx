"use client";

import { useState } from "react";

export interface GrupoNav {
  id: string;
  titulo: string;
  resumen?: string;
}

/**
 * Buscador de Configuración (reorganización 2, 18/10). Los grupos son
 * tarjetas plegadas; buscar abre las que tienen coincidencias y oculta el
 * resto (solo presentación: no desmonta formularios ni descarta lo escrito).
 */
export function NavegacionAjustes({ grupos: _grupos }: { grupos: GrupoNav[] }) {
  const [q, setQ] = useState("");
  const [aviso, setAviso] = useState("");
  const filtrar = (texto: string) => {
    setQ(texto);
    const t = texto.trim().toLowerCase();
    let visibles = 0;
    document.querySelectorAll<HTMLElement>("[data-grupo-ajustes]").forEach((g) => {
      let enGrupo = 0;
      const titulo = (g.querySelector("summary")?.textContent ?? "").toLowerCase();
      g.querySelectorAll<HTMLElement>("[data-buscar]").forEach((s) => {
        const ok = !t || (s.dataset.buscar ?? "").includes(t) || titulo.includes(t);
        s.hidden = !ok;
        if (ok) enGrupo++;
      });
      g.hidden = enGrupo === 0 && !titulo.includes(t);
      if (g instanceof HTMLDetailsElement && t) g.open = enGrupo > 0;
      visibles += enGrupo;
    });
    setAviso(t ? `${visibles} ${visibles === 1 ? "sección coincide" : "secciones coinciden"} con «${texto.trim()}».` : "");
  };
  return (
    <div className="space-y-2">
      <label className="relative block">
        <span className="sr-only">Buscar en Configuración</span>
        <input
          type="search"
          value={q}
          onChange={(e) => filtrar(e.target.value)}
          placeholder="Buscar un ajuste (por ejemplo: horario, PIN, plantillas)"
          className="tactil w-full rounded-xl border border-slate-200 bg-white px-4 shadow-sm"
        />
      </label>
      <p role="status" aria-live="polite" className={aviso ? "text-sm text-slate-700" : "sr-only"}>
        {aviso}
      </p>
    </div>
  );
}
