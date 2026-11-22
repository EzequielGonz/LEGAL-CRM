"use client";

import { useCallback, useEffect, useId, useState } from "react";
import type { SlugPerfil } from "@/lib/marca";
import { Confirmar, type PedidoConfirmacion } from "./confirmar";
import type { EventoHistorial } from "@/lib/laboratorio/historial";

/**
 * Herramientas del Laboratorio que sí hacen cosas (22/11): simulador del bot (con un rol o comparando dos),
 * publicar un agente de la biblioteca (con código que no se guarda) e historial de cambios.
 * Simular no le escribe a nadie; publicar pide confirmación y el código del panel.
 */

interface Rol { id: string; nombre: string }
interface Turno { rol: "persona" | "bot"; texto: string }
interface Variante { rol: string | null; turnos: Turno[] }
interface AgenteBib { clave: string; nombre: string; version: number; publicacion?: string | null }

async function pedir<T = any>(url: string, cuerpo?: unknown): Promise<T> {
  const r = await fetch(url, { method: cuerpo === undefined ? "GET" : "POST", cache: "no-store", headers: cuerpo === undefined ? undefined : { "Content-Type": "application/json" }, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error ?? "No se pudo completar. Probá de nuevo en un momento.");
  return j as T;
}

export function Simulador({ perfil, nombre, roles, precarga }: { perfil: SlugPerfil; nombre: string; roles: Rol[]; precarga?: { texto: string; n: number } | null }) {
  const id = useId();
  const [mensaje, setMensaje] = useState("");
  const [comparar, setComparar] = useState(false);
  const [rolA, setRolA] = useState("");
  const [rolB, setRolB] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variantes, setVariantes] = useState<Variante[] | null>(null);
  useEffect(() => {
    if (precarga) { setMensaje(precarga.texto); setVariantes(null); setError(null); }
  }, [precarga]);

  async function simular(e: React.FormEvent) {
    e.preventDefault();
    if (!mensaje.trim() || cargando) return;
    setCargando(true);
    setError(null);
    setVariantes(null);
    try {
      const j = await pedir<{ variantes: Variante[] }>("/api/laboratorio/simular", { perfil, mensajes: [mensaje.trim()], roles: comparar ? [rolA || null, rolB || null] : [rolA || null] });
      setVariantes(j.variantes);
    } catch (er) {
      setError((er as Error).message);
    } finally {
      setCargando(false);
    }
  }
  const opciones = (
    <>
      <option value="">Bot general (sin rol)</option>
      {roles.map((r) => (
        <option key={r.id} value={r.id}>{r.nombre}</option>
      ))}
    </>
  );
  return (
    <section aria-labelledby={`${id}-t`} className="lab-tarjeta lab-entra">
      <h2 id={`${id}-t`} className="text-xl font-semibold">Probá el bot de {nombre}</h2>
      <p className="lab-t2 mt-1 max-w-2xl text-sm">Escribí un mensaje como si fueras un cliente y mirá qué respondería. Es una prueba: no se envía nada a nadie ni se toca ninguna conversación real.</p>
      <form onSubmit={simular} className="lab-form mt-3">
        <div>
          <label htmlFor={`${id}-m`} className="lab-etiqueta">Lo que escribe el cliente</label>
          <textarea id={`${id}-m`} className="lab-area" value={mensaje} onChange={(e) => setMensaje(e.target.value)} maxLength={600} placeholder="Ej.: Hola, vi su publicación, ¿cuánto sale?" />
          <p className="lab-ayuda">No pongas teléfonos, documentos ni nombres reales.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-a`} className="lab-etiqueta">{comparar ? "Rol A" : "Con qué rol"}</label>
            <select id={`${id}-a`} className="lab-select" value={rolA} onChange={(e) => setRolA(e.target.value)}>{opciones}</select>
          </div>
          {comparar && (
            <div>
              <label htmlFor={`${id}-b`} className="lab-etiqueta">Rol B</label>
              <select id={`${id}-b`} className="lab-select" value={rolB} onChange={(e) => setRolB(e.target.value)}>{opciones}</select>
            </div>
          )}
        </div>
        <label className="lab-casilla">
          <input type="checkbox" checked={comparar} onChange={(e) => { setComparar(e.target.checked); setVariantes(null); }} />
          <span>Comparar dos roles con el mismo mensaje</span>
        </label>
        <div className="lab-acciones">
          <button type="submit" className="lab-boton" disabled={cargando || !mensaje.trim()}>{cargando ? "Pensando…" : comparar ? "Comparar respuestas" : "Ver qué respondería"}</button>
        </div>
      </form>
      <div aria-live="polite">
        {cargando && <p role="status" className="lab-t2 mt-3 text-sm">El bot está armando la respuesta…</p>}
        {error && <p role="alert" className="lab-msg lab-msg-error mt-3">{error}</p>}
        {variantes && (
          <div className={`mt-4 grid gap-3 ${variantes.length > 1 ? "md:grid-cols-2" : ""}`}>
            {variantes.map((v, i) => (
              <div key={i} className="lab-sub lab-entra">
                <p className="lab-etiqueta">{variantes.length > 1 ? `${i === 0 ? "A" : "B"} · ` : ""}{v.rol ?? "Bot general"}</p>
                <ul className="lab-lista mt-2">
                  {v.turnos.map((t, k) => (
                    <li key={k} className="text-sm">
                      <span className="lab-t2">{t.rol === "bot" ? "El bot: " : "El cliente: "}</span>
                      {t.texto}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function PublicarAgente({ perfil, nombre, pedirConfirmacion }: { perfil: SlugPerfil; nombre: string; pedirConfirmacion: (p: PedidoConfirmacion) => void }) {
  const id = useId();
  const [agentes, setAgentes] = useState<AgenteBib[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [clave, setClave] = useState("");
  const [estado, setEstado] = useState<"publicado" | "pausado">("publicado");
  const [codigo, setCodigo] = useState("");

  const cargar = useCallback(async () => {
    try {
      const j = await pedir<{ agentes: AgenteBib[] }>(`/api/agentes/biblioteca?perfil=${perfil}`);
      setAgentes(j.agentes ?? []);
      setErr(null);
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [perfil]);
  useEffect(() => { cargar(); }, [cargar]);

  const ag = agentes?.find((a) => a.clave === clave);
  return (
    <section aria-labelledby={`${id}-t`} className="lab-tarjeta lab-entra">
      <h2 id={`${id}-t`} className="text-xl font-semibold">Publicar un agente de {nombre}</h2>
      <p className="lab-t2 mt-1 max-w-2xl text-sm">Poné en marcha (o pausá) un agente de la biblioteca. Para publicar tiene que tener la evaluación aprobada. El código de acceso se pide cada vez y no se guarda.</p>
      {err && <p role="alert" className="lab-msg lab-msg-error mt-3">{err}</p>}
      {!agentes && !err ? <p role="status" className="lab-t2 mt-3 text-sm">Cargando agentes…</p> : agentes && (
        <div className="lab-form mt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`${id}-a`} className="lab-etiqueta">Agente</label>
              <select id={`${id}-a`} className="lab-select" value={clave} onChange={(e) => setClave(e.target.value)}>
                <option value="">Elegir…</option>
                {agentes.map((a) => (
                  <option key={a.clave} value={a.clave}>{a.nombre ?? a.clave} (v{a.version}{a.publicacion ? ` · ${a.publicacion}` : ""})</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${id}-e`} className="lab-etiqueta">Qué hacer</label>
              <select id={`${id}-e`} className="lab-select" value={estado} onChange={(e) => setEstado(e.target.value as "publicado" | "pausado")}>
                <option value="publicado">Publicar</option>
                <option value="pausado">Pausar</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor={`${id}-c`} className="lab-etiqueta">Código de acceso</label>
            <input id={`${id}-c`} className="lab-campo" type="password" inputMode="numeric" autoComplete="off" value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 8))} />
          </div>
          <div className="lab-acciones">
            <button
              type="button"
              className="lab-boton"
              disabled={!ag || codigo.length < 4}
              onClick={() =>
                ag &&
                pedirConfirmacion({
                  reforzada: estado === "publicado",
                  titulo: `¿${estado === "publicado" ? "Publico" : "Pauso"} el agente «${ag.nombre ?? ag.clave}»?`,
                  detalle: <p>{estado === "publicado" ? "Pasa a estar publicado: puede cambiar cómo responde el bot." : "Queda pausado: deja de usarse hasta que lo publiques de nuevo."} No envía mensajes por sí solo.</p>,
                  textoSi: estado === "publicado" ? "Sí, publicar" : "Sí, pausar",
                  hacer: async () => {
                    try {
                      await pedir("/api/agentes/publicar", { clave: ag.clave, version: ag.version, publicacion: estado, pin: codigo });
                    } finally {
                      setCodigo("");
                    }
                    await cargar();
                    return `Agente «${ag.nombre ?? ag.clave}» ${estado === "publicado" ? "publicado" : "pausado"}.`;
                  },
                })
              }
            >
              Revisar y {estado === "publicado" ? "publicar" : "pausar"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

const ROTULO: Record<EventoHistorial["tipo"], string> = { rol_creado: "Rol nuevo", rol_cambiado: "Rol cambiado", rol_archivado: "Rol archivado", ficha: "Ficha", agente: "Agente" };

export function HistorialCambios({ perfil, nombre, version }: { perfil: SlugPerfil; nombre: string; version: number }) {
  const id = useId();
  const [eventos, setEventos] = useState<EventoHistorial[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let vivo = true;
    pedir<{ eventos: EventoHistorial[] }>(`/api/laboratorio/historial?perfil=${perfil}`)
      .then((j) => vivo && (setEventos(j.eventos), setErr(null)))
      .catch((e) => vivo && setErr((e as Error).message));
    return () => { vivo = false; };
  }, [perfil, version]);
  return (
    <section aria-labelledby={`${id}-t`} className="lab-tarjeta lab-entra">
      <h2 id={`${id}-t`} className="text-xl font-semibold">Qué cambió en {nombre}</h2>
      <p className="lab-t2 mt-1 text-sm">Roles, ficha y agentes, del cambio más nuevo al más viejo.</p>
      {err && <p role="alert" className="lab-msg lab-msg-error mt-3">{err}</p>}
      {!eventos && !err && <p role="status" className="lab-t2 mt-3 text-sm">Cargando…</p>}
      {eventos && eventos.length === 0 && <p className="lab-sub mt-3 text-sm">Todavía no hay cambios registrados.</p>}
      {eventos && eventos.length > 0 && (
        <ol className="lab-lista mt-3">
          {eventos.slice(0, 12).map((e, i) => (
            <li key={i} className="lab-sub text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <b>{e.titulo}</b>
                <span className="lab-pildora">{ROTULO[e.tipo]}</span>
              </div>
              <p className="lab-t2">{e.detalle}</p>
              <time className="lab-t2 text-xs" dateTime={e.cuando}>{new Date(e.cuando).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
