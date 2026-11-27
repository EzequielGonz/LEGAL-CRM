"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_PEDIDO, pareceDatoPersonal } from "@/lib/bandeja-claude";
import { OficinaVisual, type ResultadoEnvio } from "@/components/cerebro/oficina-visual";
import { SELECTOR_INICIAL, SelectorAlcance, type EstadoSelector } from "@/components/oficina/selector-alcance";
import { TableroTareas } from "@/components/oficina/tablero-tareas";
import { TarjetaTarea } from "@/components/oficina/tarea-oficina";
import { pedidoParaAgente } from "@/lib/oficina/recorrido";
import { ORDEN_SECTORES, SECTORES } from "@/lib/oficina/sectores";
import { alcanceDeSelector } from "@/lib/oficina/alcance-ui";
import { CANDIDATOS_POR_DEFECTO, MAX_CANDIDATOS_OFICINA } from "@/lib/oficina/ejecucion";
import { NOMBRE_AREA, TEXTO_SIN_CLAUDE, esParaRepasar, etapaDe, type Area, type TareaOficina } from "@/lib/oficina/reglas";
import { puedeGemini } from "@/lib/oficina/clases";

/**
 * La Oficina (22/11; 27/11 alcance, Gemini por botón y arena): escritorios de
 * agentes por área. El dueño deja una tarea con su alcance (un rubro, varios,
 * los 4 juntos o por separado, o todo el panel), Gemini la ordena al instante,
 * «Arrancar ahora» despierta a los agentes de Claude (si el disparo está
 * conectado; si no, lo dice), y cada tarea se puede pasar a Gemini con «Que
 * lo haga Gemini» (varias respuestas compiten y un juez elige). Lo de Gemini
 * no se aprueba hasta que Claude lo repase. Hasta borrador: nada se publica
 * sin ese OK.
 */

export interface GeminiVista {
  mesUsd: number;
  mensualUsd: number;
  porcentaje: number;
  estado: string;
}

export interface ArranqueVista {
  pedido_at: string;
  estado: string;
  nota: string | null;
  tareas: number | null;
  terminado_at: string | null;
}

