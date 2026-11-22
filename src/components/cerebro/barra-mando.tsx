"use client";

import Link from "next/link";
import { useId, useRef, useState, type FormEvent } from "react";
import { PedirAJarvis } from "@/components/resumen/pedir-a-jarvis";
import { pareceDatoPersonal } from "@/lib/bandeja-claude";
import { NOMBRE_TIPO, TIPOS_CONOCIMIENTO, validarEntrada, type TipoConocimiento } from "@/lib/cerebro/conocimiento";
import { pedidoOrden } from "@/lib/cerebro/anillo";
import { CIERRE_CONFIRMAR } from "@/lib/resumen/pedidos";
import { NOMBRE_AREA, type Area } from "@/lib/oficina/reglas";
import { pedidoParaSector } from "@/lib/oficina/panel";
import { ORDEN_SECTORES, SECTORES } from "@/lib/oficina/sectores";

/**
 * La barra para hablarle al cerebro (vuelta 6): tres modos claros, en botones en relieve que «salen
 * de la pantalla» y se hunden al elegirlos.
 * - Preguntale: busca en la memoria y en lo aprendido; la respuesta aparece acá mismo, con su fuente.
 * - Enseñale: guarda una nota o regla en la memoria del cerebro, con confirmación.
 * - Ordenale: crea el pedido y lo reparte a la Oficina (Gemini lo ordena por escritorios), con
 *   confirmación; después se puede arrancar a los agentes (otra confirmación) o pasárselo a Jarvis.
 * Lo que escribe pide confirmación siempre. Sin datos de personas.
 */

export type Modo = "preguntar" | "ensenar" | "ordenar";

const MODOS: { id: Modo; nombre: string; ayuda: string; ejemplo: string; color: string }[] = [
  { id: "preguntar", nombre: "Preguntale", ayuda: "Busca en toda la memoria y te dice de dónde sale", ejemplo: "¿Cada cuánto sale el recontacto?", color: "#7c6cff" },
  { id: "ensenar", nombre: "Enseñale", ayuda: "Guarda una nota o una regla, con tu confirmación", ejemplo: "Los domingos Coberturas no envía mensajes.", color: "#ff5c9a" },
  { id: "ordenar", nombre: "Ordenale", ayuda: "Crea el pedido y lo reparte a la Oficina, con tu confirmación", ejemplo: "Armá el plan de reels de la semana para Autos 0 km.", color: "#f2b600" },
];

const PERFILES = [
  { slug: "juridico", nombre: "VITA (Jurídico)" },
  { slug: "marketing", nombre: "Kocos Marketing" },
  { slug: "coberturas_medicas", nombre: "Coberturas médicas" },
  { slug: "agencia_0km", nombre: "Autos 0 km" },
] as const;

type Respuesta = { fuente: string; titulo: string; texto: string };
type Resultado =
  | { tipo: "respuestas"; pregunta: string; items: Respuesta[] }
  | { tipo: "confirmar-ensenar" }
  | { tipo: "ensenado"; titulo: string }
  | { tipo: "confirmar-orden"; pedido: string }
  | { tipo: "ordenado"; titulo: string; ruta: Area[]; plan: string | null; ordenadaPor: string }
  | { tipo: "confirmar-arranque" }
  | { tipo: "arrancado"; nota: string };

async function api<T = any>(url: string, cuerpo?: unknown): Promise<T> {
  const r = await fetch(url, { method: "POST", cache: "no-store", headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo ?? {}) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error ?? "No se pudo completar. Probá de nuevo.");
  return j as T;
}

function Icono({ modo }: { modo: Modo }) {
  if (modo === "preguntar")
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
        <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  if (modo === "ensenar")
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
        <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z" fill="currentColor" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path d="M7 4.8v14.4a.8.8 0 0 0 1.2.7l11.4-7.2a.8.8 0 0 0 0-1.4L8.2 4.1A.8.8 0 0 0 7 4.8Z" fill="currentColor" />
    </svg>
  );
}

