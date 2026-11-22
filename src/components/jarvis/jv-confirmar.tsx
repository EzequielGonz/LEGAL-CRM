"use client";

import { useId, useState } from "react";
import { decisionConfirmar } from "@/lib/jarvis/seguridad";
import { textoResultado, type Propuesta } from "@/components/asistente/asistente-panel";

/**
 * Tarjeta «¿Lo hago?» de Jarvis (22/11). Todo lo que cambia algo pasa por acá:
 * Sí / No. Si puede hacer salir mensajes pide marcar que se entendió; si
 * gasta o enciende un bot, pide el código (lo escribe la persona, Jarvis no
 * lo ve). Usa las mismas rutas de confirmación que el asistente de siempre,
 * que vuelven a validar todo en el servidor.
 */
export function JvConfirmar({ p, alCambiar }: { p: Propuesta; alCambiar: (p: Propuesta) => void }) {
  const decision = decisionConfirmar({ tipo: p.tipo, detalle: p.detalle });
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entendido, setEntendido] = useState(false);
  const [codigo, setCodigo] = useState("");
  const idError = useId();
  if (!decision.mostrar) {
    return (
      <div className="jv-tarjeta" role="note">
        <p className="jv-tarjeta-titulo">{p.titulo}</p>
        <p className="jv-tarjeta-texto">{decision.motivo}</p>
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
          body: JSON.stringify({ confirmar_envio: decision.extra === "reforzada" ? entendido : undefined, pin: decision.extra === "codigo" ? codigo : undefined }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error ?? "No se pudo hacer.");
        const r = data.resultado ?? {};
        alCambiar({ ...p, estado: data.estado, resultado: r, avance: r.total ? { hechas: r.hechas, total: r.total } : null });
        if (!data.pendientes) break;
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
      setCodigo("");
    }
  }
  async function no() {
    setOcupado(true);
    const res = await fetch(`/api/asistente/acciones/${p.id}`, { method: "DELETE" }).catch(() => null);
    setOcupado(false);
    if (res?.ok) alCambiar({ ...p, estado: "descartada" });
  }

  const hecho = textoResultado(p);
  return (
    <div className="jv-tarjeta jv-confirmar" data-estado={p.estado}>
      <p className="jv-tarjeta-titulo">{p.titulo}</p>
      <p className="jv-tarjeta-texto">{p.resumen}</p>
      {p.estado === "propuesta" && decision.extra === "reforzada" && (
        <label className="jv-check">
          <input type="checkbox" checked={entendido} onChange={(e) => setEntendido(e.target.checked)} />
          <span>Revisé a quién, cuántas personas y desde qué línea: entiendo que pueden salir mensajes reales.</span>
        </label>
      )}
      {p.estado === "propuesta" && decision.extra === "codigo" && (
        <label className="jv-campo">
          Código de acceso
          <input type="password" inputMode="numeric" autoComplete="off" aria-invalid={error ? true : undefined} aria-describedby={error ? idError : undefined} value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 8))} />
        </label>
      )}
      {p.estado === "propuesta" && (
        <div className="jv-fila-botones">
          <span className="jv-pregunta">¿Lo hago?</span>
          <button type="button" className="jv-boton jv-boton-acento" disabled={ocupado || falta} onClick={si}>
            {ocupado ? "Haciendo…" : "Sí"}
          </button>
          <button type="button" className="jv-boton" disabled={ocupado} onClick={no}>
            No
          </button>
        </div>
      )}
      {p.estado === "ejecutando" && !ocupado && (
        <button type="button" className="jv-boton jv-boton-acento" onClick={si}>
          Seguir
        </button>
      )}
      {p.estado === "descartada" && (
        <p role="status" className="jv-estado">
          Listo, no hice nada.
        </p>
      )}
      {(p.estado === "ejecutada" || p.estado === "error") && hecho && (
        <p role={p.estado === "error" ? "alert" : "status"} className={p.estado === "error" ? "jv-estado jv-estado-error" : "jv-estado jv-estado-ok"}>
          {hecho}
        </p>
      )}
      {error && (
        <p id={idError} role="alert" className="jv-estado jv-estado-error">
          {error}
        </p>
      )}
    </div>
  );
}
