"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { conVolver } from "@/lib/navegacion";
import { cuandoCorto, enlaceConversacion, iniciales } from "@/lib/cartera";
import type { SlugPerfil } from "@/lib/marca";
import { ACCIONES, cuerpoDeAccion, faltaTexto, planDeLote, puedeHacer, TOPE_LOTE, type AccionContacto } from "@/lib/contactos/consulta";
import type { FilaContacto } from "@/lib/contactos/servidor";
import { Dialogo } from "./dialogo";
import { FormularioCita } from "@/components/agenda/formulario-cita";

const ORDEN_ACCIONES: AccionContacto[] = ["captar", "derivar", "no_derivar", "perder", "no_contactar"];
const ESTADO_PASTILLA = { ok: "ok", atencion: "atencion", bloqueo: "error", info: "neutro" } as const;

type Pendiente = { accion: AccionContacto; filas: FilaContacto[] };

/**
 * Lista de trabajo de Contactos: abrir ficha y chat, mover de etapa, derivar, agendar cita, marcar perdido o no
 * contactar, y acciones en lote con selección y CSV. Todo lo que cambia datos pide confirmación y usa la ruta que
 * ya existe (`/api/oportunidades/[id]`), que deja el historial. Nada se borra.
 */
export function TablaContactos({ filas, slug, aqui, filtrosCsv }: { filas: FilaContacto[]; slug: SlugPerfil; aqui: string; filtrosCsv: string }) {
  const router = useRouter();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [pend, setPend] = useState<Pendiente | null>(null);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<{ hechas: number; total: number } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [cita, setCita] = useState<FilaContacto | null>(null);
  const menuLote = useRef<HTMLSelectElement>(null);

  const seleccionadas = useMemo(() => filas.filter((f) => sel.has(f.id)), [filas, sel]);
  const todas = filas.length > 0 && filas.every((f) => sel.has(f.id));
  const alternar = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const estadoDe = (f: FilaContacto) => ({ capture_state: f.captureState, derivation_state: f.derivationState, detenido: f.detenido });
  const abrir = (accion: AccionContacto, fs: FilaContacto[]) => {
    setTexto("");
    setError(null);
    setPend({ accion, filas: fs });
  };
  const cerrar = () => {
    if (ocupado) return;
    setPend(null);
    setError(null);
  };

  const plan = pend ? planDeLote(pend.accion, pend.filas.map((f) => ({ id: f.id, nombre: f.nombre, estado: estadoDe(f) }))) : null;

  async function confirmar() {
    if (!pend || !plan) return;
    const falta = faltaTexto(pend.accion, texto);
    if (falta) return setError(falta);
    if (plan.aplicables.length === 0) return setError("Nadie de la selección admite esta acción.");
    setError(null);
    setOcupado({ hechas: 0, total: plan.aplicables.length });
    let ok = 0;
    const fallas: string[] = [];
    for (const id of plan.aplicables) {
      try {
        const r = await fetch(`/api/oportunidades/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpoDeAccion(pend.accion, texto)) });
        if (r.ok) ok++;
        else fallas.push(((await r.json().catch(() => ({}))) as any).error ?? "error");
      } catch {
        fallas.push("sin conexión");
      }
      setOcupado((o) => (o ? { ...o, hechas: o.hechas + 1 } : o));
    }
    setOcupado(null);
    setPend(null);
    setSel(new Set());
    const d = ACCIONES[pend.accion];
    setAviso(
      `${d.rotulo}: ${ok} ${ok === 1 ? "persona actualizada" : "personas actualizadas"}` +
        (plan.omitidas.length ? `, ${plan.omitidas.length} salteada${plan.omitidas.length === 1 ? "" : "s"}` : "") +
        (fallas.length ? `, ${fallas.length} con error (${Array.from(new Set(fallas)).slice(0, 2).join("; ")})` : "") +
        "."
    );
    router.refresh();
  }

  const csvSeleccion = `/api/contactos/exportar?perfil=${slug}&ids=${seleccionadas.map((f) => f.id).join(",")}`;
  const def = pend ? ACCIONES[pend.accion] : null;

  return (
    <div>
      <p role="status" aria-live="polite" className={aviso ? "ct-aviso" : "ct-solo-lector"}>
        {aviso}
      </p>

      <div className="ct-lista" role="table" aria-label="Contactos">
        <div className="ct-cabeza" role="row">
          <label className="ct-check" role="columnheader">
            <input type="checkbox" checked={todas} onChange={() => setSel(todas ? new Set() : new Set(filas.map((f) => f.id)))} aria-label="Seleccionar todas las de esta página" />
          </label>
          <span role="columnheader">Persona</span>
          <span role="columnheader" className="ct-oculta-m">Etapa</span>
          <span role="columnheader" className="ct-oculta-m">Última actividad</span>
          <span role="columnheader" className="ct-oculta-m">Cita</span>
          <span role="columnheader" className="ct-der">Acciones</span>
        </div>
        {filas.map((f, i) => {
          const ficha = f.contactId ? conVolver(`/ficha/${f.contactId}`, aqui) : null;
          const chat = f.conversationId ? conVolver(enlaceConversacion(slug, f.conversationId), aqui) : null;
          const marcada = sel.has(f.id);
          return (
            <div key={f.id} role="row" className={`ct-fila${marcada ? " ct-fila--marcada" : ""}`} style={{ ["--ct-orden" as string]: Math.min(i, 12) }}>
              <label className="ct-check" role="cell">
                <input type="checkbox" checked={marcada} onChange={() => alternar(f.id)} aria-label={`Seleccionar a ${f.nombre}`} />
              </label>
              <div role="cell" className="ct-persona">
                <span aria-hidden="true" className="ct-avatar">{iniciales(f.nombre)}</span>
                <div className="ct-persona__datos">
                  <p className="ct-nombre">{f.nombre}</p>
                  <p className="ct-tel">
                    {f.telefono ?? "Sin teléfono"}
                    {f.area && slug === "juridico" ? ` · ${f.area === "penal" ? "Penal" : "Civil"}` : ""}
                    {f.origen ? ` · ${f.origen}` : ""}
                  </p>
                  <p className="ct-solo-m">
                    <span className={`pm-pastilla pm-pastilla--${ESTADO_PASTILLA[f.tono]}`}><span className="pm-pastilla__punto" aria-hidden="true" />{f.estadoTexto}</span>
                  </p>
                </div>
              </div>
              <div role="cell" className="ct-oculta-m">
                <span className={`pm-pastilla pm-pastilla--${ESTADO_PASTILLA[f.tono]}`}>
                  <span className="pm-pastilla__punto" aria-hidden="true" />
                  {f.estadoTexto}
                </span>
                <p className="ct-tenue ct-etapa">Etapa: {f.etapaRotulo}</p>
              </div>
              <div role="cell" className="ct-oculta-m ct-tenue">{f.actividad ? cuandoCorto(f.actividad) : "—"}</div>
              <div role="cell" className="ct-oculta-m ct-tenue">{f.cita ? cuandoCorto(f.cita) : "—"}</div>
              <div role="cell" className="ct-acciones-fila">
                {ficha ? <Link prefetch={false} href={ficha} className="pm-boton pm-boton--primario ct-boton">Ficha</Link> : null}
                {chat ? <Link prefetch={false} href={chat} className="pm-boton pm-boton--secundario ct-boton">Chat</Link> : null}
                <details className="ct-mas">
                  <summary className="pm-boton pm-boton--secundario ct-boton" aria-label={`Más acciones para ${f.nombre}`}>Más ▾</summary>
                  <ul className="ct-menu">
                    {f.contactId ? (
                      <li>
                        <button type="button" onClick={(e) => { e.currentTarget.closest("details")?.removeAttribute("open"); setCita(f); }}>Agendar cita</button>
                      </li>
                    ) : null}
                    {ORDEN_ACCIONES.map((a) => {
                      const r = puedeHacer(a, estadoDe(f));
                      return (
                        <li key={a}>
                          <button type="button" disabled={!r.ok} title={r.ok ? undefined : `No: ${r.porque}`} onClick={(e) => { e.currentTarget.closest("details")?.removeAttribute("open"); abrir(a, [f]); }}>
                            {a === "derivar" ? "Derivar" : a === "perder" ? "Marcar perdido" : a === "no_contactar" ? "No contactar" : a === "captar" ? "Mover a Captado" : ACCIONES[a].rotulo}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              </div>
            </div>
          );
        })}
      </div>

      {seleccionadas.length > 0 ? (
        <div className="ct-lote" role="region" aria-label="Acciones en lote">
          <p className="ct-lote__n"><strong>{seleccionadas.length}</strong> seleccionada{seleccionadas.length === 1 ? "" : "s"}{seleccionadas.length >= TOPE_LOTE ? ` (tope ${TOPE_LOTE})` : ""}</p>
          <label className="ct-solo-lector" htmlFor="ct-lote-accion">Mover de etapa</label>
          <select id="ct-lote-accion" ref={menuLote} className="ct-input ct-lote__sel" defaultValue="" onChange={(e) => { const a = e.target.value as AccionContacto; if (a) abrir(a, seleccionadas); e.target.value = ""; }}>
            <option value="">Mover de etapa…</option>
            {ORDEN_ACCIONES.map((a) => (<option key={a} value={a}>{ACCIONES[a].rotulo}</option>))}
          </select>
          <a className="pm-boton pm-boton--secundario ct-boton" href={csvSeleccion} download>Exportar CSV</a>
          <button type="button" className="ct-link" onClick={() => setSel(new Set())}>Limpiar selección</button>
        </div>
      ) : null}

      <p className="ct-exportar">
        <a className="ct-link" href={`/api/contactos/exportar?${filtrosCsv}`} download>Exportar a CSV todo lo que muestran los filtros</a>
      </p>

      <Dialogo abierto={!!pend} titulo={def ? (pend!.filas.length > 1 ? `${def.rotulo}: ${plan?.aplicables.length ?? 0} personas` : `${def.rotulo}: ${pend!.filas[0].nombre}`) : ""} onCerrar={cerrar}>
        {pend && def && plan ? (
          <form onSubmit={(e) => { e.preventDefault(); void confirmar(); }} className="ct-form">
            <p className="ct-ayuda">
              {pend.filas.length > 1
                ? `Vas a aplicar «${def.rotulo}» a ${plan.aplicables.length} de ${pend.filas.length} personas.`
                : `Vas a cambiar a ${pend.filas[0].nombre} a «${def.rotulo}».`}{" "}
              {def.ayuda} Podés revertirlo desde la ficha.
            </p>
            {plan.omitidas.length > 0 ? (
              <details className="ct-omitidas">
                <summary>{plan.omitidas.length} se saltean</summary>
                <ul>{plan.omitidas.slice(0, 8).map((o) => (<li key={o.id}>{o.nombre}: {o.porque}</li>))}</ul>
              </details>
            ) : null}
            {def.pide ? (
              <div className="ct-campo">
                <label htmlFor="ct-texto">{def.pregunta}</label>
                <textarea id="ct-texto" rows={2} maxLength={300} value={texto} onChange={(e) => setTexto(e.target.value)} className="ct-input" aria-required={def.obligatorio} autoFocus />
              </div>
            ) : null}
            {error ? <p role="alert" className="ct-error">{error}</p> : null}
            {ocupado ? <p role="status" className="ct-ayuda">Aplicando… {ocupado.hechas} de {ocupado.total}</p> : null}
            <div className="ct-acciones">
              <button type="button" className="pm-boton pm-boton--secundario" onClick={cerrar} disabled={!!ocupado}>Cancelar</button>
              <button type="submit" className="pm-boton pm-boton--primario" disabled={!!ocupado || plan.aplicables.length === 0}>{ocupado ? "Aplicando…" : "Confirmar"}</button>
            </div>
          </form>
        ) : null}
      </Dialogo>

      <Dialogo abierto={!!cita} titulo={cita ? `Agendar cita: ${cita.nombre}` : ""} onCerrar={() => setCita(null)}>
        {cita && cita.contactId ? (
          <FormularioCita slug={slug} persona={{ id: cita.contactId, nombre: cita.nombre, telefono: cita.telefono }} onCancelar={() => setCita(null)} onListo={(m) => { setCita(null); setAviso(m); }} />
        ) : null}
      </Dialogo>
    </div>
  );
}
