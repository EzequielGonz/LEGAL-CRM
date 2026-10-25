"use client";

import { useEffect, useState } from "react";

interface Turno {
  rol: "persona" | "bot";
  texto: string;
  herramientas: string[];
  conocimiento?: string[];
}
interface Base {
  id: string;
  name: string;
  area?: string;
  agent_role_id: string | null;
}

const NOMBRE_AREA: Record<string, string> = {
  civil: "Civil",
  penal: "Penal",
  coberturas_medicas: "Coberturas médicas",
  agencia_0km: "Autos 0 km",
  marketing: "Marketing",
};

const NOMBRE_HERRAMIENTA: Record<string, string> = {
  captar: "captaría",
  escalar_a_humano: "pediría una persona",
  detener_contacto: "dejaría de escribir",
  agendar_cita: "agendaría",
  consultar_disponibilidad: "miró la agenda",
  guardar_datos_calificacion: "guardó datos",
};

/**
 * Probar el bot real (24/10): misma configuración que responde hoy (base
 * general + rol de la base elegida) y el mismo modelo, con mensajes
 * ficticios. No escribe a nadie ni cambia nada.
 */
export function ProbarBotReal({ perfil, areas }: { perfil: string; areas: string[] }) {
  const [area, setArea] = useState(areas[0]);
  const [bases, setBases] = useState<Base[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [baseId, setBaseId] = useState("");
  const [apertura, setApertura] = useState("");
  const [texto, setTexto] = useState("Hola, ¿quién sos? ¿De dónde sacaste mi número?");
  const [turnos, setTurnos] = useState<Turno[] | null>(null);
  const [rolUsado, setRolUsado] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // 25/10: versión del conocimiento para comparar («» = la vigente del perfil).
  const [version, setVersion] = useState<"" | "1" | "2">("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/agentes/roles?perfil=${perfil}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j) return;
        setBases(j.bases ?? []);
        setRoles(Object.fromEntries(((j.roles ?? []) as { id: string; nombre: string }[]).map((r) => [r.id, r.nombre])));
      })
      .catch(() => {});
  }, [perfil]);

  async function probar() {
    setBusy(true);
    setError(null);
    setTurnos(null);
    try {
      const mensajes = texto.split(/\n\s*\n/).map((m) => m.trim()).filter(Boolean);
      const r = await fetch("/api/agentes/probar-real", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perfil, area, base_id: baseId || null, mensajes, apertura: apertura.trim() || null, version: version ? Number(version) : null }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "No se pudo probar el bot.");
      setTurnos(j.turnos ?? []);
      setRolUsado(`${j.rol ? "Base general + rol de la base" : "Base general"} · conocimiento v${j.version ?? 1}`);
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setBusy(false);
    }
  }

  const deArea = bases.filter((b) => !b.area || b.area === area);

  return (
    <section id="probar-bot" tabIndex={-1} aria-labelledby="probar-real-titulo" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 id="probar-real-titulo" className="text-lg font-semibold text-slate-900">
        Probar el bot real
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-slate-700">
        Responde la misma configuración que atiende hoy (base general y, si elegís una base, su rol) con el mismo modelo. Los mensajes son de mentira: no se escribe a nadie, no se agenda y no cambia ningún estado.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {areas.length > 1 ? (
          <label className="text-sm">
            <span className="block font-medium text-slate-800">Área</span>
            <select className="tactil mt-1 w-full rounded-lg border border-slate-300 bg-white px-2" value={area} onChange={(e) => setArea(e.target.value)}>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {NOMBRE_AREA[a] ?? a}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="text-sm">
          <span className="block font-medium text-slate-800">Como si fuera un contacto de</span>
          <select className="tactil mt-1 w-full rounded-lg border border-slate-300 bg-white px-2" value={baseId} onChange={(e) => setBaseId(e.target.value)}>
            <option value="">Ninguna base (solo la base general)</option>
            {deArea.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
                {b.agent_role_id && roles[b.agent_role_id] ? ` · Base general + ${roles[b.agent_role_id]}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-medium text-slate-800">Versión del conocimiento</span>
          <select className="tactil mt-1 w-full rounded-lg border border-slate-300 bg-white px-2" value={version} onChange={(e) => setVersion(e.target.value as "" | "1" | "2")}>
            <option value="">La que rige hoy en el perfil</option>
            <option value="1">v1 · Bot del 24/10</option>
            <option value="2">v2 · Biblioteca de ventas</option>
          </select>
        </label>
      </div>
      <label className="mt-3 block text-sm">
        <span className="block font-medium text-slate-800">Mensaje que le mandamos primero (opcional)</span>
        <textarea className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm" rows={2} value={apertura} onChange={(e) => setApertura(e.target.value)} placeholder="Pegá el texto de la plantilla para probar cómo responde a una campaña." />
      </label>
      <label className="mt-3 block text-sm">
        <span className="block font-medium text-slate-800">Lo que escribe la persona</span>
        <textarea className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm" rows={4} value={texto} onChange={(e) => setTexto(e.target.value)} />
        <span className="text-xs text-slate-500">Separá cada mensaje con una línea en blanco (hasta 8).</span>
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" className="btn-gold" onClick={probar} disabled={busy || !texto.trim()}>
          {busy ? "El bot está respondiendo…" : "Probar"}
        </button>
        {rolUsado ? <span className="text-xs text-slate-600">Respondió con: {rolUsado}</span> : null}
      </div>
      {error ? (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
          {error}
        </p>
      ) : null}
      {turnos ? (
        <ol className="mt-4 space-y-2" aria-label="Conversación de prueba">
          {turnos.map((t, i) => (
            <li key={i} className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${t.rol === "persona" ? "ml-auto bg-slate-100 text-slate-900" : "bg-gold-500/10 text-slate-900"}`}>
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t.rol === "persona" ? "Persona" : "Bot"}</p>
              <p className="whitespace-pre-wrap">{t.texto}</p>
              {t.herramientas.length ? <p className="mt-1 text-[11px] text-slate-500">En la charla real {t.herramientas.map((h) => NOMBRE_HERRAMIENTA[h] ?? h).join(", ")}.</p> : null}
              {t.conocimiento?.length ? <p className="mt-1 text-[11px] text-slate-500">Conocimiento que tuvo en cuenta: {t.conocimiento.join(" · ")}.</p> : null}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