export function BarraMando({ alPensar }: { alPensar: (pensando: boolean) => void }) {
  const [modo, setModo] = useState<Modo>("preguntar");
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<Resultado | null>(null);
  // Enseñale
  const [tipo, setTipo] = useState<TipoConocimiento>("nota");
  const [titulo, setTitulo] = useState("");
  const [fuente, setFuente] = useState("");
  const [perfil, setPerfil] = useState("");
  // Ordenale
  const [perfilOrden, setPerfilOrden] = useState<string>("juridico");
  const [deptoOrden, setDeptoOrden] = useState<Area | "">("");
  const campo = useRef<HTMLTextAreaElement>(null);
  const idAyuda = useId();
  const actual = MODOS.find((m) => m.id === modo)!;

  function elegir(m: Modo) {
    setModo(m);
    setError(null);
    setRes(null);
    campo.current?.focus();
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (cargando) return;
    const t = texto.trim();
    setError(null);
    if (modo !== "preguntar" && pareceDatoPersonal(t)) return setError("Sacá teléfonos, documentos o correos: el cerebro no guarda datos de personas.");
    if (modo === "preguntar") {
      if (t.length < 3) return setError("Escribí una pregunta (al menos 3 letras).");
      setCargando(true);
      alPensar(true);
      try {
        const j = await api<{ respuestas: Respuesta[] }>("/api/cerebro/preguntar", { pregunta: t });
        setRes({ tipo: "respuestas", pregunta: t, items: j.respuestas });
      } catch (er) {
        setError((er as Error).message);
      } finally {
        setCargando(false);
        alPensar(false);
      }
      return;
    }
    if (modo === "ensenar") {
      const tit = titulo.trim() || t.split(/[.!?\n]/)[0].slice(0, 80);
      const v = validarEntrada({ tipo, titulo: tit, contenido: t, fuente });
      if (!v.ok) return setError(v.error);
      setTitulo(tit);
      setRes({ tipo: "confirmar-ensenar" });
      return;
    }
    const o = pedidoOrden(t);
    if (!o.ok) return setError(o.error);
    setRes({ tipo: "confirmar-orden", pedido: o.pedido });
  }

  async function guardarEnsenanza() {
    setCargando(true);
    alPensar(true);
    setError(null);
    try {
      await api("/api/cerebro/conocimiento", { tipo, titulo: titulo.trim(), contenido: texto.trim(), fuente: fuente.trim(), perfil: perfil || undefined });
      setRes({ tipo: "ensenado", titulo: titulo.trim() });
      setTexto("");
      setTitulo("");
      setFuente("");
    } catch (er) {
      setError((er as Error).message);
    } finally {
      setCargando(false);
      alPensar(false);
    }
  }

  async function mandarOrden(pedido: string) {
    setCargando(true);
    alPensar(true);
    setError(null);
    try {
      const j = await api<{ tarea: { titulo: string; ruta: Area[] } | null; plan: string | null; ordenadaPor: string }>("/api/oficina", { perfil: perfilOrden, pedido: pedidoParaSector(deptoOrden || null, pedido) });
      setRes({ tipo: "ordenado", titulo: j.tarea?.titulo ?? "Pedido nuevo", ruta: j.tarea?.ruta ?? [], plan: j.plan, ordenadaPor: j.ordenadaPor });
      setTexto("");
    } catch (er) {
      setError((er as Error).message);
    } finally {
      setCargando(false);
      alPensar(false);
    }
  }

  async function arrancar() {
    setCargando(true);
    alPensar(true);
    setError(null);
    try {
      const j = await api<{ arranque: { nota?: string; estado?: string } }>("/api/oficina/arrancar", {});
      setRes({ tipo: "arrancado", nota: j.arranque?.nota || "Los agentes ya arrancaron. Mirá cómo avanzan en la Oficina." });
    } catch (er) {
      setError((er as Error).message);
    } finally {
      setCargando(false);
      alPensar(false);
    }
  }

  const listo = texto.trim().length >= 3;

  return (
    <div className="cz-mando" data-modo={modo}>
      <div className="cz-modos" role="radiogroup" aria-label="Qué querés hacer con el cerebro">
        {MODOS.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={modo === m.id}
            className="cz-neu"
            style={{ ["--ic" as string]: m.color }}
            onClick={() => elegir(m.id)}
            onKeyDown={(e) => {
              const paso = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
              if (!paso) return;
              e.preventDefault();
              const i = (MODOS.findIndex((x) => x.id === modo) + paso + MODOS.length) % MODOS.length;
              elegir(MODOS[i].id);
              (e.currentTarget.parentElement?.children[i] as HTMLElement | undefined)?.focus();
            }}
            tabIndex={modo === m.id ? 0 : -1}
          >
            <span className="cz-neu__ic">
              <Icono modo={m.id} />
            </span>
            <span className="cz-neu__tx">{m.nombre}</span>
          </button>
        ))}
      </div>

      <form className="cz-mando__form" onSubmit={enviar} aria-label={`${actual.nombre} al cerebro`}>
        <label htmlFor="cz-mando-q" className="cz-sr">
          {actual.nombre}: {actual.ayuda}
        </label>
        <textarea
          id="cz-mando-q"
          ref={campo}
          rows={1}
          value={texto}
          maxLength={modo === "preguntar" ? 300 : modo === "ensenar" ? 4000 : 1500}
          onChange={(e) => {
            setTexto(e.target.value);
            if (res && (res.tipo === "confirmar-ensenar" || res.tipo === "confirmar-orden")) setRes(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder={`${actual.nombre}… Ej.: ${actual.ejemplo}`}
          aria-describedby={idAyuda}
          autoComplete="off"
          data-escribiendo={texto ? "1" : "0"}
        />
        <button type="submit" className="cz-neu cz-neu--ir" style={{ ["--ic" as string]: actual.color }} disabled={cargando || !listo} aria-label={modo === "preguntar" ? "Preguntar" : modo === "ensenar" ? "Revisar lo que va a aprender" : "Revisar la orden"}>
          {cargando ? <span className="cz-giro" aria-hidden="true" /> : <Icono modo="ordenar" />}
        </button>
      </form>
      <p id={idAyuda} className="cz-mando__ayuda">
        <b>{actual.nombre}:</b> {actual.ayuda}. <span className="cz-mando__tecla">Enter</span> para seguir.
      </p>

      <div className="cz-resp-zona" aria-live="polite">
        {error && <p className="cz-err cz-aparece">{error}</p>}

        {res?.tipo === "respuestas" &&
          (res.items.length === 0 ? (
            <div className="cz-resp-caja cz-aparece">
              <p>
                No encontré nada sobre «{res.pregunta}». Probá con otras palabras o <button type="button" className="cz-link" onClick={() => elegir("ensenar")}>enseñáselo</button>.
              </p>
            </div>
          ) : (
            <div className="cz-resp-caja cz-aparece">
              <p className="cz-resp-cab">
                Encontré {res.items.length === 1 ? "1 respuesta" : `${res.items.length} respuestas`} sobre <em>«{res.pregunta}»</em>
              </p>
              <ol className="cz-fuentes">
                {res.items.map((r, i) => (
                  <li key={i} style={{ ["--i" as string]: i }}>
                    <span className="cz-fuente-chip">Fuente · {r.fuente}</span>
                    <b>{r.titulo}</b>
                    <p>{r.texto}</p>
                  </li>
                ))}
              </ol>
              <div className="cz-resp-acc">
                <PedirAJarvis pedido={`Explicame en simple lo que dice el cerebro sobre: ${res.pregunta}`} className="cz-btn sec chico">
                  Que Jarvis me lo explique
                </PedirAJarvis>
                <button type="button" className="cz-btn sec chico" onClick={() => setRes(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          ))}

        {res?.tipo === "confirmar-ensenar" && (
          <div className="cz-resp-caja cz-aparece" role="group" aria-label="Confirmar lo que aprende">
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
                  <option value="">Todos los rubros</option>
                  {PERFILES.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="cz-ens-fila">
              <label>
                Título corto
                <input value={titulo} maxLength={120} onChange={(e) => setTitulo(e.target.value)} />
              </label>
              <label>
                De dónde sale (opcional)
                <input value={fuente} maxLength={500} onChange={(e) => setFuente(e.target.value)} placeholder="«lo dijo el dueño el 22/11»" />
              </label>
            </div>
            <p>
              Se guarda en la memoria del cerebro: <b>{titulo || "sin título"}</b>. Desde ahora Jarvis y la búsqueda lo usan. ¿Lo guardo?
            </p>
            <div className="cz-resp-acc">
              <button type="button" className="cz-btn" disabled={cargando || !titulo.trim()} onClick={guardarEnsenanza}>
                {cargando ? "Guardando…" : "Sí, guardar"}
              </button>
              <button type="button" className="cz-btn sec" disabled={cargando} onClick={() => setRes(null)}>
                No, volver
              </button>
            </div>
          </div>
        )}
        {res?.tipo === "ensenado" && (
          <div className="cz-resp-caja cz-resp-caja--ok cz-aparece">
            <p>
              Listo: el cerebro ya sabe <b>«{res.titulo}»</b>. Lo ves en la pantalla «Lo aprendido» y Jarvis lo usa desde ahora.
            </p>
          </div>
        )}

        {res?.tipo === "confirmar-orden" && (
          <div className="cz-resp-caja cz-aparece" role="group" aria-label="Confirmar la orden">
            <label className="cz-inline">
              Para qué rubro
              <select value={perfilOrden} onChange={(e) => setPerfilOrden(e.target.value)}>
                {PERFILES.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="cz-inline">
              Para qué departamento
              <select value={deptoOrden} onChange={(e) => setDeptoOrden((e.target.value || "") as Area | "")}>
                <option value="">El Cerebro reparte</option>
                {ORDEN_SECTORES.filter((a) => a !== "direccion").map((a) => (
                  <option key={a} value={a}>
                    {SECTORES[a].titulo}
                  </option>
                ))}
              </select>
            </label>
            <p>
              Va a la <b>Oficina</b>: Gemini la ordena por escritorios y queda en la mesa de entrada. Nadie arranca hasta que toques «Arrancar ahora». El resultado vuelve como borrador para tu OK. ¿La mando?
            </p>
            <div className="cz-resp-acc">
              <button type="button" className="cz-btn" disabled={cargando} onClick={() => mandarOrden(res.pedido)}>
                {cargando ? "Mandando…" : "Sí, mandar a la Oficina"}
              </button>
              <PedirAJarvis pedido={`${texto.trim()} ${CIERRE_CONFIRMAR}`} className="cz-btn sec">
                Mejor que lo haga Jarvis
              </PedirAJarvis>
              <button type="button" className="cz-btn sec" disabled={cargando} onClick={() => setRes(null)}>
                Volver
              </button>
            </div>
          </div>
        )}
        {res?.tipo === "ordenado" && (
          <div className="cz-resp-caja cz-resp-caja--ok cz-aparece">
            <p>
              Listo: <b>{res.titulo}</b> quedó en la mesa de entrada de la Oficina{res.ordenadaPor === "gemini" ? ", ordenada por Gemini" : ""}.
            </p>
            {res.ruta.length > 0 && (
              <ol className="cz-ruta" aria-label="Recorrido por los escritorios">
                {res.ruta.map((a, i) => (
                  <li key={`${a}-${i}`} style={{ ["--i" as string]: i }}>
                    {NOMBRE_AREA[a] ?? a}
                  </li>
                ))}
              </ol>
            )}
            {res.plan && <p className="cz-muted">{res.plan}</p>}
            <div className="cz-resp-acc">
              <button type="button" className="cz-btn" onClick={() => setRes({ tipo: "confirmar-arranque" })}>
                Arrancar ahora
              </button>
              <Link href="/oficina" prefetch={false} className="cz-btn sec">
                Ver en la Oficina
              </Link>
            </div>
          </div>
        )}
        {res?.tipo === "confirmar-arranque" && (
          <div className="cz-resp-caja cz-aparece" role="group" aria-label="Confirmar el arranque">
            <p>Despierto a los agentes para que trabajen todo lo que está en la mesa de entrada. Cada vuelta usa el plan de Claude y no se repite en menos de 15 minutos. ¿Arranco?</p>
            <div className="cz-resp-acc">
              <button type="button" className="cz-btn" disabled={cargando} onClick={arrancar}>
                {cargando ? "Arrancando…" : "Sí, arrancar"}
              </button>
              <button type="button" className="cz-btn sec" disabled={cargando} onClick={() => setRes(null)}>
                Todavía no
              </button>
            </div>
          </div>
        )}
        {res?.tipo === "arrancado" && (
          <div className="cz-resp-caja cz-resp-caja--ok cz-aparece">
            <p>{res.nota}</p>
            <Link href="/oficina" prefetch={false} className="cz-btn sec chico">
              Mirar la Oficina
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
