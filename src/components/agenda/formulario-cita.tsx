"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { DURACIONES, instanteDesdeCampo, validarHorario } from "@/lib/agenda-vista";

type Persona = { id: string; nombre: string; telefono: string | null };

/**
 * Crea una cita con la ruta que ya existe (`/api/contacts/[id]/appointments`): persona, fecha y hora, duración y nota.
 * Con `persona` fija (desde una fila de Contactos) no busca; sin ella, busca en el perfil por nombre o teléfono.
 * La nota se guarda como «tipo de cita». No envía mensajes.
 */
export function FormularioCita({ slug, persona, onListo, onCancelar }: { slug: string; persona?: Persona; onListo: (m: string) => void; onCancelar: () => void }) {
  const router = useRouter();
  const id = useId();
  const [elegida, setElegida] = useState<Persona | null>(persona ?? null);
  const [q, setQ] = useState("");
  const [encontradas, setEncontradas] = useState<Persona[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [inicio, setInicio] = useState("");
  const [duracion, setDuracion] = useState(30);
  const [nota, setNota] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (elegida || q.trim().length < 2) {
      setEncontradas([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const r = await fetch(`/api/contactos/buscar?perfil=${slug}&q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const d = await r.json().catch(() => ({}));
        setEncontradas(r.ok ? d.personas ?? [] : []);
      } catch {
        /* cancelada */
      } finally {
        setBuscando(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, elegida, slug]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!elegida) return setError("Elegí a la persona.");
    const iso = instanteDesdeCampo(inicio);
    const mal = validarHorario(iso, duracion);
    if (mal) return setError(mal);
    setOcupado(true);
    try {
      const res = await fetch(`/api/contacts/${elegida.id}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starts_at: iso, duration_minutes: duracion, consultation_type: nota.trim().slice(0, 200) || undefined }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return setError(d.error ?? "No se pudo agendar la cita.");
      onListo(`Cita agendada para ${elegida.nombre}.`);
      router.refresh();
    } catch {
      setError("No se pudo conectar. Revisá la conexión y probá de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <form onSubmit={guardar} className="ct-form" noValidate>
      <div className="ct-campo">
        <label htmlFor={`${id}-p`}>Persona</label>
        {elegida ? (
          <div className="ct-elegida">
            <span>
              <strong>{elegida.nombre}</strong>
              {elegida.telefono ? <span className="ct-tenue"> · {elegida.telefono}</span> : null}
            </span>
            {persona ? null : (
              <button type="button" className="ct-link" onClick={() => setElegida(null)}>
                Cambiar
              </button>
            )}
          </div>
        ) : (
          <>
            <input id={`${id}-p`} type="search" autoComplete="off" placeholder="Nombre o teléfono" value={q} onChange={(e) => setQ(e.target.value)} className="ct-input" aria-describedby={`${id}-ayuda`} />
            <p id={`${id}-ayuda`} className="ct-ayuda" aria-live="polite">
              {buscando ? "Buscando…" : q.trim().length < 2 ? "Escribí al menos 2 letras." : encontradas.length === 0 ? "No hay nadie con ese dato en este perfil." : `${encontradas.length} resultado${encontradas.length === 1 ? "" : "s"}.`}
            </p>
            {encontradas.length > 0 ? (
              <ul className="ct-resultados">
                {encontradas.map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => setElegida(p)}>
                      <strong>{p.nombre}</strong>
                      <span className="ct-tenue">{p.telefono ?? "sin teléfono"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </div>
      <div className="ct-fila-campos">
        <div className="ct-campo">
          <label htmlFor={`${id}-f`}>Fecha y hora</label>
          <input id={`${id}-f`} type="datetime-local" required value={inicio} onChange={(e) => setInicio(e.target.value)} className="ct-input" />
        </div>
        <div className="ct-campo">
          <label htmlFor={`${id}-d`}>Duración</label>
          <select id={`${id}-d`} value={duracion} onChange={(e) => setDuracion(Number(e.target.value))} className="ct-input">
            {DURACIONES.map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="ct-campo">
        <label htmlFor={`${id}-n`}>Nota (opcional)</label>
        <input id={`${id}-n`} value={nota} maxLength={200} onChange={(e) => setNota(e.target.value)} placeholder="Motivo o tema de la cita" className="ct-input" />
      </div>
      {error ? (
        <p role="alert" className="ct-error">
          {error}
        </p>
      ) : null}
      <div className="ct-acciones">
        <button type="button" className="pm-boton pm-boton--secundario" onClick={onCancelar} disabled={ocupado}>
          Cancelar
        </button>
        <button type="submit" className="pm-boton pm-boton--primario" disabled={ocupado}>
          {ocupado ? "Agendando…" : "Agendar cita"}
        </button>
      </div>
    </form>
  );
}
