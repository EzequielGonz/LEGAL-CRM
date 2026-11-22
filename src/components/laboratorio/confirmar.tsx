"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export interface PedidoConfirmacion {
  /** Pregunta clara, por ejemplo «¿Creo este rol para Jurídico?». */
  titulo: string;
  /** Qué va a pasar y qué no. */
  detalle: ReactNode;
  /** Reforzada: pide tildar que se entiende que cambia cómo responde el bot en charlas reales. */
  reforzada?: boolean;
  textoSi?: string;
  /** Hace la acción; devuelve el mensaje de éxito o lanza un Error. */
  hacer: () => Promise<string>;
}

/**
 * Confirmación de toda acción del laboratorio (22/11): «¿Creo este rol para Jurídico? Sí / No».
 * Con `reforzada`, el «Sí» queda apagado hasta tildar la casilla. Escape o «No» la cierran sin hacer nada.
 */
export function Confirmar({ pedido, onCerrar, onResultado }: { pedido: PedidoConfirmacion; onCerrar: () => void; onResultado: (ok: string | null, error: string | null) => void }) {
  const id = useId();
  const caja = useRef<HTMLDivElement>(null);
  const [entiendo, setEntiendo] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    caja.current?.focus();
    return () => previo?.focus?.();
  }, []);

  async function si() {
    setOcupado(true);
    try {
      const msg = await pedido.hacer();
      onResultado(msg, null);
    } catch (e) {
      onResultado(null, (e as Error).message);
    }
    onCerrar();
  }

  function teclas(e: React.KeyboardEvent) {
    if (e.key === "Escape" && !ocupado) onCerrar();
    if (e.key !== "Tab") return;
    const f = Array.from(caja.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input, [tabindex='0']") ?? []);
    if (!f.length) return;
    const primero = f[0];
    const ultimo = f[f.length - 1];
    if (e.shiftKey && document.activeElement === caja.current) { e.preventDefault(); ultimo.focus(); }
    else if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  }

  return (
    <div className="lab-velo" onKeyDown={teclas}>
      <div ref={caja} role="alertdialog" aria-modal="true" aria-labelledby={`${id}-t`} aria-describedby={`${id}-d`} tabIndex={-1} className={`lab-dialogo${pedido.reforzada ? " lab-dialogo-fuerte" : ""}`}>
        <h3 id={`${id}-t`} className="text-lg font-semibold">{pedido.titulo}</h3>
        <div id={`${id}-d`} className="lab-t2 mt-2 space-y-2 text-sm">{pedido.detalle}</div>
        {pedido.reforzada && (
          <label className="lab-casilla mt-3">
            <input type="checkbox" checked={entiendo} onChange={(e) => setEntiendo(e.target.checked)} />
            <span>Entiendo que desde ahora el bot habla distinto en charlas reales.</span>
          </label>
        )}
        <div className="lab-acciones mt-4">
          <button type="button" className="lab-boton" disabled={ocupado || (pedido.reforzada && !entiendo)} onClick={si}>
            {ocupado ? "Un momento…" : pedido.textoSi ?? "Sí"}
          </button>
          <button type="button" className="lab-boton-sec" disabled={ocupado} onClick={onCerrar}>
            No
          </button>
        </div>
      </div>
    </div>
  );
}
