"use client";

import { useState } from "react";

/**
 * Alterna entre la vista "planilla" (todas las columnas del Excel original,
 * tal como se ven en el archivo) y la vista "contactos" (procesada, para
 * seleccionar y lanzar campañas). Ambas ya vienen renderizadas desde el
 * servidor con los datos guardados — acá solo se muestra/oculta una u otra,
 * no se vuelve a pedir nada.
 */
export function BaseViewTabs({
  gridView,
  contactsView,
}: {
  gridView: React.ReactNode;
  contactsView: React.ReactNode;
}) {
  const [tab, setTab] = useState<"grid" | "contacts">("grid");

  return (
    <div>
      <div className="mb-3 flex gap-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab("grid")}
          className={`px-3 py-2 text-sm font-medium transition ${
            tab === "grid"
              ? "border-b-2 border-gold-500 text-slate-900"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          Vista de planilla
        </button>
        <button
          type="button"
          onClick={() => setTab("contacts")}
          className={`px-3 py-2 text-sm font-medium transition ${
            tab === "contacts"
              ? "border-b-2 border-gold-500 text-slate-900"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          Contactos y campaña
        </button>
      </div>
      <div hidden={tab !== "grid"}>{gridView}</div>
      <div hidden={tab !== "contacts"}>{contactsView}</div>
    </div>
  );
}
