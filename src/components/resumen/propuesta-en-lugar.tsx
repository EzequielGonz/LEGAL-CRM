"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { decisionConfirmar } from "@/lib/jarvis/seguridad";
import type { ItemLista } from "@/lib/resumen/lista-reglas";

type P = NonNullable<ItemLista["propuesta"]>;

/**
 * Confirmar o descartar una propuesta del asistente sin salir del Resumen (22/11). Misma regla que la
 * tarjeta «¿Lo hago?» de Jarvis: lo que hace salir mensajes pide marcar que se entendió, lo que gasta o
 * enciende un bot pide el código (lo escribe la persona) y todo se vuelve a validar en el servidor
 * (`/api/asistente/acciones/[id]`). Sin «Sí» no pasa nada.
 */
export function PropuestaEnLugar({ p, alResolver }: { p: P; alResolver: (mensaje: string) => void }) {
  const decision = decisionConfirmar({ tipo: p.tipo, detalle: p.detalle as any });
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entendido, setEntendido] = useState(false);
  const [codigo, setCodigo] = useState("");
  const idError = useId();
  const idCodigo = useId();
  if (!decision.mostrar) {
    return (
      <div className="rs-prop-item" role="note">
        <p className="rs-prop-item__titulo">{p.titulo}</p>
        <p className="rs-prop-item__texto">{decision.motivo}</p>
        <Link href="/asistente" prefetch={false} className="rs-btn">Verla en el asistente</Link>
      </div>
    );
  }
  const falta = (decision.extra === "reforzada" && !entendido) || (decision.extra === "codigo" && codigo.trim().length < 4);

  async function si() {
    setOcupado(true);
    setError(null);
    try {
      for (let vuelta = 0; vuelta < 40; vuelta++) {
        const res = await fetch(`/api/asistente/acciones/${p.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ desde: "jarvis", confirmar_envio: decision.extra === "reforzada" ? entendido : undefined, pin: decision.extra === "codigo" ? codigo : undefined }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error ?? "No se pudo hacer.");
        if (data.estado === "error") throw new Error(data?.resultado?.mensaje ?? "La tarea terminó con un error. Revisala en el asistente.");
        if (!data.pendientes) {
          alResolver(`Hecho: ${p.titulo}`);
          return;
        }
      }
      alResolver(`En marcha: ${p.titulo}. Seguila en el asistente.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
      setCodigo("");
    }
  }
  async function no() {
    setOcupado(true);
    setError(null);
    const res = await fetch(`/api/asistente/acciones/${p.id}`, { method: "DELETE" }).catch(() => null);
    setOcupado(false);
    if (res?.ok) alResolver(`Descartada: ${p.titulo}. No se hizo nada.`);
    else setError("No se pudo descartar. Probá de nuevo.");
  }

  return (
    <div className="rs-prop-item">
      <p className="rs-prop-item__titulo">{p.titulo}</p>
      <p className="rs-prop-item__texto">{p.resumen}</p>
      {decision.extra === "reforzada" ? (
        <label className="rs-check">
          <input type="checkbox" checked={entendido} onChange={(e) => setEntendido(e.target.checked)} />
          <span>Revisé a quién, cuántas personas y desde qué línea: entiendo que pueden salir mensajes reales.</span>
        </label>
      ) : null}
      {decision.extra === "codigo" ? (
        <div className="rs-campo">
          <label htmlFor={idCodigo}>Código de acceso</label>
          <input id={idCodigo} type="password" inputMode="numeric" autoComplete="off" aria-invalid={error ? true : undefined} aria-describedby={error ? idError : undefined} value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 8))} />
        </div>
      ) : null}
      <div className="rs-fila-botones">
        <span className="rs-pregunta">¿Lo hago?</span>
        <button type="button" className="rs-btn rs-btn--jarvis" disabled={ocupado || falta} onClick={si}>
          {ocupado ? "Haciendo…" : "Sí, confirmar"}
        </button>
        <button type="button" className="rs-btn" disabled={ocupado} onClick={no}>
          No, descartar
        </button>
      </div>
      {error ? (
        <p id={idError} role="alert" className="rs-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
