"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialogo } from "@/components/contactos/dialogo";
import { accionesDeCita, instanteDesdeCampo, textoRecordatorio, validarHorario, DURACIONES } from "@/lib/agenda-vista";

export interface CitaVista {
  id: string;
  status: string;
  kind: string | null;
  nombre: string;
  telefono: string | null;
  inicio: string;
  minutos: number;
  tipo: string | null;
  chatHref: string | null;
  fichaHref: string | null;
}

type Modo = "asistio" | "ausente" | "cancelada" | "confirmada" | "mover" | "recordatorio";

const TITULO: Record<Modo, string> = { asistio: "Marcar que asistió", ausente: "Marcar que no asistió", cancelada: "Cancelar la cita", confirmada: "Reabrir la cita", mover: "Mover la cita", recordatorio: "Recordatorio" };
const ESTADO_API: Record<string, string> = { asistio: "realizada", ausente: "ausente", cancelada: "cancelada", confirmada: "confirmada" };

/** Acciones de una cita: asistió, no asistió, mover, cancelar (queda archivada, no se borra), reabrir y recordatorio. Todo con confirmación. */
export function AccionesCita({ cita, onAviso }: { cita: CitaVista; onAviso?: (m: string) => void }) {
  const router = useRouter();
  const id = useId();
  const [modo, setModo] = useState<Modo | null>(null);
  const [nota, setNota] = useState("");
  const [inicio, setInicio] = useState("");
  const [dur, setDur] = useState<number>(DURACIONES.includes(cita.minutos as any) ? cita.minutos : 30);
  const [error, setError] = useState<string | null>(null);
  const [choque, setChoque] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const a = accionesDeCita(cita);
  const abrir = (m: Modo) => { setModo(m); setNota(""); setInicio(""); setError(null); setChoque(false); setCopiado(false); };
  const cerrar = () => { if (!ocupado) setModo(null); };
  const recordatorio = textoRecordatorio(cita.nombre, cita.inicio, cita.tipo);

  async function enviar(forzar = false) {
    if (!modo || modo === "recordatorio") return;
    setError(null);
    setOcupado(true);
    try {
      let res: Response;
      if (modo === "mover") {
        const iso = instanteDesdeCampo(inicio);
        const mal = validarHorario(iso, dur);
        if (mal) { setOcupado(false); return setError(mal); }
        res = await fetch(`/api/appointments/${cita.id}/mover`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ starts_at: iso, duration_minutes: dur, nota, permitir_superposicion: forzar }) });
      } else {
        res = await fetch(`/api/appointments/${cita.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado: ESTADO_API[modo], nota }) });
      }
      const d = await res.json().catch(() => ({}));
      if (res.status === 409 && d.code === "superposicion") { setChoque(true); return setError(d.error); }
      if (!res.ok) return setError(d.error ?? "No se pudo guardar.");
      onAviso?.(modo === "mover" ? "Cita movida." : modo === "cancelada" ? "Cita cancelada (queda archivada)." : "Cita actualizada.");
      setModo(null);
      router.refresh();
    } catch {
      setError("No se pudo conectar. Probá de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  async function copiar() {
    try { await navigator.clipboard.writeText(recordatorio); setCopiado(true); } catch { setError("No se pudo copiar: seleccioná el texto y copialo a mano."); }
  }

  return (
    <>
      <div className="ct-acciones-fila">
        {a.asistio ? <button type="button" className="pm-boton pm-boton--primario ct-boton" onClick={() => abrir("asistio")}>Asistió</button> : null}
        {a.noAsistio ? <button type="button" className="pm-boton pm-boton--secundario ct-boton" onClick={() => abrir("ausente")}>No asistió</button> : null}
        {a.mover ? <button type="button" className="pm-boton pm-boton--secundario ct-boton" onClick={() => abrir("mover")}>Mover</button> : null}
        {a.reabrir ? <button type="button" className="pm-boton pm-boton--secundario ct-boton" onClick={() => abrir("confirmada")}>Reabrir</button> : null}
        <details className="ct-mas">
          <summary className="pm-boton pm-boton--secundario ct-boton" aria-label={`Más acciones de la cita de ${cita.nombre}`}>Más ▾</summary>
          <ul className="ct-menu">
            <li><button type="button" onClick={(e) => { e.currentTarget.closest("details")?.removeAttribute("open"); abrir("recordatorio"); }}>Recordatorio para copiar</button></li>
            {cita.chatHref ? <li><Link prefetch={false} className="ct-menu__enlace" href={cita.chatHref}>Abrir chat</Link></li> : null}
            {cita.fichaHref ? <li><Link prefetch={false} className="ct-menu__enlace" href={cita.fichaHref}>Abrir ficha</Link></li> : null}
            {a.cancelar ? <li><button type="button" onClick={(e) => { e.currentTarget.closest("details")?.removeAttribute("open"); abrir("cancelada"); }}>Cancelar cita</button></li> : null}
          </ul>
        </details>
      </div>

      <Dialogo abierto={!!modo} titulo={modo ? `${TITULO[modo]}: ${cita.nombre}` : ""} onCerrar={cerrar}>
        {modo === "recordatorio" ? (
          <div className="ct-form">
            <p className="ct-ayuda">Texto listo para pegar en el chat. No se envía solo: lo mandás vos.</p>
            <label htmlFor={`${id}-r`} className="ct-solo-lector">Texto del recordatorio</label>
            <textarea id={`${id}-r`} readOnly rows={5} value={recordatorio} className="ct-input" onFocus={(e) => e.currentTarget.select()} />
            {error ? <p role="alert" className="ct-error">{error}</p> : null}
            <p role="status" className="ct-ayuda">{copiado ? "Copiado." : ""}</p>
            <div className="ct-acciones">
              <button type="button" className="pm-boton pm-boton--secundario" onClick={cerrar}>Cerrar</button>
              <button type="button" className="pm-boton pm-boton--primario" onClick={copiar}>Copiar texto</button>
            </div>
          </div>
        ) : modo ? (
          <form className="ct-form" onSubmit={(e) => { e.preventDefault(); void enviar(false); }}>
            <p className="ct-ayuda">
              {modo === "cancelada" ? "La cita queda cancelada y archivada: no se borra y se ve en el historial. No se avisa a la persona." : modo === "mover" ? "Elegí el nuevo horario. No se avisa a la persona: si querés, usá el recordatorio." : "Queda anotado en el historial de la persona."}
            </p>
            {modo === "mover" ? (
              <div className="ct-fila-campos">
                <div className="ct-campo"><label htmlFor={`${id}-f`}>Nueva fecha y hora</label><input id={`${id}-f`} type="datetime-local" required value={inicio} onChange={(e) => setInicio(e.target.value)} className="ct-input" /></div>
                <div className="ct-campo"><label htmlFor={`${id}-d`}>Duración</label><select id={`${id}-d`} value={dur} onChange={(e) => setDur(Number(e.target.value))} className="ct-input">{DURACIONES.map((m) => <option key={m} value={m}>{m} min</option>)}</select></div>
              </div>
            ) : null}
            <div className="ct-campo"><label htmlFor={`${id}-n`}>Nota (opcional)</label><input id={`${id}-n`} value={nota} maxLength={300} onChange={(e) => setNota(e.target.value)} className="ct-input" /></div>
            {error ? <p role="alert" className="ct-error">{error}</p> : null}
            <div className="ct-acciones">
              <button type="button" className="pm-boton pm-boton--secundario" onClick={cerrar} disabled={ocupado}>Volver</button>
              {choque ? <button type="button" className="pm-boton pm-boton--secundario" onClick={() => void enviar(true)} disabled={ocupado}>Mover igual</button> : null}
              <button type="submit" className="pm-boton pm-boton--primario" disabled={ocupado}>{ocupado ? "Guardando…" : "Confirmar"}</button>
            </div>
          </form>
        ) : null}
      </Dialogo>
    </>
  );
}
