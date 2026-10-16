"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Etapa 3 · «Agentes IA» unificado por perfil: qué responde hoy, qué
 * derivado existe en la biblioteca, con qué modelo, y las cinco acciones en
 * lenguaje simple: Probar conversación, Pedir mejora, Ver resultados,
 * Configurar y Crear agente. Nada de acá envía mensajes a personas: el
 * simulador usa datos sintéticos y herramientas simuladas; activar una
 * asignación exige versión publicada, PIN y además la pausa general
 * levantada para que salga algo.
 */

type Agente = { clave: string; nombre: string; rol: string; rubro_id: string | null; version: number; publicacion: string; estado: string; objetivo: string; ultima_evaluacion: any };
type Asignacion = { area: string; agente_clave: string; version: number; estado: string; modelo_proveedor: string; modelo_identificador: string | null };

async function pedir(url: string, method = "GET", body?: unknown) {
  const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function Estado({ msg }: { msg: { ok: boolean; text: string } | null }) {
  return (
    <p role="status" aria-live="polite" className={msg ? (msg.ok ? "text-sm text-emerald-700" : "text-sm font-medium text-red-700") : "sr-only"}>
      {msg?.text ?? ""}
    </p>
  );
}

const PUBLICACION: Record<string, string> = { preparado: "Preparado", ajustado: "Ajustado", publicado: "Publicado", pausado: "Pausado" };

export function AgentesEtapa3({ perfil, rubroId, areas, volver }: { perfil: string; rubroId: string; areas: string[]; volver: string }) {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [modelo, setModelo] = useState<any>(null);
  const [seccion, setSeccion] = useState<"ninguna" | "probar" | "pedir" | "resultados" | "crear" | "asignar">("ninguna");
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const [b, m] = await Promise.all([pedir("/api/agentes/biblioteca"), pedir("/api/agentes/modelo")]);
    if (!b.ok) return setError("No se pudo leer la biblioteca de agentes.");
    setAgentes(b.data.agentes ?? []);
    if (m.ok) {
      setModelo(m.data);
      setAsignaciones(m.data.asignaciones ?? []);
    }
  }, []);
  useEffect(() => {
    void cargar();
  }, [cargar]);

  const principal = agentes.find((a) => a.rol === "principal") ?? null;
  const derivados = agentes.filter((a) => a.rol === "derivado" && a.rubro_id === rubroId);
  const asignadas = asignaciones.filter((a) => areas.includes(a.area));

  return (
    <section aria-labelledby="etapa3-agentes" className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="etapa3-agentes" className="text-lg font-semibold text-slate-900">
            Agente del perfil
          </h2>
          <p className="text-sm text-slate-600">
            Modelo activo: <strong>{modelo?.identificador ?? "…"}</strong> ({modelo?.proveedor ?? "…"}){modelo && !modelo.claveConfigurada ? " · sin clave configurada: las pruebas usan el generador simulado" : ""}. Las asignaciones de abajo dicen qué versión responde en cada área; sin asignación activa responde la configuración de arriba, como hasta ahora.
          </p>
        </div>
        <a href={`/biblioteca-agentes?volver=${encodeURIComponent(volver)}`} className="tactil inline-flex items-center rounded-lg border border-slate-300 px-3 text-sm text-slate-800 hover:bg-slate-50">
          Configurar
        </a>
      </div>
      {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-800">{error}</p>}

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {principal && (
          <li className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="font-medium text-slate-900">{principal.nombre} <span className="text-xs font-normal text-slate-500">· base común · v{principal.version}</span></p>
            <p className="text-slate-600">{principal.objetivo || "Sin objetivo cargado."}</p>
          </li>
        )}
        {derivados.map((a) => {
          const asg = asignadas.filter((x) => x.agente_clave === a.clave);
          const ev = a.ultima_evaluacion;
          return (
            <li key={a.clave} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-medium text-slate-900">
                {a.nombre} <span className="text-xs font-normal text-slate-500">· v{a.version} · {PUBLICACION[a.publicacion] ?? a.publicacion}</span>
              </p>
              <p className="text-slate-600">{a.objetivo || "Sin objetivo cargado."}</p>
              <p className="mt-1 text-xs text-slate-600">
                {ev ? `Última evaluación: comercial mínimo ${ev.comercial_min}/16, ${ev.fallos_criticos} fallo(s) crítico(s), ${ev.casos} casos (${ev.proveedor}).` : "Sin evaluación todavía."}{" "}
                {asg.length ? asg.map((x) => `${x.area}: ${x.estado} (v${x.version})`).join(" · ") : "Sin asignación: no responde."}
              </p>
            </li>
          );
        })}
        {derivados.length === 0 && <li className="text-sm text-slate-500">Este perfil todavía no tiene un derivado en la biblioteca. Usá «Crear agente».</li>}
      </ul>

      <div className="flex flex-wrap gap-2">
        {([
          ["probar", "Probar conversación"],
          ["pedir", "Pedir mejora"],
          ["resultados", "Ver resultados"],
          ["crear", "Crear agente"],
          ["asignar", "Asignar versión"],
        ] as const).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setSeccion(seccion === k ? "ninguna" : k)} aria-expanded={seccion === k} className={`tactil rounded-lg px-3 text-sm font-medium ${seccion === k ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-800 hover:bg-slate-50"}`}>
            {label}
          </button>
        ))}
      </div>

      {seccion === "probar" && <Probar derivados={derivados} principalClave={principal?.clave ?? "principal"} areas={areas} />}
      {seccion === "pedir" && <PedirMejora derivados={derivados} principalClave={principal?.clave ?? "principal"} />}
      {seccion === "resultados" && <Resultados derivados={derivados} alTerminar={cargar} />}
      {seccion === "crear" && <Crear rubroId={rubroId} alTerminar={cargar} />}
      {seccion === "asignar" && <Asignar rubroId={rubroId} derivados={derivados} areas={areas} asignaciones={asignadas} alTerminar={cargar} />}
      <p className="text-xs text-slate-500">Perfil: {perfil}. Probar y evaluar no escriben mensajes ni citas reales; usan datos ficticios.</p>
    </section>
  );
}

