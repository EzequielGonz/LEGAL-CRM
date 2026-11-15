"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { BTN, CAMPO, Mensajes, pedir, RUBROS, type Biblioteca, type Resumen, type Seleccion } from "./comun";
import { PestanaVersiones } from "./versiones";
import { PestanaModelos } from "./modelos";
import { PestanaRoles } from "./roles";
import { PestanaPruebas } from "./pruebas";
import { PestanaComparativas } from "./comparativas";
import { PestanaAsistente } from "./asistente";

/**
 * Laboratorio del bot (15/11). Panel que se despliega desde «Conocimiento del
 * bot». Arriba se elige «Todos los perfiles» o uno; abajo, seis pestañas.
 *
 * Regla de la responsable: nada de lo que hoy rige cambia. Lo que se crea acá
 * (versiones, roles, proveedores) queda aparte y solo responde charlas reales
 * si alguien lo aplica a mano, con confirmación y con vuelta atrás.
 */
const PESTANAS = [
  { id: "versiones", label: "Versiones" },
  { id: "modelos", label: "Modelos de IA" },
  { id: "roles", label: "Roles y fichas" },
  { id: "pruebas", label: "Pruebas" },
  { id: "comparativas", label: "Comparativas e informes" },
  { id: "asistente", label: "Asistente" },
] as const;
type IdPestana = (typeof PESTANAS)[number]["id"];

const CLAVE = "laboratorio-bot-preferencias";

export function LaboratorioBot({ nombres, id }: { nombres: Record<string, string>; id: string }) {
  const [sel, setSel] = useState<Seleccion>("todos");
  const [pestana, setPestana] = useState<IdPestana>("versiones");
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [biblioteca, setBiblioteca] = useState<Biblioteca | null>(null);
  const [modelos, setModelos] = useState<{ modelos: string[]; origen: "api" | "configuracion"; delServidor: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(CLAVE) ?? "{}");
      if (p.sel === "todos" || RUBROS.includes(p.sel)) setSel(p.sel);
      if (PESTANAS.some((x) => x.id === p.pestana)) setPestana(p.pestana);
    } catch {
      /* sin almacenamiento: valores por defecto */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify({ sel, pestana }));
    } catch {
      /* nada */
    }
  }, [sel, pestana]);

  const recargar = useCallback(async () => {
    try {
      const [r, b] = await Promise.all([pedir<Resumen>("vista=resumen"), pedir<Biblioteca>("vista=biblioteca")]);
      setResumen(r);
      setBiblioteca(b);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    recargar();
    pedir("vista=modelos").then(setModelos).catch(() => setModelos(null));
  }, [recargar]);

  function teclado(e: React.KeyboardEvent, i: number) {
    let j = -1;
    if (e.key === "ArrowRight") j = (i + 1) % PESTANAS.length;
    else if (e.key === "ArrowLeft") j = (i - 1 + PESTANAS.length) % PESTANAS.length;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = PESTANAS.length - 1;
    if (j < 0) return;
    e.preventDefault();
    setPestana(PESTANAS[j].id);
    refs.current[j]?.focus();
  }

  const props = { sel, nombres, resumen, biblioteca, modelos, recargar };

  return (
    <div id={id} className="mt-4 rounded-2xl border border-slate-300 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-slate-900">Laboratorio del bot</h3>
          <p className="mt-1 max-w-3xl text-sm text-slate-700">
            Creá y probá versiones nuevas sin tocar lo que rige hoy. Cada bot sigue con su versión, su modelo y sus roles; lo nuevo solo responde charlas reales si lo aplicás a mano, y siempre podés volver atrás.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-800">Perfil</span>
            <select className={`${CAMPO} sm:w-60`} value={sel} onChange={(e) => setSel(e.target.value as Seleccion)}>
              <option value="todos">Todos los perfiles</option>
              {RUBROS.map((r) => (
                <option key={r} value={r}>
                  {nombres[r] ?? r}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className={BTN} onClick={recargar}>
            Actualizar
          </button>
        </div>
      </div>

      {resumen?.experimentoGlobal && (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Hay una comparación A/B/C general en curso («{resumen.experimentoGlobal.nombre}»). Mientras dure, no se arman pruebas A/B por campaña desde acá para no mezclar resultados.
        </p>
      )}
      <div className="mt-3">
        <Mensajes ok={null} error={error} />
      </div>

      <div role="tablist" aria-label="Secciones del laboratorio" className="mt-4 flex gap-1 overflow-x-auto border-b border-slate-200 pb-px">
        {PESTANAS.map((p, i) => {
          const activa = pestana === p.id;
          return (
            <button
              key={p.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${p.id}`}
              aria-selected={activa}
              aria-controls={`${base}-panel-${p.id}`}
              tabIndex={activa ? 0 : -1}
              onClick={() => setPestana(p.id)}
              onKeyDown={(e) => teclado(e, i)}
              className={`min-h-11 shrink-0 whitespace-nowrap rounded-t-lg border-b-2 px-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                activa ? "border-slate-900 text-slate-900" : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {PESTANAS.map((p) => (
        <div key={p.id} role="tabpanel" id={`${base}-panel-${p.id}`} aria-labelledby={`${base}-tab-${p.id}`} hidden={pestana !== p.id} tabIndex={0} className="pt-4 focus-visible:outline-none">
          {pestana === p.id && !resumen && !error && <p className="text-sm text-slate-600" role="status">Cargando el laboratorio…</p>}
          {pestana === p.id && resumen && (
            <>
              {p.id === "versiones" && <PestanaVersiones {...props} resumen={resumen} />}
              {p.id === "modelos" && <PestanaModelos {...props} resumen={resumen} />}
              {p.id === "roles" && <PestanaRoles {...props} resumen={resumen} />}
              {p.id === "pruebas" && <PestanaPruebas {...props} resumen={resumen} />}
              {p.id === "comparativas" && <PestanaComparativas {...props} resumen={resumen} />}
              {p.id === "asistente" && <PestanaAsistente {...props} resumen={resumen} />}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export interface PropsPestana {
  sel: Seleccion;
  nombres: Record<string, string>;
  resumen: Resumen;
  biblioteca: Biblioteca | null;
  modelos: { modelos: string[]; origen: "api" | "configuracion"; delServidor: string } | null;
  recargar: () => Promise<void>;
}
