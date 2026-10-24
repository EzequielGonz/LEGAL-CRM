"use client";

import { useCallback, useEffect, useState } from "react";
import { abrirAsistente } from "@/components/asistente/asistente-panel";

interface Rol {
  id: string;
  nombre: string;
  objetivo: string;
  tono: string;
  instrucciones: string;
}
interface Base {
  id: string;
  name: string;
  created_rows: number | null;
  created_at: string;
  agent_role_id: string | null;
}

const VACIO = { id: null as string | null, nombre: "", objetivo: "", tono: "", instrucciones: "" };

/**
 * Roles del agente por base (21/10). Se guardan roles o comportamientos
 * (cómo abordar a un tipo de cliente) y se cargan a las bases que cargamos.
 * El agente del perfil sigue respondiendo todo lo demás. No envía nada.
 */
export function RolesPorBase({ perfil }: { perfil: string }) {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [bases, setBases] = useState<Base[]>([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState<typeof VACIO | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const leer = useCallback(async () => {
    setCargando(true);
    try {
      const r = await fetch(`/api/agentes/roles?perfil=${perfil}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "No se pudieron leer los roles.");
      setRoles(j.roles ?? []);
      setBases(j.bases ?? []);
    } catch (e) {
      setMsg({ ok: false, text: String((e as Error).message) });
    } finally {
      setCargando(false);
    }
  }, [perfil]);

  useEffect(() => {
    leer();
  }, [leer]);

  async function enviar(cuerpo: Record<string, unknown>, ok: string) {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/agentes/roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ perfil, ...cuerpo }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "No se pudo guardar.");
      setMsg({ ok: true, text: ok });
      await leer();
      return true;
    } catch (e) {
      setMsg({ ok: false, text: String((e as Error).message) });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (await enviar({ accion: "guardar", ...form }, `Rol «${form.nombre}» guardado.`)) setForm(null);
  }

  return (
    <section id="roles-por-base" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="roles-titulo">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="roles-titulo" className="text-lg font-semibold text-slate-900">Roles por base</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-700">
            El bot siempre usa su base general (guion, reglas y cierre). Un rol se suma encima para una base: agrega o ajusta cómo abordar a ese tipo de cliente, sin borrar la base general.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-suave" onClick={() => abrirAsistente("Armemos un rol para el agente: quiero que con la base … ")}>
            Armarlo con «Pedile algo»
          </button>
          <button type="button" className="btn-gold" onClick={() => setForm({ ...VACIO })}>
            Nuevo rol
          </button>
        </div>
      </div>

      {msg ? (
        <p role={msg.ok ? "status" : "alert"} className={`mt-4 rounded-lg p-3 text-sm font-medium ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
          {msg.text}
        </p>
      ) : null}

      {form ? (
        <form onSubmit={guardar} className="mt-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="block text-sm font-medium text-slate-800">
            Nombre
            <input className="tactil mt-1 w-full rounded-lg border border-slate-300 bg-white px-2" value={form.nombre} maxLength={80} required onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej.: Inmobiliarias · cierre con reunión" />
          </label>
          <label className="block text-sm font-medium text-slate-800">
            Objetivo
            <input className="tactil mt-1 w-full rounded-lg border border-slate-300 bg-white px-2" value={form.objetivo} maxLength={500} onChange={(e) => setForm({ ...form, objetivo: e.target.value })} placeholder="Ej.: agendar una llamada de 15 minutos esta semana" />
          </label>
          <label className="block text-sm font-medium text-slate-800">
            Tono
            <input className="tactil mt-1 w-full rounded-lg border border-slate-300 bg-white px-2" value={form.tono} maxLength={300} onChange={(e) => setForm({ ...form, tono: e.target.value })} placeholder="Ej.: cercano, seguro y directo" />
          </label>
          <label className="block text-sm font-medium text-slate-800">
            Instrucciones
            <textarea
              className="mt-1 min-h-[160px] w-full rounded-lg border border-slate-300 bg-white px-2 py-1"
              value={form.instrucciones}
              maxLength={6000}
              required
              onChange={(e) => setForm({ ...form, instrucciones: e.target.value })}
              placeholder="Cómo abrir la charla, qué argumentos usar, cómo responder objeciones y cómo cerrar. Sin datos personales."
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-gold" disabled={busy}>
              {busy ? "Guardando…" : form.id ? "Guardar cambios" : "Guardar rol"}
            </button>
            <button type="button" className="btn-suave" onClick={() => setForm(null)} disabled={busy}>
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Roles guardados</h3>
          {cargando ? (
            <p className="mt-2 text-sm text-slate-600">Cargando…</p>
          ) : roles.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">Todavía no hay roles. Creá uno o pedíselo a «Pedile algo».</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {roles.map((r) => (
                <li key={r.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{r.nombre}</p>
                      {r.objetivo ? <p className="text-sm text-slate-700">{r.objetivo}</p> : null}
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">{r.instrucciones}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" className="btn-suave text-xs" onClick={() => setForm({ id: r.id, nombre: r.nombre, objetivo: r.objetivo, tono: r.tono, instrucciones: r.instrucciones })}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn-suave text-xs"
                        disabled={busy}
                        onClick={() => {
                          if (confirm(`¿Archivar el rol «${r.nombre}»? Las bases que lo usan quedan solo con la base general.`)) enviar({ accion: "archivar", id: r.id }, "Rol archivado.");
                        }}
                      >
                        Archivar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Rol de cada base</h3>
          {cargando ? null : bases.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">No hay bases cargadas en este perfil.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {bases.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{b.name}</p>
                    <p className="text-xs text-slate-600">
                      {b.created_rows ?? 0} contactos · {new Date(b.created_at).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                  <select
                    className="tactil rounded-lg border border-slate-300 bg-white px-2 text-sm"
                    aria-label={`Rol para la base ${b.name}`}
                    value={b.agent_role_id ?? ""}
                    disabled={busy}
                    onChange={(e) => enviar({ accion: "asignar", base_id: b.id, rol_id: e.target.value || null }, e.target.value ? "Rol cargado a la base." : "La base quedó solo con la base general.")}
                  >
                    <option value="">Solo la base general</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        Base general + {r.nombre}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
