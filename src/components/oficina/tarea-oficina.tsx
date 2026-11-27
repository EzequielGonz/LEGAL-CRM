"use client";

import { useState } from "react";
import { marcaDe } from "@/lib/marca";
import { etiquetaDeTarea, perfilDeRubroId } from "@/lib/bandeja-claude";
import { ETIQUETA_CLASE, puedeGemini } from "@/lib/oficina/clases";
import { CANDIDATOS_POR_DEFECTO, MAX_CANDIDATOS_OFICINA, puedeReclamarParaGemini } from "@/lib/oficina/ejecucion";
import {
  ETIQUETA_ETAPA,
  NOMBRE_AREA,
  avanceDeGrupo,
  avanceDeTarea,
  escritorioActual,
  esParaRepasar,
  esperaDeTarea,
  etapaDe,
  etiquetaEjecutor,
  puedeAprobar,
  type TareaOficina,
} from "@/lib/oficina/reglas";

/**
 * Una tarea de la Oficina (27/11): alcance, quién la hizo, avance, detalle
 * con el recorrido, el resultado y la arena (candidatos, puntajes y por qué
 * ganó), el botón «Que lo haga Gemini» y la decisión del dueño. Usa las
 * mismas clases del panel de la Oficina (cz-*): no es una pantalla nueva.
 */

const nombrePerfil = (s: ReturnType<typeof perfilDeRubroId>) => (s ? marcaDe(s).nombre : "Sin perfil");
const usd = (n: number) => `USD ${n.toFixed(n > 0 && n < 0.01 ? 4 : 2)}`;

