"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_PEDIDO, pareceDatoPersonal } from "@/lib/bandeja-claude";
import { OficinaVisual } from "@/components/cerebro/oficina-visual";
import { pedidoParaSector } from "@/lib/oficina/panel";
import {
  ETIQUETA_ETAPA,
  NOMBRE_AREA,
  escritorioActual,
  etapaDe,
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

export function Oficina({ inicial, arranqueInicial, sector = null }: { inicial: TareaOficina[]; arranqueInicial: ArranqueVista | null; sector?: Area | null }) {
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

  // «hace 5 min» depende de la hora: se dibuja recién en el cliente para que no difiera del servidor.
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  const formulario = useRef<HTMLFormElement>(null);
  const esperando = tareas.filter((t) => etapaDe(t) === "esperando_ok");
  const aprobadas = tareas.filter((t) => etapaDe(t) === "aprobada").slice(0, 5);
  const enEntrada = tareas.filter((t) => t.estado === "pendiente" || t.estado === "en_espera").length;

  async function dejarTarea(e: React.FormEvent, sala: Area | null) {
    e.preventDefault();
    setAviso(null);
    if (!texto.trim()) return setAviso({ tipo: "err", texto: "Escribí la tarea para la oficina." });
    if (pareceDatoPersonal(texto)) return setAviso({ tipo: "err", texto: "Sacá teléfonos, documentos o correos: la oficina no guarda datos personales." });
    setEnviando(true);
    try {
      const r = await fetch("/api/oficina", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ perfil, pedido: pedidoParaSector(sala, texto) }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error || "No se pudo guardar la tarea.");
      const ruta: Area[] = d?.tarea?.ruta ?? [];
      setAviso({
        tipo: "ok",
        texto: d?.rapida
          ? "Quedó en la mesa de entrada. Ojo: parece una consulta rápida, Jarvis (/asistente) te la contesta al instante."
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

  const trabajando = tareas.filter((t) => t.estado === "en_curso").length;

  // El formulario vive en el panel lateral del edificio; recibe la sala abierta para dirigir la tarea a ese sector.
  function formularioDeTarea(sala: Area | null) {
    return (
      <form id="oficina-tarea" ref={formulario} onSubmit={(e) => dejarTarea(e, sala)} className="cz-form" aria-label="Dejar una tarea en la oficina">
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
          {sala && sala !== "direccion" ? `Tarea para ${NOMBRE_AREA[sala]}` : "Tarea para la oficina"}
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
    );
  }

  return (
    <div className="cz-of">
      <OficinaVisual
        sector={sector}
        tareas={tareas}
        renderEnMarcha={(t) => <TareaEnMarcha key={t.id} t={t} />}
        renderAprobar={(t) => <TareaParaAprobar key={t.id} t={t} alDecidir={recargar} />}
        renderFormulario={formularioDeTarea}
      />

      <div className="cz-of-barra">
        <div>
          <strong>{enEntrada}</strong> en la mesa de entrada · <strong>{trabajando}</strong> trabajando · <strong>{esperando.length}</strong> esperando tu OK
          {arranque && (
            <small>
              Último arranque: {TEXTO_ARRANQUE[arranque.estado] ?? arranque.estado}
              {montado ? ` · ${hace(arranque.pedido_at)}` : ""}
            </small>
          )}
          {aprobadas.length > 0 && <small>Aprobadas hace poco: {aprobadas.map((t) => t.titulo).join(" · ")}</small>}
        </div>
        <div className="cz-of-botones">
          <button type="button" className="cz-btn sec" onClick={() => window.dispatchEvent(new Event("oficina:tarea"))}>
            Dejar una tarea
          </button>
          <button type="button" className="cz-btn cz-of-arrancar" onClick={arrancar} disabled={arrancando || enEntrada === 0}>
            <span className="pulso" aria-hidden="true" />
            {arrancando ? "Arrancando…" : "Arrancar ahora"}
          </button>
        </div>
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

export function TareaEnMarcha({ t }: { t: TareaOficina }) {
  const etapa = etapaDe(t);
  return (
    <li>
      <div className="fila">
        <strong>{t.titulo}</strong>
        <span className={`cz-chip ${etapa === "trabada" ? "c-bad" : etapa === "trabajando" ? "c-warn" : "c-idk"}`}>{ETIQUETA_ETAPA[etapa]}</span>
      </div>
      {t.ruta.length > 0 && <Ruta t={t} />}
    </li>
  );
}

export function TareaParaAprobar({ t, alDecidir }: { t: TareaOficina; alDecidir: () => Promise<void> }) {
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
