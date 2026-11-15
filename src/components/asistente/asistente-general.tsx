"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { Icono } from "@/components/ui/icono-seccion";

/**
 * Asistente general (15/11, pedido de la responsable): un botón en la
 * pantalla de Perfiles, abajo de las tarjetas, que abre el asistente para
 * los cuatro perfiles sin entrar a ninguno. El panel (con el lector de
 * planillas) se carga recién la primera vez que se abre, así la pantalla de
 * Perfiles no pesa más. Cerrarlo no descarta nada.
 */
const PanelAsistenteGeneral = dynamic(() => import("@/components/asistente/panel-asistente-general").then((m) => m.PanelAsistenteGeneral), { ssr: false });

export function AsistenteGeneral() {
  const [abierto, setAbierto] = useState(false);
  const [montado, setMontado] = useState(false);
  const [hayCharla, setHayCharla] = useState(false);
  const cerrar = useCallback(() => setAbierto(false), []);

  return (
    <>
      <section aria-labelledby="asistente-general-titulo" className="mt-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-700">
            <Icono nombre="asistente" className="h-6 w-6" />
          </span>
          <div>
            <h2 id="asistente-general-titulo" className="text-xl font-semibold text-slate-900">
              Asistente general
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Pedile algo sobre los cuatro perfiles sin entrar a cada uno: cifras, bots, campañas desde planillas (una por perfil) y cualquier operación del panel. Todo cambio queda como propuesta hasta que lo confirmes.
            </p>
          </div>
        </div>
        <button type="button" onClick={() => {
            setMontado(true);
            setAbierto(true);
          }} className="btn-gold min-h-[44px] shrink-0" aria-haspopup="dialog">
          <Icono nombre="asistente" className="h-4 w-4" />
          {hayCharla ? "Volver al asistente general" : "Abrir el asistente general"}
        </button>
      </section>
      {montado && <PanelAsistenteGeneral abierto={abierto} alCerrar={cerrar} alTenerCharla={setHayCharla} />}
    </>
  );
}
