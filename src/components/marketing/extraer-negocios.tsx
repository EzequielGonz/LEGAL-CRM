"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PROVINCIAS_AR, TODA_ARGENTINA, nombreBaseSugerido } from "@/lib/marketing/venta";

interface Extraccion {
  id: string;
  nombre_base: string;
  estado: string;
  base_id: string;
  cantidad_max: number;
  encontrados: number;
  creados: number;
  duplicados: number;
  invalidos: number;
  error: string | null;
  progreso: { hechas?: string[]; pendientes?: string[] };
}

const ESTADO: Record<string, string> = { pendiente: "En cola", ejecutando: "Buscando…", listo: "Lista", error: "Con error", cancelado: "Cancelada" };

/**
 * Extraer negocios (16/10): tipo, zona, cantidad y nombre de base (sugerido
 * y editable) → «Generar base». Muestra el avance y, al terminar, la tarjeta
 * con «Ejecutar base» (con PIN) y «Ver en Bases».
 */
export function ExtraerNegocios({ limites, usadosHoy, faltan, avisos }: { limites: { por_extraccion: number; por_dia: number }; usadosHoy: number; faltan: string[]; avisos: string[] }) {
  const [tipo, setTipo] = useState("");
  const [todaArgentina, setTodaArgentina] = useState(true);
  const [provincias, setProvincias] = useState<string[]>([]);
  const [localidades, setLocalidades] = useState("");
  const [cantidad, setCantidad] = useState(100);
  const [nombre, setNombre] = useState("");
  const [nombreEditado, setNombreEditado] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [ext, setExt] = useState<Extraccion | null>(null);
  const [pin, setPin] = useState("");
  const [ejec, setEjec] = useState<{ ok: boolean; text: string; faltan?: string[] } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const zonas = useMemo(() => {
    if (todaArgentina) return [TODA_ARGENTINA];
    const locs = localidades.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
    return [...provincias, ...locs];
  }, [todaArgentina, provincias, localidades]);

  useEffect(() => {
    if (!nombreEditado) setNombre(nombreBaseSugerido(tipo || "Negocios", zonas));
  }, [tipo, zonas, nombreEditado]);

  useEffect(() => {
    if (!ext || !["pendiente", "ejecutando"].includes(ext.estado)) {
      if (timer.current) clearInterval(timer.current);
      return;
    }
    timer.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/marketing/extraer?id=${ext.id}`, { cache: "no-store" });
        const d = await r.json();
        if (d.extraccion) setExt(d.extraccion);
      } catch {
        // se reintenta en el próximo ciclo
      }
    }, 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [ext]);

  const disponibles = Math.max(0, limites.por_dia - usadosHoy);
  const hechas = ext?.progreso?.hechas?.length ?? 0;
  const total = hechas + (ext?.progreso?.pendientes?.length ?? 0);

  return (
    <div className="space-y-6">
      <form
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMsg(null);
          setEjec(null);
          try {
            const r = await fetch("/api/marketing/extraer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo, zonas, cantidad, nombre }) });
            const d = await r.json().catch(() => ({}));
            if (!r.ok) setMsg({ ok: false, text: d.error ?? "No se pudo generar la base." });
            else {
              setExt(d.extraccion);
              setMsg({ ok: true, text: "Base creada: la búsqueda sigue zona por zona aunque cierres esta pantalla." });
            }
          } catch {
            setMsg({ ok: false, text: "Sin conexión: no se generó nada." });
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-800">Tipo de negocio</span>
            <input value={tipo} onChange={(e) => setTipo(e.target.value)} required minLength={2} placeholder="Ej.: pizzerías, gimnasios, inmobiliarias" className="tactil w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-800">Cantidad máxima</span>
            <input type="number" min={1} max={limites.por_extraccion} value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} required className="tactil w-full rounded-lg border border-slate-300 px-3" />
            <span className="mt-1 block text-xs text-slate-600">Tope por extracción: {limites.por_extraccion}. Disponibles hoy: {disponibles} de {limites.por_dia}.</span>
          </label>
        </div>
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium text-slate-800">Zona</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={todaArgentina} onChange={() => setTodaArgentina(true)} /> Toda Argentina (se reparte en las 24 provincias)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={!todaArgentina} onChange={() => setTodaArgentina(false)} /> Provincias o localidades
          </label>
          {!todaArgentina && (
            <div className="space-y-2 pl-6">
              <div className="grid max-h-48 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-slate-200 p-2 text-sm sm:grid-cols-2">
                {PROVINCIAS_AR.map((p) => (
                  <label key={p} className="flex items-center gap-2">
                    <input type="checkbox" checked={provincias.includes(p)} onChange={(e) => setProvincias(e.target.checked ? [...provincias, p] : provincias.filter((x) => x !== p))} /> {p}
                  </label>
                ))}
              </div>
              <label className="block">
                <span className="mb-1 block text-xs text-slate-600">Localidades (separadas por coma), por ejemplo: Rosario, Mar del Plata, La Plata</span>
                <input value={localidades} onChange={(e) => setLocalidades(e.target.value)} className="tactil w-full rounded-lg border border-slate-300 px-3" />
              </label>
            </div>
          )}
        </fieldset>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-800">Nombre de la base</span>
          <input
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setNombreEditado(true);
            }}
            required
            minLength={3}
            maxLength={120}
            className="tactil w-full rounded-lg border border-slate-300 px-3"
          />
          <span className="mt-1 block text-xs text-slate-600">Se arma solo con el tipo, la zona y la fecha; podés cambiarlo.</span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy || (!todaArgentina && zonas.length === 0)} className="tactil rounded-lg bg-slate-900 px-5 text-sm font-semibold text-gold-100 disabled:opacity-60">
            {busy ? "Generando…" : "Generar base"}
          </button>
          <p role="status" aria-live="polite" className={msg ? (msg.ok ? "text-sm text-emerald-700" : "text-sm font-medium text-red-700") : "sr-only"}>
            {msg?.text ?? ""}
          </p>
        </div>
        <p className="text-xs text-slate-600">Generar la base no le escribe a nadie. Los negocios ya cargados antes (mismo lugar de Google o mismo teléfono) no se repiten.</p>
      </form>

      {ext && (
        <section aria-live="polite" className="rounded-xl border border-gold-500/40 bg-white p-5 shadow-gold">
          <p className="text-xs uppercase tracking-wider text-gold-700">{ESTADO[ext.estado] ?? ext.estado}</p>
          <h2 className="font-serif text-xl font-semibold text-slate-900">{ext.nombre_base}</h2>
          <p className="mt-1 text-sm text-slate-700">
            <strong className="text-2xl text-slate-900">{ext.creados}</strong> negocios nuevos · {ext.duplicados} ya estaban · {ext.invalidos} sin teléfono · {ext.encontrados} encontrados de {ext.cantidad_max}
          </p>
          {total > 0 && (
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={hechas} aria-label="Zonas procesadas">
                <div className="h-full bg-gold-500 transition-all" style={{ width: `${Math.round((hechas / total) * 100)}%` }} />
              </div>
              <p className="mt-1 text-xs text-slate-600">Zonas: {hechas} de {total}{ext.progreso?.pendientes?.[0] && ["pendiente", "ejecutando"].includes(ext.estado) ? ` · sigue con ${ext.progreso.pendientes[0]}` : ""}</p>
            </div>
          )}
          {ext.error && <p className="mt-2 text-xs text-amber-800">Último aviso: {ext.error}</p>}
          {["listo", "error"].includes(ext.estado) && (
            <div className="mt-4 flex flex-wrap items-start gap-3">
              <form
                className="flex flex-wrap items-center gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!window.confirm(`¿Ejecutar «${ext.nombre_base}»? Se crea la campaña con la apertura de Kocos Marketing y empieza a enviar (si no falta nada).`)) return;
                  setEjec(null);
                  try {
                    const r = await fetch("/api/marketing/ejecutar-base", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ extraccionId: ext.id, pin }) });
                    const d = await r.json().catch(() => ({}));
                    if (r.status === 200) setEjec({ ok: true, text: `Campaña en curso con ${d.agregados ?? 0} destinatarios.` });
                    else if (r.status === 207) setEjec({ ok: false, text: `Campaña creada en borrador${d.agregados != null ? ` con ${d.agregados} destinatarios` : ""}. Falta:`, faltan: d.faltan });
                    else setEjec({ ok: false, text: d.error ?? "No se pudo ejecutar." });
                  } catch {
                    setEjec({ ok: false, text: "Sin conexión." });
                  } finally {
                    setPin("");
                  }
                }}
              >
                <input value={pin} onChange={(e) => setPin(e.target.value)} type="password" inputMode="numeric" autoComplete="off" placeholder="PIN" required aria-label="PIN" className="tactil w-28 rounded-lg border border-slate-300 px-2" />
                <button type="submit" className="tactil rounded-lg bg-slate-900 px-4 text-sm font-semibold text-gold-100">Ejecutar base</button>
              </form>
              <Link href={`/panel/marketing/bases/${ext.base_id}`} className="tactil inline-flex items-center rounded-lg border border-slate-300 px-4 text-sm font-medium">Ver en Bases</Link>
            </div>
          )}
          {ejec && (
            <div role="status" className={`mt-3 text-sm ${ejec.ok ? "text-emerald-700" : "text-red-700"}`}>
              <p className="font-medium">{ejec.text}</p>
              {ejec.faltan && ejec.faltan.length > 0 && (
                <ul className="mt-1 list-disc pl-5">
                  {ejec.faltan.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      )}

      {(faltan.length > 0 || avisos.length > 0) && (
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="mb-1 font-semibold text-slate-900">Antes de «Ejecutar base»</h2>
          {faltan.length > 0 ? (
            <ul className="list-disc space-y-0.5 pl-5 text-slate-700">
              {faltan.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          ) : (
            <p className="text-emerald-700">Está todo configurado.</p>
          )}
          {avisos.map((a) => (
            <p key={a} className="mt-1 text-xs text-amber-800">{a}</p>
          ))}
        </section>
      )}
    </div>
  );
}
