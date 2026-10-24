"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Rol {
  id: string;
  nombre: string;
  objetivo: string;
  tono: string;
  instrucciones: string;
}

const VACIO = { id: null as string | null, nombre: "", objetivo: "", tono: "", instrucciones: "" };

/**
 * Rol del agente para esta campaña (24/10). Se elige, se edita o se crea acá
 * mismo; vale solo para esta campaña y manda sobre el rol de la base. Se
 * puede cambiar aunque la campaña esté en curso (rige desde la próxima
 * respuesta). No envía nada.
 */
export function RolDeCampana({ campaignId, perfil, rolActualId }: { campaignId: string; perfil: string; rolActualId: string | null }) {
  const router = useRouter();
  const [roles, setRoles] = useState<Rol[]>([]);
  const [elegido, setElegido] = useState(rolActualId ?? "");
  const [form, setForm] = useState<typeof VACIO | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const leer = useCallback(async () => {
    try {
      const r = await fetch(`/api/agentes/roles?perfil=${perfil}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "No se pudieron leer los roles.");
      setRoles(j.roles ?? []);
    } catch (e) {
      setMsg({ ok: false, text: String((e as Error).message) });
    }
  }, [perfil]);

  useEffect(() => {
    leer();
  }, [leer]);

  async function post(cuerpo: Record<string, unknown>) {
    const r = await fetch("/api/agentes/roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ perfil, ...cuerpo }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error ?? "No se pudo guardar.");
    return j;
  }

  async function asignar(rolId: string) {
    setBusy(true);
    setMsg(null);
    try {
      await post({ accion: "asignar_campana", campaign_id: campaignId, rol_id: rolId || null });
      setElegido(rolId);
      setMsg({ ok: true, text: rolId ? "Rol asignado a esta campaña." : "La campaña quedó sin rol propio." });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: String((e as Error).message) });
    } finally {
      setBusy(false);
    }
  }

  async function guardarRol() {
    if (!form) return;
    setBusy(true);
    setMsg(null);
    try {
      const j = await post({ accion: "guardar", ...form });
      const id = j.rol?.id as string | undefined;
      await leer();
      if (id && !form.id) await post({ accion: "asignar_campana", campaign_id: campaignId, rol_id: id });
      if (id) setElegido(id);
      setForm(null);
      setMsg({ ok: true, text: form.id ? "Rol guardado." : "Rol creado y asignado a esta campaña." });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: String((e as Error).message) });
    } finally {
      setBusy(false);
    }
  }

  const actual = roles.find((r) => r.id === elegido) ?? null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
      <p className="font-medium text-slate-800">Rol del bot en esta campaña</p>
      <p className="mt-0.5 text-xs text-slate-500">
        Se suma al bot del perfil solo para los contactos de esta campaña (manda sobre el rol de la base). Se puede cambiar aunque esté en curso: rige desde la próxima respuesta.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-xs font-medium text-slate-600">
          Rol
          <select
            value={elegido}
            disabled={busy}
            onChange={(e) => asignar(e.target.value)}
            className="mt-1 block w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          >
            <option value="">Sin rol propio (usa el de la base o el bot del perfil)</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </label>
        {actual && (
          <button type="button" disabled={busy} onClick={() => setForm({ ...actual })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Editar este rol
          </button>
        )}
        <button type="button" disabled={busy} onClick={() => setForm({ ...VACIO })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Crear un rol nuevo
        </button>
        {msg && <span className={`text-xs ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.text}</span>}
      </div>

      {form && (
        <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          {form.id && <p className="text-xs text-amber-700">Si este rol también lo usan otras campañas o bases, el cambio les llega a todas.</p>}
          <label className="block text-xs font-medium text-slate-600">
            Nombre
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} maxLength={80} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Objetivo
            <input value={form.objetivo} onChange={(e) => setForm({ ...form, objetivo: e.target.value })} maxLength={500} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Tono
            <input value={form.tono} onChange={(e) => setForm({ ...form, tono: e.target.value })} maxLength={300} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Instrucciones
            <textarea value={form.instrucciones} onChange={(e) => setForm({ ...form, instrucciones: e.target.value })} maxLength={6000} rows={8} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={guardarRol} className="btn-gold">
              {busy ? "Guardando…" : form.id ? "Guardar cambios" : "Crear y asignar"}
            </button>
            <button type="button" disabled={busy} onClick={() => setForm(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
