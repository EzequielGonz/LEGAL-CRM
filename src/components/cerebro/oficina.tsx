"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MAX_PEDIDO, pareceDatoPersonal } from "@/lib/bandeja-claude";
import {
  ETIQUETA_ETAPA,
  NOMBRE_AREA,
  escritorioActual,
  etapaDe,
  vistaEscritorios,
  type Area,
  type TareaOficina,
} from "@/lib/oficina/reglas";

/**
 * La Oficina (22/11): escritorios de agentes por área. El dueño deja una
 * tarea, Gemini la ordena al instante, «Arrancar ahora» despierta a los
 * agentes de Claude, cada escritorio deja su parte en el recorrido, Dirección
 * revisa y la tarea llega «esperando tu OK». Hasta borrador: nada se publica
 * sin ese OK.
 */

export interface ArranqueVista {
  pedido_at: string;
  estado: string;
  nota: string | null;
  tareas: number | null;
  terminado_at: string | null;
}

const PERFILES = [
  { slug: "juridico", nombre: "VITA (Jurídico)" },
  { slug: "marketing", nombre: "Kocos Marketing" },
  { slug: "coberturas_medicas", nombre: "Coberturas médicas" },
  { slug: "agencia_0km", nombre: "Autos 0 km" },
] as const;

const TEXTO_ARRANQUE: Record<string, string> = {
  pedido: "Arranque pedido",
  disparado: "Los agentes arrancaron",
  tomado: "Trabajando",
  terminado: "Terminaron la vuelta",
  sin_disparador: "Falta conectar el disparo: escribí «oficina» en un chat de Claude del proyecto",
  fallo: "No se pudo disparar",
};

