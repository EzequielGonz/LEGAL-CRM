"use client";

import { useState } from "react";
import { pedirConfirmacion } from "@/components/ui/dialogo-confirmar";
import { AYUDA, BTN, BTN_PELIGRO, BTN_PRINCIPAL, CAMPO, ETIQUETA, Insignia, Mensajes, SUBTITULO, TARJETA, pedir, perfilesDe } from "./comun";
import type { PropsPestana } from "./laboratorio-bot";

/**
 * Pestaña «Modelos de IA»: el modelo de cada versión del laboratorio (solo
 * mientras no responde charlas) y la estructura para otro proveedor, que
 * queda «preparado, sin conectar»: no hay llamadas implementadas y nunca se
 * guardan ni se piden claves en pantalla.
 */
export function PestanaModelos({ sel, nombres, resumen, modelos, recargar }: PropsPestana) {
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [eleccion, setEleccion] = useState<Record<number, string>>({});
  const [prov, setProv] = useState({ nombre: "", endpoint: "", variable_clave: "", notas: "" });
  const perfiles = perfilesDe(sel);
  const delLab = resumen.versiones.filter((v) => v.laboratorio && v.estado !== "archivada" && v.rubros.some((r) => perfiles.includes(r)));

  async function accion(f: () => Promise<string>) {
    setOk(null);
    setError(null);
    setOcupado(true);
    try {
      setOk((await f()) || null);
      await recargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="space-y-6">
      <Mensajes ok={ok} error={error} />
      <section aria-labelledby="lab-modelos-hoy">
        <h4 id="lab-modelos-hoy" className={SUBTITULO}>Modelo de hoy</h4>
        <p className="mt-1 text-sm text-slate-800">
          Los bots responden con <strong className="break-all">{resumen.modeloServidor}</strong> (configuración del servidor). Eso no cambia desde acá: cada versión nueva o prueba A/B puede usar otro modelo de Gemini, y solo rige si la aplicás.
        </p>
        <p className={AYUDA}>
          {modelos
            ? modelos.origen === "api"
              ? `Lista leída de Gemini para la clave del servidor (${modelos.modelos.length} modelos que generan texto).`
              : "Gemini no devolvió la lista: se muestra la lista configurable (variable LABORATORIO_MODELOS) y el modelo de hoy."
            : "Cargando la lista de modelos…"}
        </p>
      </section>

      <section aria-labelledby="lab-modelos-version">
        <h4 id="lab-modelos-version" className={SUBTITULO}>Modelo por versión</h4>
        {delLab.length === 0 ? (
          <p className="mt-1 text-sm text-slate-700">Todavía no hay versiones del laboratorio para {sel === "todos" ? "estos perfiles" : nombres[sel] ?? sel}. Creá una en «Versiones».</p>
        ) : (
          <ul className="mt-2 grid gap-3 lg:grid-cols-2">
            {delLab.map((v) => {
              const libre = v.estado === "borrador";
              const valor = eleccion[v.version] ?? v.modelo ?? "";
              return (
                <li key={v.version} className={TARJETA}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{v.nombre}</p>
                    <Insignia estado={v.estado} />
                  </div>
                  <label className="mt-2 block">
                    <span className={ETIQUETA}>Modelo</span>
                    <select className={CAMPO} value={valor} disabled={!libre || ocupado} onChange={(e) => setEleccion((x) => ({ ...x, [v.version]: e.target.value }))}>
                      <option value="">El del servidor ({resumen.modeloServidor})</option>
                      {Array.from(new Set([...(modelos?.modelos ?? []), ...(v.modelo ? [v.modelo] : [])]))
                        .filter((m) => m !== resumen.modeloServidor)
                        .map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                    </select>
                  </label>
                  {libre ? (
                    valor !== (v.modelo ?? "") && (
                      <button
                        type="button"
                        className={`${BTN_PRINCIPAL} mt-2`}
                        disabled={ocupado}
                        onClick={() =>
                          accion(async () => {
                            await pedir({ accion: "modelo_version", version: v.version, modelo: valor });
                            return `v${v.version} usará ${valor || "el modelo del servidor"} cuando la apliques o la pruebes.`;
                          })
                        }
                      >
                        Guardar modelo
                      </button>
                    )
                  ) : (
                    <p className={AYUDA}>Esta versión ya responde charlas: su modelo no se cambia. Para probar otro, creá una versión nueva o una prueba A/B con ese modelo.</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="lab-proveedores">
        <h4 id="lab-proveedores" className={SUBTITULO}>Otros proveedores (para más adelante)</h4>
        <p className="mt-1 text-sm text-slate-700">
          Se deja anotado el nombre, la dirección y el <strong>nombre</strong> de la variable de entorno donde estaría la clave. La clave nunca se escribe acá ni se guarda en la base. No hay conexión implementada: figuran como «preparado, sin conectar».
        </p>
        {resumen.proveedores.length > 0 && (
          <ul className="mt-2 space-y-2">
            {resumen.proveedores.map((p) => (
              <li key={p.id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {p.nombre} <span className="ml-1 rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">Preparado, sin conectar</span>
                  </p>
                  <p className="break-all text-slate-700">{p.endpoint}</p>
                  <p className="text-slate-700">
                    Variable: <code>{p.variable_clave}</code> · {p.configurada ? "existe en el servidor (igual no se usa)" : "no existe en el servidor"}
                  </p>
                </div>
                <button
                  type="button"
                  className={BTN_PELIGRO}
                  disabled={ocupado}
                  onClick={() =>
                    accion(async () => {
                      if (!(await pedirConfirmacion({ titulo: `¿Archivar ${p.nombre}?`, texto: "No se borra: queda archivado.", confirmar: "Archivar", peligro: true }))) return "";
                      await pedir({ accion: "archivar_proveedor", id: p.id });
                      return `${p.nombre} quedó archivado.`;
                    })
                  }
                >
                  Archivar
                </button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            accion(async () => {
              await pedir({ accion: "proveedor", ...prov });
              setProv({ nombre: "", endpoint: "", variable_clave: "", notas: "" });
              return "Proveedor anotado como «preparado, sin conectar».";
            });
          }}
        >
          <label className="block">
            <span className={ETIQUETA}>Nombre</span>
            <input className={CAMPO} value={prov.nombre} maxLength={60} onChange={(e) => setProv({ ...prov, nombre: e.target.value })} required />
          </label>
          <label className="block">
            <span className={ETIQUETA}>Dirección (https://…)</span>
            <input className={CAMPO} type="url" inputMode="url" value={prov.endpoint} maxLength={300} onChange={(e) => setProv({ ...prov, endpoint: e.target.value })} required />
          </label>
          <label className="block">
            <span className={ETIQUETA}>Nombre de la variable de entorno</span>
            <input className={CAMPO} value={prov.variable_clave} maxLength={64} onChange={(e) => setProv({ ...prov, variable_clave: e.target.value.toUpperCase() })} required placeholder="OTRO_PROVEEDOR_API_KEY" autoComplete="off" />
            <span className={AYUDA}>Solo el nombre. La clave se carga en el servidor, nunca acá.</span>
          </label>
          <label className="block">
            <span className={ETIQUETA}>Notas (opcional)</span>
            <input className={CAMPO} value={prov.notas} maxLength={500} onChange={(e) => setProv({ ...prov, notas: e.target.value })} autoComplete="off" />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className={BTN} disabled={ocupado}>
              Anotar proveedor
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
