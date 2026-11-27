"use client";

import { useId, useState } from "react";
import type { SlugPerfil } from "@/lib/marca";

/**
 * Anotar un pendiente propio (22/11). No hay una tabla de recordatorios con fecha, así que se usa la
 * Bandeja que ya existe (`/api/bandeja-claude`): queda como tarea pendiente del perfil y la fecha, si se
 * pone, va escrita al principio. Se descarta con motivo desde la misma Bandeja. No crea nada nuevo en la base.
 */
export function AnotarPedido({ perfiles }: { perfiles: { slug: SlugPerfil; nombre: string }[] }) {
  const [slug, setSlug] = useState<SlugPerfil | "">(perfiles[0]?.slug ?? "");
  const [texto, setTexto] = useState("");
  const [fecha, setFecha] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const id = useId();

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!slug) return setMsg({ ok: false, t: "Elegí un perfil." });
    if (texto.trim().length < 5) return setMsg({ ok: false, t: "Escribí qué hay que hacer (unas palabras alcanzan)." });
    setOcupado(true);
    setMsg(null);
    try {
      const f = fecha ? `Para el ${fecha.split("-").reverse().join("/")}: ` : "";
      const res = await fetch("/api/bandeja-claude", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ perfil: slug, pedido: `${f}${texto.trim()}` }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar.");
      setTexto("");
      setFecha("");
      setMsg({ ok: true, t: "Anotado en la Bandeja. Lo ves y lo descartás con motivo desde ahí." });
    } catch (err) {
      setMsg({ ok: false, t: (err as Error).message });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <form onSubmit={guardar} className="rs-anotar" aria-describedby={`${id}-ayuda`}>
      <p id={`${id}-ayuda`} className="rs-hoy__vacio">Dejá un recordatorio o pedido con fecha; queda en la Bandeja del perfil que elijas.</p>
      <div className="rs-anotar__fila">
        <div className="rs-campo">
          <label htmlFor={`${id}-p`}>Perfil</label>
          <select id={`${id}-p`} className="rs-input" value={slug} onChange={(e) => setSlug(e.target.value as SlugPerfil)}>
            {perfiles.map((p) => (
              <option key={p.slug} value={p.slug}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div className="rs-campo rs-campo--crece">
          <label htmlFor={`${id}-t`}>Qué hay que hacer</label>
          <input id={`${id}-t`} className="rs-input" value={texto} maxLength={500} onChange={(e) => setTexto(e.target.value)} placeholder="Ej.: llamar a la clínica por el convenio" />
        </div>
        <div className="rs-campo">
          <label htmlFor={`${id}-f`}>Fecha (opcional)</label>
          <input id={`${id}-f`} type="date" className="rs-input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <button type="submit" className="rs-btn rs-btn--jarvis rs-anotar__ir" disabled={ocupado}>
          {ocupado ? "Guardando…" : "Anotar"}
        </button>
      </div>
      <p role={msg?.ok === false ? "alert" : "status"} className={msg ? (msg.ok ? "rs-aviso" : "rs-error") : "sr-only"}>
        {msg?.t ?? ""}
      </p>
    </form>
  );
}