function SelectorAgente({ derivados, principalClave, valor, onChange }: { derivados: Agente[]; principalClave: string; valor: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="text-xs font-medium text-slate-700">Agente</span>
      <select value={valor} onChange={(e) => onChange(e.target.value)} className="tactil mt-1 w-full rounded-lg border border-slate-300 px-2 sm:w-auto">
        <option value={principalClave}>Principal (base común)</option>
        {derivados.map((d) => (
          <option key={d.clave} value={d.clave}>
            {d.nombre} (v{d.version})
          </option>
        ))}
      </select>
    </label>
  );
}

function Probar({ derivados, principalClave, areas }: { derivados: Agente[]; principalClave: string; areas: string[] }) {
  const [casos, setCasos] = useState<any[]>([]);
  const [clave, setClave] = useState(derivados[0]?.clave ?? principalClave);
  const [casoId, setCasoId] = useState("");
  const [mensajes, setMensajes] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [resultado, setResultado] = useState<any>(null);
  useEffect(() => {
    void pedir("/api/agentes/simulador").then((r) => r.ok && setCasos(r.data.casos ?? []));
  }, []);
  return (
    <form
      className="space-y-2 rounded-lg border border-slate-200 p-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        setResultado(null);
        const lista = mensajes.split("\n").map((m) => m.trim()).filter(Boolean);
        const r = await pedir("/api/agentes/simulador", "POST", casoId ? { clave, casoId } : { clave, mensajes: lista, area: areas[0] });
        setBusy(false);
        if (!r.ok) return setMsg({ ok: false, text: r.data?.error ?? `No se pudo simular (error ${r.status}).` });
        setResultado(r.data);
        setMsg({ ok: true, text: "Simulación guardada. Es una prueba con datos ficticios: no se envió nada." });
      }}
    >
      <SelectorAgente derivados={derivados} principalClave={principalClave} valor={clave} onChange={setClave} />
      <label className="block text-sm">
        <span className="text-xs font-medium text-slate-700">Caso de control (o dejá vacío y escribí mensajes)</span>
        <select value={casoId} onChange={(e) => setCasoId(e.target.value)} className="tactil mt-1 w-full rounded-lg border border-slate-300 px-2">
          <option value="">— Conversación libre —</option>
          {casos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.id} · {c.titulo} ({c.rubro})
            </option>
          ))}
        </select>
      </label>
      {!casoId && (
        <label className="block text-sm">
          <span className="text-xs font-medium text-slate-700">Mensajes de la persona (uno por línea, ficticios)</span>
          <textarea value={mensajes} onChange={(e) => setMensajes(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1" />
        </label>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="tactil rounded-lg bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-60">
          {busy ? "Simulando…" : "Probar"}
        </button>
        <Estado msg={msg} />
      </div>
      {resultado && (
        <div className="space-y-1 rounded-lg bg-slate-50 p-3 text-sm">
          <ol className="space-y-1">
            {resultado.resultado.turnos.map((t: any) => (
              <li key={t.orden} className={t.rol === "prospecto" ? "text-slate-900" : t.rol === "asesor" ? "text-blue-900" : "text-amber-800"}>
                <strong>{t.rol === "prospecto" ? "Persona" : t.rol === "asesor" ? "Asesor" : "Sistema"}:</strong> {t.texto ?? (t.validacion?.retenido ? `[retenido: ${t.validacion.motivos.join(", ")}]` : "")}
                {t.acciones?.length ? <span className="text-xs text-slate-500"> · acciones: {t.acciones.map((a: any) => a.herramienta).join(", ")}</span> : null}
              </li>
            ))}
          </ol>
          {resultado.evaluacion && (
            <p className="text-xs text-slate-700">
              Comercial {resultado.evaluacion.comercial}/16 · Naturalidad {resultado.evaluacion.naturalidad}/14 · Fallos críticos: {resultado.evaluacion.fallos_criticos.length ? resultado.evaluacion.fallos_criticos.join(", ") : "ninguno"}
              {resultado.evaluacion.detalle?.length ? ` · ${resultado.evaluacion.detalle.join("; ")}` : ""}
            </p>
          )}
        </div>
      )}
    </form>
  );
}

function PedirMejora({ derivados, principalClave }: { derivados: Agente[]; principalClave: string }) {
  const [clave, setClave] = useState(derivados[0]?.clave ?? principalClave);
  const [pedido, setPedido] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      className="space-y-2 rounded-lg border border-slate-200 p-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        const r = await pedir("/api/agentes/pedidos", "POST", { clave, pedido });
        setBusy(false);
        if (!r.ok) return setMsg({ ok: false, text: r.data?.error ?? "No se pudo guardar." });
        setPedido("");
        setMsg({ ok: true, text: "Pedido guardado. Se convierte en una versión nueva en el próximo bloque; el agente no cambia solo." });
      }}
    >
      <SelectorAgente derivados={derivados} principalClave={principalClave} valor={clave} onChange={setClave} />
      <label className="block text-sm">
        <span className="text-xs font-medium text-slate-700">Qué querés mejorar (en tus palabras)</span>
        <textarea value={pedido} onChange={(e) => setPedido(e.target.value)} rows={3} maxLength={2000} required className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="tactil rounded-lg bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-60">
          {busy ? "Guardando…" : "Pedir mejora"}
        </button>
        <Estado msg={msg} />
      </div>
    </form>
  );
}

