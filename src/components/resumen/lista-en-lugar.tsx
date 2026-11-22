"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { SlugPerfil } from "@/lib/marca";
import type { ClaveLista, ItemLista } from "@/lib/resumen/lista-reglas";
import { PedirAJarvis } from "@/components/resumen/pedir-a-jarvis";
import { PropuestaEnLugar } from "@/components/resumen/propuesta-en-lugar";

type Estado = { fase: "cargando" } | { fase: "error"; mensaje: string } | { fase: "lista"; items: ItemLista[]; total: number | null };

/**
 * Lista corta de quiénes hay detrás de una cifra, con las acciones ahí mismo (22/11): responder (abre el
 * chat), tomar el chat, derivar, descartar con motivo, confirmar o descartar propuestas. Se carga al abrir,
 * de un perfil por vez. Cada acción usa las mismas rutas del panel de siempre (que validan todo en el
 * servidor); acá solo se pide el motivo o el destinatario antes de confirmar.
 */
export function ListaEnLugar({ slug, clave, pedido, hrefPantalla, alCambiar }: { slug: SlugPerfil; clave: ClaveLista; pedido: string; hrefPantalla: string; alCambiar?: (quedan: number) => void }) {
  const [estado, setEstado] = useState<Estado>({ fase: "cargando" });
  const [aviso, setAviso] = useState<string | null>(null);
  const aCargar = useRef(0);

  const cargar = useCallback(async () => {
    const n = ++aCargar.current;
    setEstado({ fase: "cargando" });
    try {
      const res = await fetch(`/api/resumen/lista?perfil=${encodeURIComponent(slug)}&clave=${clave}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (n !== aCargar.current) return;
      if (!res.ok) throw new Error(data?.error ?? "No se pudo leer la lista.");
      setEstado({ fase: "lista", items: data.items ?? [], total: data.total ?? null });
    } catch (e) {
      if (n === aCargar.current) setEstado({ fase: "error", mensaje: (e as Error).message });
    }
  }, [slug, clave]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const quitar = (id: string, mensaje: string) => {
    setAviso(mensaje);
    setEstado((e) => {
      if (e.fase !== "lista") return e;
      const items = e.items.filter((x) => x.id !== id);
      alCambiar?.(items.length);
      return { ...e, items, total: e.total === null ? null : Math.max(0, e.total - 1) };
    });
  };

  return (
    <div className="rs-lista" aria-busy={estado.fase === "cargando"}>
      <p role="status" aria-live="polite" className={aviso ? "rs-aviso" : "sr-only"}>
        {aviso ?? ""}
      </p>
      {estado.fase === "cargando" ? (
        <ul className="rs-lista__items" aria-label="Cargando">
          {[0, 1, 2].map((i) => (
            <li key={i} className="rs-esqueleto" aria-hidden="true" />
          ))}
        </ul>
      ) : null}
      {estado.fase === "error" ? (
        <div className="rs-vacio" role="alert">
          <p>{estado.mensaje}</p>
          <button type="button" className="rs-btn" onClick={() => void cargar()}>
            Reintentar
          </button>
        </div>
      ) : null}
      {estado.fase === "lista" && estado.items.length === 0 ? <p className="rs-vacio rs-vacio--ok">Todo resuelto acá. No queda nadie en esta lista.</p> : null}
      {estado.fase === "lista" && estado.items.length > 0 ? (
        <>
          <ul className="rs-lista__items">
            {estado.items.map((it, i) => (
              <li key={it.id} className="rs-item" style={{ ["--i" as string]: i }}>
                {clave === "propuestas" && it.propuesta ? <PropuestaEnLugar p={it.propuesta} alResolver={(m) => quitar(it.id, m)} /> : <Item it={it} clave={clave} alQuitar={quitar} />}
              </li>
            ))}
          </ul>
          {estado.total !== null && estado.total > estado.items.length ? <p className="rs-nota rs-nota--izq">Se muestran {estado.items.length} de {estado.total}. El resto está en la pantalla completa.</p> : null}
        </>
      ) : null}
      <div className="rs-lista__pie">
        <Link href={hrefPantalla} prefetch={false} className="rs-btn">
          Abrir pantalla completa
        </Link>
        <PedirAJarvis pedido={pedido} className="rs-btn rs-btn--jarvis">
          Pedile a Jarvis
        </PedirAJarvis>
        <button type="button" className="rs-btn" onClick={() => void cargar()}>
          Actualizar
        </button>
      </div>
    </div>
  );
}

function Item({ it, clave, alQuitar }: { it: ItemLista; clave: ClaveLista; alQuitar: (id: string, mensaje: string) => void }) {
  const [modo, setModo] = useState<null | "descartar" | "derivar">(null);
  const [texto, setTexto] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tomado, setTomado] = useState(false);
  const idCampo = useId();
  const puedeAccionar = (clave === "esperan" || clave === "sinDerivar") && !!it.oportunidadId;

  async function llamar(url: string, cuerpo: unknown): Promise<boolean> {
    setOcupado(true);
    setError(null);
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "No se pudo hacer. Probá de nuevo.");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setOcupado(false);
    }
  }

  async function tomar() {
    if (!it.conversationId) return;
    if (await llamar(`/api/conversations/${it.conversationId}/toggle-ai`, { ai_enabled: false })) setTomado(true);
  }
  async function confirmarDescarte() {
    if (texto.trim().length < 3) return setError("Escribí el motivo (unas palabras alcanzan).");
    if (await llamar(`/api/oportunidades/${it.oportunidadId}`, { accion: "perder", motivo: texto.trim() })) alQuitar(it.id, `Descartado: ${it.nombre}. Queda en Descartados con su motivo; no se borró nada.`);
  }
  async function confirmarDerivar() {
    if (await llamar(`/api/oportunidades/${it.oportunidadId}`, { accion: "derivar", destinatario: texto.trim() || undefined })) alQuitar(it.id, `Derivado: ${it.nombre}.`);
  }

  return (
    <div className="rs-item__caja">
      <div className="rs-item__quien">
        <b>{it.nombre}</b>
        <span>{tomado ? "Chat tomado: la IA quedó apagada y vos atendés." : it.detalle}</span>
      </div>
      {modo === null ? (
        <div className="rs-item__acciones">
          {it.chatHref ? (
            <Link href={it.chatHref} prefetch={false} className="rs-btn rs-btn--jarvis">
              {clave === "sinDerivar" ? "Abrir chat" : "Responder"}
              <span className="sr-only"> a {it.nombre}</span>
            </Link>
          ) : null}
          {clave === "esperan" && it.conversationId && !tomado ? (
            <button type="button" className="rs-btn" disabled={ocupado} onClick={tomar}>
              {ocupado ? "Tomando…" : "Tomar el chat"}
              <span className="sr-only"> de {it.nombre}</span>
            </button>
          ) : null}
          {clave === "sinDerivar" && puedeAccionar ? (
            <button type="button" className="rs-btn" onClick={() => { setModo("derivar"); setTexto(""); setError(null); }}>
              Derivar<span className="sr-only"> a {it.nombre}</span>
            </button>
          ) : null}
          {puedeAccionar ? (
            <button type="button" className="rs-btn rs-btn--suave" onClick={() => { setModo("descartar"); setTexto(""); setError(null); }}>
              Descartar<span className="sr-only"> a {it.nombre}</span>
            </button>
          ) : null}
          {it.fichaHref ? (
            <Link href={it.fichaHref} prefetch={false} className="rs-btn rs-btn--suave">
              {clave === "alertas" ? "Ver" : "Ficha"}
              <span className="sr-only"> de {it.nombre}</span>
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="rs-item__form">
          <label htmlFor={idCampo} className="rs-etq">
            {modo === "descartar" ? "¿Por qué lo descartás? (queda registrado)" : "¿A quién lo derivás? (opcional)"}
          </label>
          <input id={idCampo} className="rs-input" value={texto} maxLength={300} onChange={(e) => setTexto(e.target.value)} autoFocus placeholder={modo === "descartar" ? "Ej.: ya tiene abogado" : "Ej.: Dra. Pérez"} />
          <div className="rs-item__acciones">
            <button type="button" className="rs-btn rs-btn--jarvis" disabled={ocupado} onClick={modo === "descartar" ? confirmarDescarte : confirmarDerivar}>
              {ocupado ? "Guardando…" : modo === "descartar" ? "Confirmar descarte" : "Confirmar derivación"}
            </button>
            <button type="button" className="rs-btn" disabled={ocupado} onClick={() => { setModo(null); setError(null); }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
      {error ? (
        <p role="alert" className="rs-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
