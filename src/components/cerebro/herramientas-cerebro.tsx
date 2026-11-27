"use client";

import { useState } from "react";
import Link from "next/link";
import { MAX_PEDIDO, pareceDatoPersonal } from "@/lib/bandeja-claude";
import { TIPOS_ENSENANZA, coincideBusqueda, pedidoEnsenanza, type EntradaBusqueda, type TipoEnsenanza } from "@/lib/cerebro/contenido";

/**
 * Herramientas simples del Cerebro (22/11): enseñarle algo (queda como PROPUESTA en la Bandeja para
 * Claude, nunca se aplica sola), buscar en los textos de las secciones (todo en el navegador, sin
 * servidor) y accesos a Jarvis y al Laboratorio de bots. Lo único que escribe es «Dejar como propuesta».
 */

const PERFILES = [
  { slug: "juridico", nombre: "VITA (Jurídico)" },
  { slug: "marketing", nombre: "Kocos Marketing" },
  { slug: "coberturas_medicas", nombre: "Coberturas médicas" },
  { slug: "agencia_0km", nombre: "Autos 0 km" },
] as const;

export function EnsenarCerebro() {
  const [perfil, setPerfil] = useState<string>("juridico");
  const [tipo, setTipo] = useState<TipoEnsenanza>("nota");
  const [texto, setTexto] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const [estado, setEstado] = useState<"listo" | "enviando" | "ok" | "error">("listo");
  const [mensaje, setMensaje] = useState("");

  function revisar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) {
      setEstado("error");
      setMensaje("Escribí qué querés que aprenda el cerebro.");
      return;
    }
    if (pareceDatoPersonal(texto)) {
      setEstado("error");
      setMensaje("Sacá teléfonos, documentos o correos: el cerebro no guarda datos de personas.");
      return;
    }
    if (pedidoEnsenanza(texto, tipo).length > MAX_PEDIDO) {
      setEstado("error");
      setMensaje("Quedó muy largo: acortalo un poco.");
      return;
    }
    setEstado("listo");
    setMensaje("");
    setConfirmar(true);
  }

  async function enviar() {
    setEstado("enviando");
    try {
      const r = await fetch("/api/bandeja-claude", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ perfil, pedido: pedidoEnsenanza(texto, tipo) }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error || "No se pudo guardar la propuesta.");
      setEstado("ok");
      setMensaje("Listo: quedó como propuesta en la Bandeja para Claude. No se aplica nada hasta que la confirmes.");
      setTexto("");
      setConfirmar(false);
    } catch (err) {
      setEstado("error");
      setMensaje(err instanceof Error ? err.message : "No se pudo guardar la propuesta.");
      setConfirmar(false);
    }
  }

  return (
    <form onSubmit={revisar} className="cz-form" aria-label="Enseñale algo al cerebro">
      <div className="cz-ens-fila">
        <label>
          Qué es
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoEnsenanza)}>
            {TIPOS_ENSENANZA.map((t) => (
              <option key={t.clave} value={t.clave}>
                {t.nombre}
              </option>
            ))}
          </select>
        </label>
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
      </div>
      <label>
        Lo que tiene que saber
        <textarea
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setConfirmar(false);
          }}
          rows={4}
          maxLength={2000}
          placeholder="Ej.: Los fines de semana Coberturas no envía mensajes; si piden hablar con alguien, derivar el lunes."
        />
      </label>
      {confirmar ? (
        <div className="cz-ens-conf" role="group" aria-label="Confirmar la propuesta">
          <p>Se va a dejar como propuesta en la Bandeja para Claude. No cambia reglas ni bots hasta que la apruebes. ¿La dejamos?</p>
          <div className="cz-ens-acc">
            <button type="button" className="cz-btn" onClick={enviar} disabled={estado === "enviando"}>
              {estado === "enviando" ? "Guardando…" : "Sí, dejar como propuesta"}
            </button>
            <button type="button" className="cz-btn sec" onClick={() => setConfirmar(false)} disabled={estado === "enviando"}>
              Volver
            </button>
          </div>
        </div>
      ) : (
        <div className="cz-ens-acc">
          <button type="submit" className="cz-btn">
            Revisar y dejar como propuesta
          </button>
          <Link href="/bandeja" prefetch={false} className="cz-btn sec">
            Ver la bandeja
          </Link>
        </div>
      )}
      <p role="status" aria-live="polite" className={estado === "error" ? "cz-err" : "cz-ok"}>
        {estado === "ok" || estado === "error" ? mensaje : ""}
      </p>
    </form>
  );
}

export function BuscadorCerebro({ indice }: { indice: EntradaBusqueda[] }) {
  const [q, setQ] = useState("");
  const hay = q.trim().length >= 2;
  const res = hay ? indice.filter((x) => coincideBusqueda(x.texto, q)) : [];
  return (
    <div className="cz-busca" role="search">
      <label htmlFor="cz-busca-q">Buscar en el cerebro</label>
      <input id="cz-busca-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej.: seguimiento, chips, Coberturas…" autoComplete="off" />
      <div aria-live="polite" className="cz-busca-res">
        {hay && (res.length === 0 ? <p className="cz-muted">No encontré nada con esas palabras.</p> : (
          <>
            <p className="cz-muted">{res.length === 1 ? "1 resultado" : `${res.length} resultados`}</p>
            <ul>
              {res.slice(0, 8).map((x, i) => (
                <li key={`${x.panel}-${i}`}>
                  <a href={`#${x.panel}`}>
                    <small>{x.seccion}</small>
                    {x.texto}
                  </a>
                </li>
              ))}
            </ul>
          </>
        ))}
      </div>
    </div>
  );
}

/** Accesos a Jarvis (otra pantalla) y al Laboratorio (la sección de «Ver más»): solo abren, no ejecutan nada. */
export function AccesosCerebro() {
  return (
    <div className="cz-accesos">
      <Link href="/asistente" prefetch={false} className="cz-acceso">
        <b>Pedile a Jarvis</b>
        <span>Preguntas rápidas y cambios del panel. Lo que proponga queda para confirmar.</span>
      </Link>
      <a href="/laboratorio" className="cz-acceso">
        <b>Laboratorio de bots</b>
        <span>Probá cambios en los bots antes de que rijan. Se abre acá abajo; ningún botón envía mensajes.</span>
      </a>
    </div>
  );
}