function Resultados({ derivados, alTerminar }: { derivados: Agente[]; alTerminar: () => Promise<void> }) {
  const [clave, setClave] = useState(derivados[0]?.clave ?? "principal");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [res, setRes] = useState<any>(null);
  const [umbrales, setUmbrales] = useState<any>(null);
  useEffect(() => {
    void pedir("/api/agentes/evaluacion").then((r) => r.ok && setUmbrales(r.data.umbrales));
  }, []);
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 p-3 text-sm">
      <p className="text-slate-700">
        Corre los 16 casos de control con herramientas simuladas y resume por rol. Umbrales fijados antes de medir: comercial ≥ {umbrales?.comercialMinimo ?? 14}/16 en todos los roles, preferencia ≥ {umbrales?.preferenciaMinima ?? 60} % y cero fallos críticos. Un fallo crítico nunca se compensa con el promedio.
      </p>
      <SelectorAgente derivados={derivados} principalClave="principal" valor={clave} onChange={setClave} />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setMsg(null);
            const r = await pedir("/api/agentes/evaluacion", "POST", { clave });
            setBusy(false);
            if (!r.ok) return setMsg({ ok: false, text: r.data?.error ?? "No se pudo evaluar." });
            setRes(r.data);
            setMsg({ ok: true, text: `Evaluación guardada: ${r.data.fallosCriticos} fallo(s) crítico(s), comercial mínimo ${r.data.comercialMin}/16.` });
            await alTerminar();
          }}
          className="tactil rounded-lg bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? "Evaluando…" : "Correr evaluación"}
        </button>
        <Estado msg={msg} />
      </div>
      {res && (
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-500">
              <th className="py-1">Rol</th>
              <th>Comercial /16</th>
              <th>Naturalidad /14</th>
              <th>Casos</th>
              <th>Fallos críticos</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(res.porRol).map(([rol, v]: any) => (
              <tr key={rol} className="border-t border-slate-100">
                <td className="py-1">{rol}</td>
                <td>{v.comercial}</td>
                <td>{v.naturalidad}</td>
                <td>{v.casos}</td>
                <td className={v.fallos ? "font-medium text-red-700" : ""}>{v.fallos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Crear({ rubroId, alTerminar }: { rubroId: string; alTerminar: () => Promise<void> }) {
  const [clave, setClave] = useState("");
  const [nombre, setNombre] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      className="space-y-2 rounded-lg border border-slate-200 p-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        const r = await pedir("/api/agentes/crear", "POST", { clave, nombre, objetivo, rubroId, pin });
        setBusy(false);
        setPin("");
        if (!r.ok) return setMsg({ ok: false, text: r.data?.error ?? "No se pudo crear." });
        setMsg({ ok: true, text: `Creado «${nombre}» desde el principal (solo configuración). Nace apagado y sin asignación.` });
        await alTerminar();
      }}
    >
      <p className="text-sm text-slate-700">Se copian modos, límites, conocimiento e instrucciones del principal. Nunca clientes, conversaciones ni credenciales.</p>
      <label className="block text-sm">
        <span className="text-xs font-medium text-slate-700">Clave (minúsculas, números y guion bajo)</span>
        <input value={clave} onChange={(e) => setClave(e.target.value)} pattern="[a-z0-9_]{2,40}" required className="tactil mt-1 w-full rounded-lg border border-slate-300 px-2 sm:w-64" />
      </label>
      <label className="block text-sm">
        <span className="text-xs font-medium text-slate-700">Nombre</span>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} required className="tactil mt-1 w-full rounded-lg border border-slate-300 px-2" />
      </label>
      <label className="block text-sm">
        <span className="text-xs font-medium text-slate-700">Objetivo (opcional)</span>
        <textarea value={objetivo} onChange={(e) => setObjetivo(e.target.value)} rows={2} maxLength={600} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1" />
      </label>
      <label className="block text-sm">
        <span className="text-xs font-medium text-slate-700">PIN</span>
        <input value={pin} onChange={(e) => setPin(e.target.value)} type="password" inputMode="numeric" autoComplete="off" required className="tactil mt-1 w-40 rounded-lg border border-slate-300 px-2" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="tactil rounded-lg bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-60">
          {busy ? "Creando…" : "Crear agente"}
        </button>
        <Estado msg={msg} />
      </div>
    </form>
  );
}

function Asignar({ rubroId, derivados, areas, asignaciones, alTerminar }: { rubroId: string; derivados: Agente[]; areas: string[]; asignaciones: Asignacion[]; alTerminar: () => Promise<void> }) {
  const [clave, setClave] = useState(derivados[0]?.clave ?? "");
  const [area, setArea] = useState(areas[0]);
  const [estado, setEstado] = useState<"apagada" | "activa" | "pausada">("apagada");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const agente = derivados.find((d) => d.clave === clave);
  return (
    <form
      className="space-y-2 rounded-lg border border-slate-200 p-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!agente) return;
        setBusy(true);
        setMsg(null);
        const r = await pedir("/api/agentes/asignaciones", "POST", { rubroId, area, clave, version: agente.version, estado, pin });
        setBusy(false);
        setPin("");
        if (!r.ok) return setMsg({ ok: false, text: r.data?.error ?? "No se pudo asignar." });
        setMsg({ ok: true, text: estado === "activa" ? "Asignación activa guardada. Con la pausa general puesta, igual no sale nada." : `Asignación guardada como «${estado}».` });
        await alTerminar();
      }}
    >
      <p className="text-sm text-slate-700">
        Activar exige una versión <strong>publicada</strong> (evaluación sin fallos críticos y comercial ≥ 14) y el PIN. Estado actual: {asignaciones.length ? asignaciones.map((a) => `${a.area} → ${a.agente_clave} v${a.version} (${a.estado})`).join(" · ") : "sin asignaciones"}.
      </p>
      <SelectorAgente derivados={derivados} principalClave={derivados[0]?.clave ?? ""} valor={clave} onChange={setClave} />
      <div className="flex flex-wrap gap-3">
        <label className="block text-sm">
          <span className="text-xs font-medium text-slate-700">Área</span>
          <select value={area} onChange={(e) => setArea(e.target.value)} className="tactil mt-1 rounded-lg border border-slate-300 px-2">
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium text-slate-700">Estado</span>
          <select value={estado} onChange={(e) => setEstado(e.target.value as any)} className="tactil mt-1 rounded-lg border border-slate-300 px-2">
            <option value="apagada">Apagada (no responde)</option>
            <option value="pausada">Pausada</option>
            <option value="activa">Activa (solo versión publicada)</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium text-slate-700">PIN</span>
          <input value={pin} onChange={(e) => setPin(e.target.value)} type="password" inputMode="numeric" autoComplete="off" required className="tactil mt-1 w-40 rounded-lg border border-slate-300 px-2" />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy || !agente} className="tactil rounded-lg bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-60">
          {busy ? "Guardando…" : "Guardar asignación"}
        </button>
        <Estado msg={msg} />
      </div>
    </form>
  );
}
