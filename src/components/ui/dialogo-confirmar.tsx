"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { useDialogo } from "@/components/ui/use-dialogo";

export interface CampoConfirmacion {
  etiqueta: string;
  valorInicial?: string;
  tipo?: "text" | "number";
  placeholder?: string;
  obligatorio?: boolean;
}

export interface OpcionesConfirmacion {
  titulo: string;
  /** Los saltos `\n\n` se muestran como párrafos separados. */
  texto?: string;
  /** Verbo del botón principal: «Desconectar», «Archivar», «Guardar»… */
  confirmar: string;
  cancelar?: string;
  /** Botón principal en rojo (desconectar, archivar). */
  peligro?: boolean;
  campo?: CampoConfirmacion;
}

/** `null` = canceló; `true` = confirmó sin campo; texto = lo escrito en el campo. */
export type ResultadoConfirmacion = string | true | null;

interface DialogoConfirmarProps {
  opciones: OpcionesConfirmacion;
  alResolver: (resultado: ResultadoConfirmacion) => void;
}

/**
 * Diálogo de confirmación propio de la aplicación (reemplaza a
 * `window.confirm` y `window.prompt`). Se monta en `document.body` con el
 * mismo comportamiento modal que los demás diálogos (`useDialogo`).
 */
export function DialogoConfirmar({ opciones, alResolver }: DialogoConfirmarProps) {
  const { titulo, texto, confirmar, cancelar = "Cancelar", peligro = false, campo } = opciones;
  const idTitulo = useId();
  const idTexto = useId();
  const idCampo = useId();
  const [valor, setValor] = useState(campo?.valorInicial ?? "");
  const campoRef = useRef<HTMLInputElement | null>(null);
  const cancelarDialogo = useCallback(() => alResolver(null), [alResolver]);
  const dialogoRef = useDialogo<HTMLDivElement>(true, cancelarDialogo);

  // Con campo, el foco inicial va al campo (después del foco que pone useDialogo).
  useEffect(() => {
    if (!campo) return;
    const t = window.setTimeout(() => {
      campoRef.current?.focus({ preventScroll: true });
      campoRef.current?.select();
    }, 0);
    return () => window.clearTimeout(t);
  }, [campo]);

  const bloqueado = !!campo?.obligatorio && valor.trim() === "";

  function aceptar() {
    if (bloqueado) return;
    alResolver(campo ? valor : true);
  }

  const parrafos = texto ? texto.split(/\n\n+/) : [];
  // El diálogo se monta en <body> (fuera del panel): conserva la paleta del perfil.
  const tema = document.querySelector("[data-tema]")?.getAttribute("data-tema") ?? undefined;

  return createPortal(
    <div
      data-portal-dialogo=""
      data-tema={tema}
      className="dialogo-velo fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      onClick={cancelarDialogo}
    >
      <div
        ref={dialogoRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={parrafos.length ? idTexto : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="dialogo-caja max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl outline-none"
      >
        <h2 id={idTitulo} className="text-base font-semibold text-slate-900 [overflow-wrap:anywhere]">
          {titulo}
        </h2>
        {parrafos.length > 0 && (
          <div id={idTexto} className="mt-2 space-y-2 text-sm text-slate-700 [overflow-wrap:anywhere]">
            {parrafos.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}
        {campo && (
          <label htmlFor={idCampo} className="mt-4 block text-sm">
            <span className="font-medium text-slate-800">{campo.etiqueta}</span>
            <input
              id={idCampo}
              ref={campoRef}
              type={campo.tipo ?? "text"}
              inputMode={campo.tipo === "number" ? "numeric" : undefined}
              min={campo.tipo === "number" ? 0 : undefined}
              value={valor}
              placeholder={campo.placeholder}
              required={!!campo.obligatorio}
              onChange={(e) => setValor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  aceptar();
                }
              }}
              className="tactil focus-gold mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400"
            />
          </label>
        )}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={cancelarDialogo} className="tactil focus-gold rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50">
            {cancelar}
          </button>
          <button
            type="button"
            onClick={aceptar}
            disabled={bloqueado}
            className={clsx(
              "tactil focus-gold rounded-lg px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50",
              peligro ? "bg-red-700 hover:bg-red-800" : "bg-slate-900 hover:bg-slate-800"
            )}
          >
            {confirmar}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Uso: `const { pedir, dialogo } = useConfirmacion();` y renderizar
 * `{dialogo}` una vez. `await pedir({...})` devuelve `null` si la persona
 * cancela, `true` si confirma sin campo o el texto escrito si hay campo.
 */
export function useConfirmacion() {
  const [pendiente, setPendiente] = useState<OpcionesConfirmacion | null>(null);
  const resolverRef = useRef<((r: ResultadoConfirmacion) => void) | null>(null);

  const pedir = useCallback((opciones: OpcionesConfirmacion) => {
    // Si había otro diálogo abierto, se lo da por cancelado.
    resolverRef.current?.(null);
    return new Promise<ResultadoConfirmacion>((resolver) => {
      resolverRef.current = resolver;
      setPendiente(opciones);
    });
  }, []);

  const resolver = useCallback((r: ResultadoConfirmacion) => {
    const f = resolverRef.current;
    resolverRef.current = null;
    setPendiente(null);
    f?.(r);
  }, []);

  useEffect(
    () => () => {
      resolverRef.current?.(null);
      resolverRef.current = null;
    },
    []
  );

  const dialogo = pendiente ? <DialogoConfirmar opciones={pendiente} alResolver={resolver} /> : null;
  return { pedir, dialogo };
}