const TEXTO_ARRANQUE: Record<string, string> = {
  pedido: "Arranque pedido",
  disparado: "Los agentes arrancaron",
  tomado: "Trabajando",
  terminado: "Terminaron la vuelta",
  sin_disparador: TEXTO_SIN_CLAUDE,
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

export function Oficina({
  inicial,
  arranqueInicial,
  sector = null,
  disparoInicial = null,
  geminiInicial = null,
}: {
  inicial: TareaOficina[];
  arranqueInicial: ArranqueVista | null;
  sector?: Area | null;
  disparoInicial?: { conectado: boolean } | null;
  geminiInicial?: GeminiVista | null;
}) {
  const [tareas, setTareas] = useState(inicial);
  const [arranque, setArranque] = useState(arranqueInicial);
  const [disparo, setDisparo] = useState(disparoInicial);
  const [gemini, setGemini] = useState(geminiInicial);
  const [selector, setSelector] = useState<EstadoSelector>(SELECTOR_INICIAL);
  const [candidatos, setCandidatos] = useState<number>(CANDIDATOS_POR_DEFECTO);
  const alcance = alcanceDeSelector(selector.opcion, selector.marcados, selector.modo);
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
    if (d?.disparo) setDisparo(d.disparo);
    if (d && "gemini" in d) setGemini(d.gemini);
  }, []);

  const hayMovimiento = tareas.some((t) => t.estado === "en_curso") || arranque?.estado === "disparado" || arranque?.estado === "tomado";
  useEffect(() => {
    if (!hayMovimiento) return;
    const id = setInterval(recargar, 20000);
    return () => clearInterval(id);
  }, [hayMovimiento, recargar]);

  // «hace 5 min» depende de la hora: se dibuja recién en el cliente para que no difiera del servidor.
  const [montado, setMontado] = useState(false);
  const [ahora, setAhora] = useState<Date | null>(null);
  useEffect(() => {
    setMontado(true);
    setAhora(new Date());
    const id = setInterval(() => setAhora(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  const formulario = useRef<HTMLFormElement>(null);
  // Departamento elegido a mano; vacío = el de la sala abierta (o el Cerebro reparte).
  const [depto, setDepto] = useState<Area | "">("");
  const esperando = tareas.filter((t) => etapaDe(t) === "esperando_ok");
  const aprobadas = tareas.filter((t) => etapaDe(t) === "aprobada").slice(0, 5);
  const enEntrada = tareas.filter((t) => t.estado === "pendiente" || t.estado === "en_espera").length;
  const paraRepasar = tareas.filter((t) => esParaRepasar(t) && t.estado === "lista").length;

  async function dejarTarea(e: React.FormEvent, sala: Area | null) {
    e.preventDefault();
    setAviso(null);
    if (!texto.trim()) return setAviso({ tipo: "err", texto: "Escribí la tarea para la oficina." });
    if (pareceDatoPersonal(texto)) return setAviso({ tipo: "err", texto: "Sacá teléfonos, documentos o correos: la oficina no guarda datos personales." });
    if (!alcance) return setAviso({ tipo: "err", texto: "Marcá al menos un rubro." });
    setEnviando(true);
    try {
      const r = await fetch("/api/oficina", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ alcance, pedido: texto, departamento: sala && sala !== "direccion" ? sala : undefined, candidatos }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error || "No se pudo guardar la tarea.");
      const ruta: Area[] = d?.tarea?.ruta ?? [];
      const cuantas = Array.isArray(d?.tareas) ? d.tareas.length : 1;
      const siguiente = disparo?.conectado ? "Tocá «Arrancar ahora» para Claude o «Que lo haga Gemini» en la tarea." : "Claude todavía no está conectado: usá «Que lo haga Gemini» en la tarea o escribí «oficina» en un chat de Claude del proyecto.";
      setAviso({
        tipo: "ok",
        texto: d?.rapida
          ? "Quedó en la mesa de entrada. Ojo: parece una consulta rápida, Jarvis te la contesta al instante."
          : `${cuantas > 1 ? `Quedaron ${cuantas} tareas (una por rubro) en la mesa de entrada` : "Quedó en la mesa de entrada"}. Ruta: ${ruta.map((a) => NOMBRE_AREA[a]).join(" → ")}. ${siguiente}`,
      });
      setTexto("");
      await recargar();
    } catch (err) {
      setAviso({ tipo: "err", texto: err instanceof Error ? err.message : "No se pudo guardar la tarea." });
    } finally {
      setEnviando(false);
    }
  }

  /** Sin disparo de Claude: Gemini resuelve, de a una, las tareas de la mesa de entrada que puede hacer. */
  async function arrancarConGemini() {
    const entrada = tareas.filter((t) => t.estado === "pendiente" || t.estado === "en_espera");
    const aptas = entrada.filter((t) => puedeGemini(t.clase).ok);
    const soloClaude = entrada.length - aptas.length;
    if (!aptas.length) {
      setAviso({ tipo: "err", texto: soloClaude ? `Claude no está conectado y ${soloClaude === 1 ? "la tarea que espera es" : "las tareas que esperan son"} de código, publicación o envío: esas no las hace Gemini. Quedan en la mesa de entrada.` : TEXTO_SIN_CLAUDE });
      return;
    }
    let hechas = 0;
    let ultimoError = "";
    for (const [i, t] of aptas.entries()) {
      setAviso({ tipo: "ok", texto: `Claude no está conectado: Gemini está resolviendo la tarea ${i + 1} de ${aptas.length} (varias respuestas y un juez). Puede tardar unos minutos.` });
      try {
        const g = await fetch(`/api/oficina/${t.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accion: "gemini" }) });
        const gd = await g.json().catch(() => ({}));
        if (g.ok) hechas++;
        else ultimoError = gd?.error || "Gemini no pudo con una tarea.";
      } catch {
        ultimoError = "Se cortó la conexión con Gemini.";
      }
      await recargar();
    }
    const resto = soloClaude ? ` ${soloClaude} ${soloClaude === 1 ? "queda" : "quedan"} para Claude (código, publicación o envío).` : "";
    if (hechas) setAviso({ tipo: "ok", texto: `Gemini resolvió ${hechas} de ${aptas.length}. ${hechas === 1 ? "Queda" : "Quedan"} «Hecho por Gemini · sin repasar».${ultimoError ? ` ${ultimoError}` : ""}${resto}` });
    else setAviso({ tipo: "err", texto: `${ultimoError || "Gemini no pudo resolver las tareas."}${resto}` });
  }

  async function arrancar() {
    setAviso(null);
    setArrancando(true);
    try {
      const r = await fetch("/api/oficina/arrancar", { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (d?.arranque) setArranque(d.arranque);
      if (d?.disparo) setDisparo(d.disparo);
      if (r.status === 503 || r.status === 502) {
        // Orden del dueño (27/11): si él pide arrancar y Claude no tiene disparo, lo resuelve Gemini.
        await arrancarConGemini();
      } else if (!r.ok) {
        throw new Error(d?.error || "No se pudo arrancar.");
      } else {
        setAviso({ tipo: "ok", texto: "Claude recibió el aviso. Vas a ver cada escritorio trabajando acá." });
      }
    } catch (err) {
      setAviso({ tipo: "err", texto: err instanceof Error ? err.message : "No se pudo arrancar." });
    } finally {
      setArrancando(false);
    }
  }

  const trabajando = tareas.filter((t) => t.estado === "en_curso").length;

  // Chat con un agente: el pedido va por el mismo canal de la Oficina (mesa de entrada), dirigido a su sector.
  async function mandarAAgente(area: Area, nombre: string, pedidoTexto: string): Promise<ResultadoEnvio> {
    if (pareceDatoPersonal(pedidoTexto)) return { ok: false, texto: "Sacá teléfonos, documentos o correos: la oficina no guarda datos personales." };
    const pedido = pedidoParaAgente(area, nombre, pedidoTexto).slice(0, MAX_PEDIDO);
    if (!pedido) return { ok: false, texto: "Escribí el pedido." };
    try {
      if (!alcance) throw new Error("Elegí el alcance en «Nueva tarea» (marcá al menos un rubro).");
      const r = await fetch("/api/oficina", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ alcance, pedido, departamento: area !== "direccion" ? area : undefined, candidatos }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error || "No se pudo mandar.");
      await recargar();
      return { ok: true, texto: d?.rapida ? "Anotado en la mesa de entrada. Parece una consulta rápida: Jarvis te la contesta al instante." : "Anotado en la mesa de entrada. Lo trabajo cuando toques «Arrancar ahora» o «Que lo haga Gemini»." };
    } catch (err) {
      return { ok: false, texto: err instanceof Error ? err.message : "No se pudo mandar." };
    }
  }

  // El formulario vive en el panel lateral del edificio; recibe la sala abierta para dirigir la tarea a ese sector.
  function formularioDeTarea(sala: Area | null) {
    return (
      <form id="oficina-tarea" ref={formulario} onSubmit={(e) => dejarTarea(e, depto || sala)} className="cz-form" aria-label="Dejar una tarea en la oficina">
        <SelectorAlcance valor={selector} alCambiar={setSelector} />
        <label>
          Departamento
          <select value={depto || sala || ""} onChange={(e) => setDepto((e.target.value || "") as Area | "")}>
            <option value="">El Cerebro decide a quién</option>
            {ORDEN_SECTORES.map((a) => (
              <option key={a} value={a}>
                {SECTORES[a].titulo}
              </option>
            ))}
          </select>
        </label>
        <label>
          {(depto || sala) && (depto || sala) !== "direccion" ? `Tarea para ${NOMBRE_AREA[(depto || sala) as Area]}` : "Tarea para la oficina"}
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={4}
            maxLength={MAX_PEDIDO}
            placeholder="Ej.: Analizá qué reels de VITA funcionaron este mes y armá la estrategia de la semana que viene con 5 guiones."
          />
        </label>
        <label className="of3-numero">
          Respuestas que compiten (arena)
          <input type="number" min={1} max={MAX_CANDIDATOS_OFICINA} value={candidatos} onChange={(e) => setCandidatos(Math.max(1, Math.min(MAX_CANDIDATOS_OFICINA, Number(e.target.value) || 1)))} />
        </label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button className="cz-btn of3-neu" type="submit" disabled={enviando || !alcance}>
            {enviando ? "Ordenando…" : "Dejar en la oficina"}
          </button>
          <small className="cz-muted">Gemini la ordena al instante. La trabaja Claude cuando arranques, o Gemini si tocás «Que lo haga Gemini» en la tarea (hasta {MAX_CANDIDATOS_OFICINA} respuestas compiten, si el presupuesto alcanza).</small>
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
        renderEnMarcha={(t) => <TarjetaTarea key={t.id} t={t} todas={tareas} ahora={ahora} alCambiar={recargar} />}
        renderAprobar={(t) => <TarjetaTarea key={t.id} t={t} todas={tareas} ahora={ahora} alCambiar={recargar} />}
        renderFormulario={formularioDeTarea}
        alMandarAAgente={mandarAAgente}
      />

      <div className="cz-of-barra">
        <div>
          <strong>{enEntrada}</strong> en la mesa de entrada · <strong>{trabajando}</strong> trabajando · <strong>{paraRepasar}</strong> para repasar · <strong>{esperando.length - paraRepasar}</strong> esperando tu OK
          <small>
            Claude: {disparo?.conectado ? "conectado" : "sin conectar"}
            {gemini ? ` · Gemini: USD ${gemini.mesUsd.toFixed(2)} de ${gemini.mensualUsd} este mes (${gemini.porcentaje} %${gemini.estado === "aviso" ? ", pasó el 80 %" : gemini.estado === "tope_mes" ? ", tope alcanzado" : ""})` : ""}
          </small>
          {disparo && !disparo.conectado && (
            <small className="cz-err" role="status">
              {TEXTO_SIN_CLAUDE} Mientras tanto podés usar «Que lo haga Gemini» en cada tarea, o escribir «oficina» en un chat de Claude del proyecto.
            </small>
          )}
          {arranque && (
            <small>
              Último arranque: {TEXTO_ARRANQUE[arranque.estado] ?? arranque.estado}
              {montado ? ` · ${hace(arranque.pedido_at)}` : ""}
            </small>
          )}
          {aprobadas.length > 0 && <small>Aprobadas hace poco: {aprobadas.map((t) => t.titulo).join(" · ")}</small>}
        </div>
        <div className="cz-of-botones">
          <button type="button" className="cz-btn sec of3-neu sec" onClick={() => window.dispatchEvent(new Event("oficina:tarea"))}>
            Dejar una tarea
          </button>
          <button type="button" className="cz-btn cz-of-arrancar of3-neu" onClick={arrancar} disabled={arrancando || enEntrada + paraRepasar === 0} title={disparo && !disparo.conectado ? TEXTO_SIN_CLAUDE : undefined}>
            <span className="pulso" aria-hidden="true" />
            {arrancando ? "Arrancando…" : "Arrancar ahora"}
          </button>
        </div>
      </div>
      <TableroTareas tareas={tareas} ahora={ahora} alCambiar={recargar} />
    </div>
  );
}

