"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PedirAJarvis } from "@/components/resumen/pedir-a-jarvis";
import { NOMBRE_TIPO, TIPOS_CONOCIMIENTO, validarEntrada, type Conocimiento, type TipoConocimiento } from "@/lib/cerebro/conocimiento";
import { fechaLarga, type Decision } from "@/lib/cerebro/decisiones";
import { normalizar } from "@/lib/jarvis/cerebro-memoria";

/**
 * El cerebro que hace cosas (22/11): preguntarle (con la fuente de cada respuesta), enseñarle algo
 * (se guarda en la base, con confirmación), ver y archivar lo aprendido (nada se borra) y leer las
 * decisiones del dueño por fecha. Lo único que escribe es «Sí, guardar» y «Sí, archivar».
 */

const PERFILES = [
  { slug: "", nombre: "Todos los rubros" },
  { slug: "juridico", nombre: "VITA (Jurídico)" },
  { slug: "marketing", nombre: "Kocos Marketing" },
  { slug: "coberturas_medicas", nombre: "Coberturas médicas" },
  { slug: "agencia_0km", nombre: "Autos 0 km" },
] as const;

async function api<T = any>(url: string, cuerpo?: unknown, metodo?: string): Promise<T> {
  const r = await fetch(url, { method: metodo ?? (cuerpo === undefined ? "GET" : "POST"), cache: "no-store", headers: cuerpo === undefined ? undefined : { "content-type": "application/json" }, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error ?? "No se pudo completar. Probá de nuevo.");
  return j as T;
}

// ---------------------------------------------------------------------------
export function PreguntaCerebro() {
  const [q, setQ] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<{ fuente: string; titulo: string; texto: string }[] | null>(null);
  const [hecha, setHecha] = useState("");

  async function preguntar(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length < 3 || cargando) return;
    setCargando(true);
    setError(null);
    try {
      const j = await api<{ respuestas: { fuente: string; titulo: string; texto: string }[] }>("/api/cerebro/preguntar", { pregunta: q });
      setRes(j.respuestas);
      setHecha(q.trim());
    } catch (er) {
      setError((er as Error).message);
      setRes(null);
    } finally {
      setCargando(false);
    }
  }
  return (
    <div className="cz-viv">
      <form onSubmit={preguntar} className="cz-viv-form" role="search" aria-label="Preguntale al cerebro">
        <label htmlFor="cz-preg">Preguntale al cerebro</label>
        <div className="cz-viv-fila">
          <input id="cz-preg" type="search" value={q} onChange={(e) => setQ(e.target.value)} maxLength={300} placeholder="Ej.: ¿Cada cuánto sale el recontacto?" autoComplete="off" />
          <button type="submit" className="cz-btn" disabled={cargando || q.trim().length < 3}>
            {cargando ? "Buscando…" : "Preguntar"}
          </button>
        </div>
      </form>
      <div aria-live="polite">
        {error && <p className="cz-err">{error}</p>}
        {res && res.length === 0 && (
          <p className="cz-muted">No encontré nada sobre «{hecha}». Probá con otras palabras o enseñale algo al cerebro.</p>
        )}
        {res && res.length > 0 && (
          <ol className="cz-resp">
            {res.map((r, i) => (
              <li key={i} style={{ ["--i" as string]: i }}>
                <small>Fuente: {r.fuente}</small>
                <b>{r.titulo}</b>
                <p>{r.texto}</p>
              </li>
            ))}
          </ol>
        )}
        {res && res.length > 0 && (
          <PedirAJarvis pedido={`Explicame en simple lo que dice el cerebro sobre: ${hecha}`} className="cz-btn sec chico">
            Que Jarvis me lo explique
          </PedirAJarvis>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
export function AprendidoCerebro() {
  const [items, setItems] = useState<Conocimiento[] | null>(null);
  const [disponible, setDisponible] = useState(true);
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<TipoConocimiento>("nota");
  const [perfil, setPerfil] = useState("");
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [fuente, setFuente] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [archivando, setArchivando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const j = await api<{ disponible: boolean; items: Conocimiento[] }>("/api/cerebro/conocimiento");
      setItems(j.items);
      setDisponible(j.disponible);
    } catch {
      setItems([]);
      setDisponible(false);
    }
  }, []);
  useEffect(() => {
    cargar();
  }, [cargar]);

  function revisar(e: React.FormEvent) {
    e.preventDefault();
    const v = validarEntrada({ tipo, titulo, contenido, fuente });
    if (!v.ok) return setAviso({ ok: false, texto: v.error });
    setAviso(null);
    setConfirmar(true);
  }
  async function guardar() {
    setOcupado(true);
    try {
      await api("/api/cerebro/conocimiento", { tipo, titulo, contenido, fuente, perfil: perfil || undefined });
      setAviso({ ok: true, texto: "Listo: el cerebro ya lo sabe. Jarvis y la búsqueda lo usan desde ahora." });
      setTitulo("");
      setContenido("");
      setFuente("");
      await cargar();
    } catch (er) {
      setAviso({ ok: false, texto: (er as Error).message });
    } finally {
      setOcupado(false);
      setConfirmar(false);
    }
  }
  async function archivar(id: string) {
    setOcupado(true);
    try {
      await api("/api/cerebro/conocimiento", { id }, "PATCH");
      setAviso({ ok: true, texto: "Archivado: no se borró, solo dejó de usarse." });
      await cargar();
    } catch (er) {
      setAviso({ ok: false, texto: (er as Error).message });
    } finally {
      setOcupado(false);
      setArchivando(null);
    }
  }
  const visibles = useMemo(() => {
    const n = normalizar(busca.trim());
    return (items ?? []).filter((c) => !n || normalizar(`${c.titulo} ${c.contenido} ${c.fuente ?? ""}`).includes(n));
  }, [items, busca]);

  return (
    <div className="cz-viv">
      <form onSubmit={revisar} className="cz-form" aria-label="Enseñale algo al cerebro">
        <div className="cz-ens-fila">
          <label>
            Qué es
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoConocimiento)}>
              {TIPOS_CONOCIMIENTO.map((t) => (
                <option key={t} value={t}>
                  {NOMBRE_TIPO[t]}
                </option>
              ))}
            </select>
          </label>
          <label>
            De qué rubro
            <select value={perfil} onChange={(e) => setPerfil(e.target.value)}>
              {PERFILES.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Título corto
          <input value={titulo} maxLength={120} onChange={(e) => { setTitulo(e.target.value); setConfirmar(false); }} placeholder="Ej.: Domingos sin campañas" />
        </label>
        <label>
          Lo que tiene que saber
          <textarea rows={4} maxLength={4000} value={contenido} onChange={(e) => { setContenido(e.target.value); setConfirmar(false); }} placeholder="Escribilo como se lo explicarías a una persona nueva del equipo." />
        </label>
        <label>
          De dónde sale (opcional)
          <input value={fuente} maxLength={500} onChange={(e) => { setFuente(e.target.value); setConfirmar(false); }} placeholder="Un enlace o «lo dijo el dueño el 22/11»" />
        </label>
        {confirmar ? (
          <div className="cz-ens-conf" role="group" aria-label="Confirmar">
            <p>
              Se guarda en la memoria del cerebro: <b>{titulo.trim()}</b>. Desde ahora Jarvis y la búsqueda lo usan. ¿Lo guardo?
            </p>
            <div className="cz-ens-acc">
              <button type="button" className="cz-btn" disabled={ocupado} onClick={guardar}>
                {ocupado ? "Guardando…" : "Sí, guardar"}
              </button>
              <button type="button" className="cz-btn sec" disabled={ocupado} onClick={() => setConfirmar(false)}>
                No, volver
              </button>
            </div>
          </div>
        ) : (
          <div className="cz-ens-acc">
            <button type="submit" className="cz-btn">
              Revisar y guardar
            </button>
          </div>
        )}
      </form>
      <p role="status" aria-live="polite" className={aviso?.ok === false ? "cz-err" : "cz-ok"}>
        {aviso?.texto ?? ""}
      </p>

      <div className="cz-busca">
        <label htmlFor="cz-apr-q">Lo que el cerebro aprendió{items ? ` (${items.length})` : ""}</label>
        <input id="cz-apr-q" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar en lo aprendido…" autoComplete="off" />
      </div>
      {!items && <p role="status" className="cz-muted">Cargando…</p>}
      {items && !disponible && <p className="cz-muted">El cuaderno del cerebro todavía no está activado. Cuando Claude aplique la migración 0650, acá vas a ver y guardar lo que le enseñes.</p>}
      {items && disponible && items.length === 0 && <p className="cz-muted">Todavía no le enseñaste nada. Lo primero que guardes aparece acá.</p>}
      {visibles.length > 0 && (
        <ul className="cz-apr">
          {visibles.slice(0, 30).map((c, i) => (
            <li key={c.id} style={{ ["--i" as string]: i }}>
              <div className="cz-apr-cab">
                <span className="cz-tag">{NOMBRE_TIPO[c.tipo] ?? c.tipo}</span>
                <time dateTime={c.created_at}>{new Date(c.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}</time>
              </div>
              <b>{c.titulo}</b>
              <p>{c.contenido}</p>
              {c.fuente && <small>Fuente: {c.fuente}</small>}
              {archivando === c.id ? (
                <div className="cz-ens-acc" role="group" aria-label="Confirmar archivar">
                  <span>¿Lo archivo? No se borra.</span>
                  <button type="button" className="cz-btn chico" disabled={ocupado} onClick={() => archivar(c.id)}>
                    Sí, archivar
                  </button>
                  <button type="button" className="cz-btn sec chico" disabled={ocupado} onClick={() => setArchivando(null)}>
                    No
                  </button>
                </div>
              ) : (
                <button type="button" className="cz-btn sec chico" onClick={() => setArchivando(c.id)}>
                  Archivar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {items && items.length > 0 && visibles.length === 0 && <p className="cz-muted">No hay nada con esas palabras.</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
export function DecisionesCerebro({ decisiones }: { decisiones: Decision[] }) {
  const [q, setQ] = useState("");
  const [todas, setTodas] = useState(false);
  const n = normalizar(q.trim());
  const filtradas = decisiones.filter((d) => !n || normalizar(`${d.titulo} ${d.puntos.join(" ")}`).includes(n));
  const lista = todas || n ? filtradas : filtradas.slice(0, 6);
  if (decisiones.length === 0) return <p className="cz-muted">No pude leer las órdenes ahora. Están en el archivo de órdenes vigentes del cerebro.</p>;
  return (
    <div className="cz-viv">
      <div className="cz-busca">
        <label htmlFor="cz-dec-q">Buscar en las decisiones</label>
        <input id="cz-dec-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej.: Jarvis, diseño, campañas…" autoComplete="off" />
      </div>
      <ol className="cz-dec">
        {lista.map((d, i) => (
          <li key={d.id} style={{ ["--i" as string]: i }}>
            <span className="cz-dec-fecha">{fechaLarga(d.fecha)}</span>
            <details>
              <summary>{d.titulo}</summary>
              <ul>
                {d.puntos.map((p, k) => (
                  <li key={k}>{p}</li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ol>
      {filtradas.length === 0 && <p className="cz-muted">No hay decisiones con esas palabras.</p>}
      {!n && filtradas.length > 6 && (
        <button type="button" className="cz-btn sec chico" aria-expanded={todas} onClick={() => setTodas((v) => !v)}>
          {todas ? "Ver menos" : `Ver las ${filtradas.length}`}
        </button>
      )}
    </div>
  );
}