export function Ruta({ t }: { t: TareaOficina }) {
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

export function ChipsDeTarea({ t, todas, ahora }: { t: TareaOficina; todas: TareaOficina[]; ahora: Date | null }) {
  const ejecutor = etiquetaEjecutor(t);
  const grupo = avanceDeGrupo(todas, t.grupo_id);
  const espera = ahora ? esperaDeTarea(t, ahora) : null;
  return (
    <div className="of3-chips">
      <span className="cz-chip c-idk">{etiquetaDeTarea(t, nombrePerfil)}</span>
      {ejecutor && <span className={`cz-chip ${esParaRepasar(t) ? "c-warn" : "c-ok"}`}>{ejecutor}</span>}
      {grupo && (
        <span className="cz-chip c-idk">
          {grupo.listas} de {grupo.total} rubros listos{grupo.trabadas ? ` · ${grupo.trabadas} trabadas` : ""}
        </span>
      )}
      {espera && <span className="cz-chip c-warn">{espera}</span>}
    </div>
  );
}

export function BarraAvance({ t }: { t: TareaOficina }) {
  const a = avanceDeTarea(t);
  if (!a.total) return null;
  return (
    <div className="of3-avance">
      <div className="of3-carga-barra" role="progressbar" aria-valuemin={0} aria-valuemax={a.total} aria-valuenow={a.hechos} aria-label="Avance de la tarea">
        <i style={{ width: `${a.porcentaje}%` }} />
      </div>
      <small className="cz-muted">
        {a.hechos} de {a.total} escritorios{a.ahora ? ` · ahora: ${a.ahora}` : ""}
      </small>
    </div>
  );
}

/** Resultado con sus enlaces (solo http/https, ya filtrados al leer). */
function Resultado({ t }: { t: TareaOficina }) {
  if (!t.resultado) return null;
  return (
    <div className="of3-bloque">
      <h5>Resultado</h5>
      <p className="resultado">{t.resultado}</p>
      {t.resultado_enlaces.length > 0 && (
        <ul className="of3-enlaces">
          {t.resultado_enlaces.map((e) => (
            <li key={e}>
              <a href={e} target="_blank" rel="noopener noreferrer nofollow">
                {e}
              </a>
            </li>
          ))}
        </ul>
      )}
      {t.repaso_nota && <p className="cz-muted">Repaso de Claude: {t.repaso_nota}</p>}
    </div>
  );
}

function Arena({ t }: { t: TareaOficina }) {
  const a = t.arena;
  if (!a || !a.candidatos.length) return null;
  const ranking = [...a.candidatos].sort((x, y) => (y.puntaje ?? -1) - (x.puntaje ?? -1));
  return (
    <div className="of3-bloque">
      <h5>
        Arena · {a.corridos} respuesta{a.corridos === 1 ? "" : "s"}
        {a.pedidos > a.corridos ? ` (se pidieron ${a.pedidos})` : ""} · {a.por === "claude" ? "Claude con subagentes" : "Gemini"}
      </h5>
      {a.ganadorId ? (
        <p>
          <b>Ganó {a.ganadorId}</b>
          {a.promedio !== null ? ` con ${a.promedio} de 10` : ""}. {a.porque}
        </p>
      ) : (
        <p className="cz-err">Sin ganador: Claude elige al repasar.</p>
      )}
      <ol className="of3-ranking">
        {ranking.map((c) => (
          <li key={c.id} className={c.id === a.ganadorId ? "gana" : ""}>
            <details>
              <summary>
                <b>{c.id}</b> · {c.error ? "no compitió" : c.puntaje !== null ? `${c.puntaje}/10` : "sin puntaje"} · <span className="cz-muted">{c.enfoque}</span>
              </summary>
              {c.error ? <p className="cz-err">{c.error}</p> : null}
              {c.porque && <p className="cz-muted">Juez: {c.porque}</p>}
              {c.texto && <p className="resultado">{c.texto}</p>}
            </details>
          </li>
        ))}
      </ol>
      <small className="cz-muted">
        Costo estimado: {usd(a.costoUsd)}
        {a.modelo ? ` · ${a.modelo}` : ""}
      </small>
    </div>
  );
}

function Pasos({ t }: { t: TareaOficina }) {
  if (!t.recorrido.length) return null;
  return (
    <div className="of3-bloque">
      <h5>Qué hizo cada escritorio</h5>
      <ul className="pasos">
        {t.recorrido.map((p, i) => (
          <li key={i}>
            <b>{p.area === "duenos" ? "Dueños" : NOMBRE_AREA[p.area]}</b> · {p.agente}
            {p.ejecutor ? ` (${p.ejecutor === "gemini" ? "Gemini" : "Claude"})` : ""}
            {p.nota && <span> — {p.nota}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** «Que lo haga Gemini»: solo por botón. Deshabilitado con motivo si no corresponde. */
export function BotonGemini({ t, alTerminar, ocupado, setOcupado }: { t: TareaOficina; alTerminar: () => Promise<void>; ocupado: boolean; setOcupado: (v: boolean) => void }) {
  const [n, setN] = useState<number>(t.arena_candidatos ?? CANDIDATOS_POR_DEFECTO);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null);
  const reclamo = puedeReclamarParaGemini(t);
  const permiso = puedeGemini(t.clase);
  if (!reclamo.ok && t.estado !== "pendiente" && t.estado !== "en_espera") return null;
  const motivo = !permiso.ok ? permiso.motivo : !reclamo.ok ? reclamo.motivo : null;

  async function correr() {
    setAviso(null);
    setOcupado(true);
    try {
      const r = await fetch(`/api/oficina/${t.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accion: "gemini", candidatos: n }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error || "Gemini no pudo hacerla.");
      setAviso({ tipo: "ok", texto: d?.aviso ? `Listo, con un aviso: ${d.aviso}` : "Listo: quedó «Hecho por Gemini · sin repasar». Claude la repasa antes de que la puedas aprobar." });
      await alTerminar();
    } catch (e) {
      setAviso({ tipo: "err", texto: e instanceof Error ? e.message : "Gemini no pudo hacerla." });
      await alTerminar();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="of3-bloque of3-gemini">
      <h5>Que lo haga Gemini</h5>
      {motivo ? (
        <p className="cz-muted">{motivo}</p>
      ) : (
        <>
          <label className="of3-numero">
            Respuestas que compiten
            <input type="number" min={1} max={MAX_CANDIDATOS_OFICINA} value={n} onChange={(e) => setN(Math.max(1, Math.min(MAX_CANDIDATOS_OFICINA, Number(e.target.value) || 1)))} />
          </label>
          <small className="cz-muted">
            Gemini arma {n} respuesta{n === 1 ? "" : "s"} con enfoques distintos y un juez elige la mejor. Solo borrador: no publica ni envía. Gasta del tope de USD 30 del mes (compartido con los bots); si no alcanza, corre menos.
          </small>
          <button type="button" className="cz-btn chico" disabled={ocupado} onClick={correr}>
            {ocupado ? "Gemini está trabajando…" : "Que lo haga Gemini"}
          </button>
        </>
      )}
      {aviso && (
        <p className={aviso.tipo === "ok" ? "cz-ok" : "cz-err"} role="status">
          {aviso.texto}
        </p>
      )}
    </div>
  );
}

/** Aprobar, pedir cambios o descartar. «Aprobar» queda bloqueado si falta el repaso de Claude. */
export function DecisionDueno({ t, alDecidir }: { t: TareaOficina; alDecidir: () => Promise<void> }) {
  const [nota, setNota] = useState("");
  const [modo, setModo] = useState<"cambios" | "rechazada" | null>(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  if (etapaDe(t) !== "esperando_ok") return null;
  const aprobar = puedeAprobar(t);

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
    <div className="of3-bloque">
      {modo && (
        <label className="nota">
          {modo === "cambios" ? "¿Qué cambiar?" : "¿Por qué la descartás?"}
          <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={3} maxLength={1000} />
        </label>
      )}
      <div className="acciones">
        {!modo ? (
          <>
            <button type="button" className="cz-btn" disabled={guardando || !aprobar.ok} onClick={() => decidir("aprobada")} aria-describedby={aprobar.ok ? undefined : `bloqueo-${t.id}`}>
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
      {!aprobar.ok && (
        <p id={`bloqueo-${t.id}`} className="cz-muted">
          {aprobar.motivo}
        </p>
      )}
      {error && <p className="cz-err">{error}</p>}
    </div>
  );
}

/**
 * Tarjeta de una tarea. `abrible` muestra «Ver detalle» con el pedido, el
 * plan, el recorrido, el resultado, la arena, el botón de Gemini y la
 * decisión.
 */
export function TarjetaTarea({ t, todas, ahora, alCambiar }: { t: TareaOficina; todas: TareaOficina[]; ahora: Date | null; alCambiar: () => Promise<void> }) {
  const [abierta, setAbierta] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const etapa = etapaDe(t);
  const chip = etapa === "trabada" ? "c-bad" : etapa === "trabajando" ? "c-warn" : etapa === "esperando_ok" || etapa === "aprobada" ? "c-ok" : "c-idk";
  const geminiCorriendo = ocupado || (t.estado === "en_curso" && t.ejecutor === "gemini");
  return (
    <li className={esParaRepasar(t) ? "of3-repasar" : undefined}>
      <div className="fila">
        <strong>{t.titulo}</strong>
        <span className={`cz-chip ${chip}`}>{geminiCorriendo ? "Gemini trabajando" : ETIQUETA_ETAPA[etapa]}</span>
      </div>
      <ChipsDeTarea t={t} todas={todas} ahora={ahora} />
      <BarraAvance t={t} />
      {t.estado === "en_espera" && t.motivo_espera && <p className="cz-err">Trabada: {t.motivo_espera}</p>}
      <button type="button" className="cz-btn sec chico" aria-expanded={abierta} onClick={() => setAbierta((v) => !v)}>
        {abierta ? "Cerrar detalle" : etapa === "esperando_ok" ? "Revisar" : "Ver detalle"}
      </button>
      {abierta && (
        <div className="detalle">
          <div className="of3-bloque">
            <h5>Pedido</h5>
            <p className="resultado">{t.pedido}</p>
            {t.triaje && <p className="cz-muted">Plan de la mesa de entrada: {t.triaje}</p>}
            <p className="cz-muted">
              {t.clase ? `Tipo de trabajo: ${ETIQUETA_CLASE[t.clase]}` : ""}
              {t.costo_usd > 0 ? ` · Gasto de Gemini: ${usd(t.costo_usd)}` : ""}
            </p>
          </div>
          {t.ruta.length > 0 && <Ruta t={t} />}
          <Pasos t={t} />
          <Resultado t={t} />
          <Arena t={t} />
          <BotonGemini t={t} alTerminar={alCambiar} ocupado={ocupado} setOcupado={setOcupado} />
          <DecisionDueno t={t} alDecidir={alCambiar} />
          {t.decision_nota && etapa !== "esperando_ok" && <p className="cz-muted">Nota de la decisión: {t.decision_nota}</p>}
        </div>
      )}
    </li>
  );
}