function hace(iso: string | null | undefined): string {
  if (!iso) return "";
  const min = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (!Number.isFinite(min)) return "";
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} d`;
}

export function Oficina({ inicial, arranqueInicial }: { inicial: TareaOficina[]; arranqueInicial: ArranqueVista | null }) {
  const [tareas, setTareas] = useState(inicial);
  const [arranque, setArranque] = useState(arranqueInicial);
  const [perfil, setPerfil] = useState<string>("juridico");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null);
  const [arrancando, setArrancando] = useState(false);

  const recargar = useCallback(async () => {
    const r = await fetch("/api/oficina", { cache: "no-store" }).catch(() => null);
    if (!r?.ok) return;
    const d = await r.json().catch(() => null);
    if (d?.tareas) setTareas(d.tareas);
    if (d && "arranque" in d) setArranque(d.arranque);
  }, []);

  const hayMovimiento = tareas.some((t) => t.estado === "en_curso") || arranque?.estado === "disparado" || arranque?.estado === "tomado";
  useEffect(() => {
    if (!hayMovimiento) return;
    const id = setInterval(recargar, 20000);
    return () => clearInterval(id);
  }, [hayMovimiento, recargar]);

  const escritorios = useMemo(() => vistaEscritorios(tareas), [tareas]);
  const enCurso = tareas.filter((t) => ["entrada", "trabajando", "trabada"].includes(etapaDe(t)));
  const esperando = tareas.filter((t) => etapaDe(t) === "esperando_ok");
  const aprobadas = tareas.filter((t) => etapaDe(t) === "aprobada").slice(0, 5);
  const enEntrada = tareas.filter((t) => t.estado === "pendiente" || t.estado === "en_espera").length;

  async function dejarTarea(e: React.FormEvent) {
    e.preventDefault();
    setAviso(null);
    if (!texto.trim()) return setAviso({ tipo: "err", texto: "Escribí la tarea para la oficina." });
    if (pareceDatoPersonal(texto)) return setAviso({ tipo: "err", texto: "Sacá teléfonos, documentos o correos: la oficina no guarda datos personales." });
    setEnviando(true);
    try {
      const r = await fetch("/api/oficina", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ perfil, pedido: texto }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error || "No se pudo guardar la tarea.");
      const ruta: Area[] = d?.tarea?.ruta ?? [];
      setAviso({
        tipo: "ok",
        texto: d?.rapida
          ? "Quedó en la mesa de entrada. Ojo: parece una consulta rápida, el Asistente de más abajo te la contesta al instante."
          : `Quedó en la mesa de entrada. Ruta: ${ruta.map((a) => NOMBRE_AREA[a]).join(" → ")}. Tocá «Arrancar ahora» cuando quieras que trabajen.`,
      });
      setTexto("");
      await recargar();
    } catch (err) {
      setAviso({ tipo: "err", texto: err instanceof Error ? err.message : "No se pudo guardar la tarea." });
    } finally {
      setEnviando(false);
    }
  }

  async function arrancar() {
    setAviso(null);
    setArrancando(true);
    try {
      const r = await fetch("/api/oficina/arrancar", { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (d?.arranque) setArranque(d.arranque);
      if (!r.ok && !d?.arranque) throw new Error(d?.error || "No se pudo arrancar.");
      if (d?.arranque?.estado === "sin_disparador") {
        setAviso({ tipo: "err", texto: "Quedó pedido, pero el disparo automático todavía no está conectado. Mientras tanto, escribí «oficina» en un chat de Claude Code del proyecto y los agentes lo toman." });
      } else if (d?.arranque?.estado === "fallo") {
        setAviso({ tipo: "err", texto: d.arranque.nota || "No se pudo disparar." });
      } else {
        setAviso({ tipo: "ok", texto: "Los agentes arrancaron. Vas a ver cada escritorio trabajando acá." });
      }
    } catch (err) {
      setAviso({ tipo: "err", texto: err instanceof Error ? err.message : "No se pudo arrancar." });
    } finally {
      setArrancando(false);
    }
  }

  return (
    <div className="cz-of">
      <div className="cz-of-barra">
        <div>
          <strong>{enEntrada}</strong> en la mesa de entrada · <strong>{tareas.filter((t) => t.estado === "en_curso").length}</strong> trabajando ·{" "}
          <strong>{esperando.length}</strong> esperando tu OK
          {arranque && (
            <small>
              Último arranque: {TEXTO_ARRANQUE[arranque.estado] ?? arranque.estado} · {hace(arranque.pedido_at)}
            </small>
          )}
        </div>
        <button type="button" className="cz-btn cz-of-arrancar" onClick={arrancar} disabled={arrancando || enEntrada === 0}>
          <span className="pulso" aria-hidden="true" />
          {arrancando ? "Arrancando…" : "Arrancar ahora"}
        </button>
      </div>

      <ul className="cz-of-grid" aria-label="Escritorios">
        {escritorios.map((e) => (
          <li key={e.area} className={`cz-desk ${e.estado}`} data-area={e.area}>
            <header>
              <span className="luz" aria-hidden="true" />
              <h3>{e.nombre}</h3>
              <span className="carga">{e.estado === "trabajando" ? "Trabajando" : e.estado === "en_cola" ? `${e.carga} en cola` : "Libre"}</span>
            </header>
            <p className="rol">{e.rol}</p>
            <div className="equipo" aria-label="Agentes">
              {e.equipo.map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
            {e.estado === "trabajando" && (
              <div className="tecleo" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
            )}
            {e.ultima && <p className="ultima">«{e.ultima.length > 110 ? `${e.ultima.slice(0, 107)}…` : e.ultima}»</p>}
          </li>
        ))}
      </ul>

      <div className="cz-grid2">
        <form onSubmit={dejarTarea} className="cz-form" aria-label="Dejar una tarea en la oficina">
          <label>
            Perfil
            <select value={perfil} onChange={(e) => setPerfil(e.target.value)}>
              {PERFILES.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tarea para la oficina
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={4}
              maxLength={MAX_PEDIDO}
              placeholder="Ej.: Analizá qué reels de VITA funcionaron este mes y armá la estrategia de la semana que viene con 5 guiones."
            />
          </label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button className="cz-btn" type="submit" disabled={enviando}>
              {enviando ? "Ordenando…" : "Dejar en la oficina"}
            </button>
            <small className="cz-muted">Gemini la ordena al instante; los agentes la trabajan cuando arranques.</small>
          </div>
          {aviso && (
            <p className={aviso.tipo === "ok" ? "cz-ok" : "cz-err"} role="status">
              {aviso.texto}
            </p>
          )}
        </form>

        <div className="cz-card">
          <header>
            <h3>En marcha</h3>
            <small className="cz-muted">{enCurso.length ? `${enCurso.length} tareas` : "Nada en marcha"}</small>
          </header>
          {enCurso.length ? (
            <ul className="cz-of-tareas">
              {enCurso.slice(0, 8).map((t) => (
                <TareaEnMarcha key={t.id} t={t} />
              ))}
            </ul>
          ) : (
            <p className="cz-muted">Dejá una tarea y tocá «Arrancar ahora».</p>
          )}
        </div>
      </div>

      <div className="cz-card cz-of-ok">
        <header>
          <h3>Esperando tu OK</h3>
          <small className="cz-muted">Nada se publica ni se aplica sin tu aprobación.</small>
        </header>
        {esperando.length ? (
          <ul className="cz-of-tareas">
            {esperando.map((t) => (
              <TareaParaAprobar key={t.id} t={t} alDecidir={recargar} />
            ))}
          </ul>
        ) : (
          <p className="cz-muted">Cuando los agentes terminen, las entregas aparecen acá para que las revises.</p>
        )}
        {aprobadas.length > 0 && (
          <p className="cz-muted" style={{ marginTop: 6 }}>
            Aprobadas hace poco: {aprobadas.map((t) => t.titulo).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

function Ruta({ t }: { t: TareaOficina }) {
  const actual = escritorioActual(t);
  const hechos = new Set(t.recorrido.map((p) => p.area));
  return (
    <ol className="cz-ruta" aria-label="Recorrido">
      {t.ruta.map((a) => (
        <li key={a} className={hechos.has(a) ? "hecho" : a === actual ? "ahora" : ""}>
          {NOMBRE_AREA[a]}
        </li>
      ))}
    </ol>
  );
}

function TareaEnMarcha({ t }: { t: TareaOficina }) {
  const etapa = etapaDe(t);
  return (
    <li>
      <div className="fila">
        <strong>{t.titulo}</strong>
        <span className={`cz-chip ${etapa === "trabada" ? "c-warn" : etapa === "trabajando" ? "c-ok" : "c-idk"}`}>{ETIQUETA_ETAPA[etapa]}</span>
      </div>
      {t.ruta.length > 0 && <Ruta t={t} />}
    </li>
  );
}

function TareaParaAprobar({ t, alDecidir }: { t: TareaOficina; alDecidir: () => Promise<void> }) {
  const [abierta, setAbierta] = useState(false);
  const [nota, setNota] = useState("");
  const [modo, setModo] = useState<"cambios" | "rechazada" | null>(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function decidir(decision: "aprobada" | "cambios" | "rechazada") {
    setError("");
    setGuardando(true);
    try {
      const r = await fetch(`/api/oficina/${t.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ decision, nota }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error || "No se pudo guardar.");
      await alDecidir();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <li>
      <div className="fila">
        <strong>{t.titulo}</strong>
        <button type="button" className="cz-btn sec chico" aria-expanded={abierta} onClick={() => setAbierta((v) => !v)}>
          {abierta ? "Cerrar" : "Revisar"}
        </button>
      </div>
      {t.ruta.length > 0 && <Ruta t={t} />}
      {abierta && (
        <div className="detalle">
          {t.recorrido.length > 0 && (
            <ul className="pasos">
              {t.recorrido.map((p, i) => (
                <li key={i}>
                  <b>{p.area === "duenos" ? "Dueños" : NOMBRE_AREA[p.area]}</b> · {p.agente}
                  {p.nota && <span> — {p.nota}</span>}
                </li>
              ))}
            </ul>
          )}
          {t.resultado && <p className="resultado">{t.resultado}</p>}
          {modo && (
            <label className="nota">
              {modo === "cambios" ? "¿Qué cambiar?" : "¿Por qué la descartás?"}
              <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={3} maxLength={1000} />
            </label>
          )}
          <div className="acciones">
            {!modo ? (
              <>
                <button type="button" className="cz-btn" disabled={guardando} onClick={() => decidir("aprobada")}>
                  Aprobar
                </button>
                <button type="button" className="cz-btn sec" disabled={guardando} onClick={() => setModo("cambios")}>
                  Pedir cambios
                </button>
                <button type="button" className="cz-btn sec" disabled={guardando} onClick={() => setModo("rechazada")}>
                  Descartar
                </button>
              </>
            ) : (
              <>
                <button type="button" className="cz-btn" disabled={guardando} onClick={() => decidir(modo)}>
                  {modo === "cambios" ? "Mandar a corregir" : "Descartar con motivo"}
                </button>
                <button type="button" className="cz-btn sec" disabled={guardando} onClick={() => setModo(null)}>
                  Volver
                </button>
              </>
            )}
          </div>
          {error && <p className="cz-err">{error}</p>}
        </div>
      )}
    </li>
  );
}
