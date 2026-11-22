"use client";

import Link from "next/link";
import { useState } from "react";
import { PedirAJarvis } from "@/components/resumen/pedir-a-jarvis";
import { ETIQUETA_RUBRO, type RubroCerebro } from "@/lib/cerebro/contenido";
import type { Recomendacion } from "@/lib/cerebro/recomendaciones";
import { filtrarBarrios, pedidoDeRecomendacion, type ResumenGrafo } from "@/lib/cerebro/anillo";
import { CIERRE_CONFIRMAR } from "@/lib/resumen/pedidos";
import { ETIQUETA_ETAPA, NOMBRE_AREA, escritorioActual, etapaDe, vistaEscritorios, type TareaOficina } from "@/lib/oficina/reglas";
import { formatoNumero } from "@/lib/premium/anillo";

/**
 * Funciones operables de las pantallas del anillo (vuelta 6). Todo lo que escribe pide confirmación:
 * «Arrancar ahora» (Oficina), «Mandar a la Oficina» (recomendación → pedido). Abrir una propuesta de
 * Jarvis lleva a Jarvis, que pide su propio OK antes de ejecutar.
 */

async function post<T = any>(url: string, cuerpo: unknown): Promise<T> {
  const r = await fetch(url, { method: "POST", cache: "no-store", headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error ?? "No se pudo completar. Probá de nuevo.");
  return j as T;
}

const PERFIL_DE: Record<RubroCerebro, string> = { todos: "juridico", juridico: "juridico", coberturas_medicas: "coberturas_medicas", agencia_0km: "agencia_0km", marketing: "marketing" };
const NOMBRE_PERFIL: Record<string, string> = { juridico: "VITA (Jurídico)", marketing: "Kocos Marketing", coberturas_medicas: "Coberturas médicas", agencia_0km: "Autos 0 km" };

// ---------------------------------------------------------------------------
/** Oficina ahora: escritorios con su estado y las tareas en curso; «Arrancar ahora» con confirmación. */
export function OficinaAhora({ tareas }: { tareas: TareaOficina[] | null }) {
  const [confirmar, setConfirmar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  if (!tareas) return <p className="cz-muted">No pude leer la Oficina ahora. Probá de nuevo en un rato.</p>;
  const escritorios = vistaEscritorios(tareas);
  const vivas = tareas.filter((t) => etapaDe(t) !== "cerrada").slice(0, 8);
  const enEntrada = tareas.filter((t) => etapaDe(t) === "entrada").length;

  async function arrancar() {
    setOcupado(true);
    setAviso(null);
    try {
      const j = await post<{ arranque: { nota?: string } }>("/api/oficina/arrancar", {});
      setAviso({ ok: true, texto: j.arranque?.nota || "Listo: los agentes arrancaron." });
    } catch (e) {
      setAviso({ ok: false, texto: (e as Error).message });
    } finally {
      setOcupado(false);
      setConfirmar(false);
    }
  }

  return (
    <div className="cz-viv">
      <ul className="cz-escritorios">
        {escritorios.map((e, i) => (
          <li key={e.area} data-estado={e.estado} style={{ ["--i" as string]: i }}>
            <span className="cz-escritorio__luz" aria-hidden="true" />
            <b>{e.nombre}</b>
            <small>{e.estado === "trabajando" ? `Trabajando · ${e.carga}` : e.estado === "en_cola" ? `En cola · ${e.carga}` : "Libre"}</small>
            {e.ultima && <p>{e.ultima}</p>}
          </li>
        ))}
      </ul>
      {vivas.length > 0 ? (
        <ol className="cz-tareas">
          {vivas.map((t, i) => {
            const donde = escritorioActual(t);
            return (
              <li key={t.id} style={{ ["--i" as string]: i }}>
                <b>{t.titulo}</b>
                <small>
                  {ETIQUETA_ETAPA[etapaDe(t)]}
                  {donde ? ` · en ${NOMBRE_AREA[donde]}` : ""}
                </small>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="cz-muted">No hay tareas abiertas. Ordenale algo desde la barra de arriba y aparece acá.</p>
      )}
      <p role="status" aria-live="polite" className={aviso?.ok === false ? "cz-err" : "cz-ok"}>
        {aviso?.texto ?? ""}
      </p>
      {confirmar ? (
        <div className="cz-ens-acc" role="group" aria-label="Confirmar el arranque">
          <span>Despierto a los agentes para que trabajen la mesa de entrada ({enEntrada}). ¿Arranco?</span>
          <button type="button" className="cz-btn" disabled={ocupado} onClick={arrancar}>
            {ocupado ? "Arrancando…" : "Sí, arrancar"}
          </button>
          <button type="button" className="cz-btn sec" disabled={ocupado} onClick={() => setConfirmar(false)}>
            No
          </button>
        </div>
      ) : (
        <div className="cz-ens-acc">
          <button type="button" className="cz-btn" onClick={() => setConfirmar(true)} disabled={enEntrada === 0} title={enEntrada === 0 ? "No hay tareas en la mesa de entrada" : undefined}>
            Arrancar ahora
          </button>
          <Link href="/oficina" prefetch={false} className="cz-btn sec">
            Entrar a la Oficina 3D
          </Link>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
export interface PropuestaVista {
  id: string;
  titulo: string;
  resumen: string;
  perfil: string | null;
}

/** Propuestas de Jarvis esperando el OK: cada una se abre en Jarvis para confirmarla (Jarvis pide su OK). */
export function JarvisPropuestas({ propuestas }: { propuestas: PropuestaVista[] | null }) {
  if (!propuestas) return <p className="cz-muted">No pude leer las propuestas de Jarvis ahora.</p>;
  if (propuestas.length === 0) return <p className="cz-muted">Jarvis no tiene propuestas esperando. Pedile algo desde la barra o desde Jarvis.</p>;
  return (
    <ul className="cz-propuestas">
      {propuestas.slice(0, 10).map((p, i) => (
        <li key={p.id} style={{ ["--i" as string]: i }}>
          <span className="cz-tag">{p.perfil ? NOMBRE_PERFIL[p.perfil] ?? p.perfil : "Sin perfil"}</span>
          <b>{p.titulo}</b>
          {p.resumen && <p>{p.resumen.slice(0, 220)}</p>}
          <PedirAJarvis pedido={`Abrime la propuesta «${p.titulo}» de ${p.perfil ? NOMBRE_PERFIL[p.perfil] ?? p.perfil : "este perfil"} y explicame qué haría. ${CIERRE_CONFIRMAR}`} className="cz-btn chico">
            Abrir para confirmar
          </PedirAJarvis>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
/** Recomendaciones con dos salidas: «Hacerlo con Jarvis» o convertirla en pedido a la Oficina (con confirmación). */
export function RecomendacionesAccion({ items }: { items: Recomendacion[] }) {
  const [pregunta, setPregunta] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [hechas, setHechas] = useState<string[]>([]);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [perfilGeneral, setPerfilGeneral] = useState("juridico");
  if (items.length === 0) return <p className="cz-muted">Hoy no hay nada para recomendar.</p>;

  async function mandar(r: Recomendacion) {
    setOcupado(true);
    setAviso(null);
    try {
      await post("/api/oficina", { perfil: r.rubro === "todos" ? perfilGeneral : PERFIL_DE[r.rubro], pedido: pedidoDeRecomendacion(r.titulo, r.porque) });
      setHechas((h) => [...h, r.clave]);
      setAviso({ ok: true, texto: "Listo: quedó en la mesa de entrada de la Oficina. Arranca cuando toques «Arrancar ahora»." });
    } catch (e) {
      setAviso({ ok: false, texto: (e as Error).message });
    } finally {
      setOcupado(false);
      setPregunta(null);
    }
  }

  return (
    <div className="cz-viv">
      <p role="status" aria-live="polite" className={aviso?.ok === false ? "cz-err" : "cz-ok"}>
        {aviso?.texto ?? ""}
      </p>
      <ul className="cz-recos">
        {items.map((r, i) => (
          <li key={r.clave} className="cz-reco" style={{ ["--i" as string]: i }}>
            <span className="cz-reco__rubro">{ETIQUETA_RUBRO[r.rubro]}</span>
            <h3>{r.titulo}</h3>
            <p>{r.porque}</p>
            <div className="cz-ens-acc">
              <PedirAJarvis pedido={r.pedido} className="cz-btn chico">
                Hacerlo con Jarvis
              </PedirAJarvis>
              {hechas.includes(r.clave) ? (
                <small className="cz-ok">En la Oficina</small>
              ) : pregunta === r.clave ? (
                <span className="cz-ens-acc" role="group" aria-label="Confirmar">
                  {r.rubro === "todos" ? (
                    <label className="cz-inline">
                      ¿Para qué rubro?
                      <select value={perfilGeneral} onChange={(e) => setPerfilGeneral(e.target.value)}>
                        {Object.entries(NOMBRE_PERFIL).map(([slug, nombre]) => (
                          <option key={slug} value={slug}>
                            {nombre}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <span>¿La mando a la Oficina?</span>
                  <button type="button" className="cz-btn chico" disabled={ocupado} onClick={() => mandar(r)}>
                    {ocupado ? "Mandando…" : "Sí"}
                  </button>
                  <button type="button" className="cz-btn sec chico" disabled={ocupado} onClick={() => setPregunta(null)}>
                    No
                  </button>
                </span>
              ) : (
                <button type="button" className="cz-btn sec chico" onClick={() => setPregunta(r.clave)}>
                  Convertir en pedido a la Oficina
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
/** Mapa del código (Graphify): cifras, piezas centrales y buscador de barrios. Solo lee. */
export function MapaCodigo({ grafo }: { grafo: ResumenGrafo | null }) {
  const [q, setQ] = useState("");
  if (!grafo) return <p className="cz-muted">No encontré el mapa del código. Se arma con Graphify en cerebro/mapa-codigo.</p>;
  const barrios = filtrarBarrios(grafo.barrios, q);
  const max = Math.max(1, ...grafo.centrales.map((c) => c.conexiones));
  return (
    <div className="cz-viv">
      <ul className="cz-mapa-cifras">
        <li>
          <b>{grafo.archivos == null ? "—" : formatoNumero(grafo.archivos)}</b> archivos
        </li>
        <li>
          <b>{grafo.nodos == null ? "—" : formatoNumero(grafo.nodos)}</b> piezas
        </li>
        <li>
          <b>{grafo.relaciones == null ? "—" : formatoNumero(grafo.relaciones)}</b> conexiones
        </li>
        <li>
          <b>{grafo.comunidades == null ? "—" : formatoNumero(grafo.comunidades)}</b> barrios
        </li>
      </ul>
      <h3 className="cz-sub">Las piezas más conectadas</h3>
      <ol className="cz-barras">
        {grafo.centrales.map((c, i) => (
          <li key={c.nombre} style={{ ["--i" as string]: i, ["--v" as string]: c.conexiones / max }}>
            <code>{c.nombre}</code>
            <span>{c.conexiones}</span>
          </li>
        ))}
      </ol>
      <div className="cz-busca">
        <label htmlFor="cz-mapa-q">Buscar un barrio del código</label>
        <input id="cz-mapa-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej.: oficina, salud, laboratorio…" autoComplete="off" />
      </div>
      <ul className="cz-barrios" aria-live="polite">
        {barrios.slice(0, 30).map((b) => (
          <li key={b}>{b}</li>
        ))}
        {barrios.length === 0 && <li className="cz-muted">Ningún barrio con esas letras.</li>}
      </ul>
      <p className="cz-muted">Actualizado {grafo.fecha ?? "sin fecha"}. Los agentes lo consultan antes de tocar código.</p>
    </div>
  );
}
