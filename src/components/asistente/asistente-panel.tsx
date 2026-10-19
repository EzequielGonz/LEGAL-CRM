"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SlugPerfil } from "@/lib/marca";
import { Icono } from "@/components/ui/icono-seccion";
import { nivelDeAccion } from "@/lib/asistente/permisos";

/**
 * Asistente del panel (18/10): un panel lateral donde se pide algo con
 * palabras («programá 1 post y 1 historia por día este mes», «¿cómo viene el
 * bot?», «que el bot sea más breve»). Lo que cambia algo vuelve como
 * propuesta con «Confirmar»: nada se ejecuta sin ese clic.
 */
const EVENTO = "crm:asistente";

export function abrirAsistente(texto?: string) {
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: texto ?? null }));
}

export interface Propuesta {
  id: string;
  tipo: string;
  titulo: string;
  resumen: string;
  estado: string;
  resultado?: any;
  detalle?: any;
  avance?: { hechas: number; total: number } | null;
}

const FORMATO: Record<string, string> = { post: "Posteo", historia: "Historia", carrusel: "Carrusel" };
const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function VistaPiezas({ piezas }: { piezas: any[] }) {
  // Una fila por pieza (Instagram y Facebook comparten texto e imagen).
  const unicas = piezas.filter((x, i) => piezas.findIndex((y) => y.fecha === x.fecha && y.formato === x.formato) === i);
  return (
    <details className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-700">
      <summary className="cursor-pointer font-medium text-slate-800">Ver las {unicas.length} piezas</summary>
      <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
        {unicas.map((x, i) => (
          <li key={i} className="rounded-md border border-slate-200 bg-white p-2">
            <p className="text-[11px] font-semibold text-slate-500">
              {FORMATO[x.formato] ?? x.formato} · {fechaCorta(x.fecha)}
            </p>
            <p className="mt-0.5 font-semibold text-slate-900">{x.titular}</p>
            {x.formato !== "historia" && <p className="mt-0.5 line-clamp-3 text-slate-600">{x.texto}</p>}
          </li>
        ))}
      </ul>
    </details>
  );
}

interface Mensaje {
  rol: "usuario" | "asistente";
  texto: string;
  propuestas?: Propuesta[];
  enlaces?: { href: string; texto: string }[];
  error?: boolean;
}

const SUGERENCIAS = [
  "Programá 1 post y 1 historia por día durante 30 días, y un carrusel cada 2 días",
  "¿Cómo viene el bot de este perfil?",
  "Mostrame los captados que falta derivar",
  "Resumen de hoy",
  "Ayudame a armar una campaña con una de las bases cargadas",
];

function textoResultado(p: Propuesta): string | null {
  const r = p.resultado;
  if (!r) return null;
  if (r.error) return `No se pudo: ${r.error}`;
  if (p.tipo === "publicaciones") {
    const prog = r.por_estado?.programada ?? 0;
    const partes = [`${r.hechas ?? r.total} de ${r.total} guardadas`];
    if (r.en_metricool) partes.push(`${r.en_metricool} programadas en Metricool`);
    else if (prog) partes.push(`${prog} programadas`);
    const esperan = (r.por_estado?.lista ?? 0) + (r.por_estado?.retenida ?? 0);
    if (esperan) partes.push(`${esperan} esperan: ${r.motivos?.[0] ?? "revisá Publicaciones"}`);
    return partes.join(" · ");
  }
  if (p.tipo === "cambio_agente") return r.deshecho ? "Cambio deshecho: el bot volvió a sus instrucciones anteriores." : "Listo: el bot ya responde con las instrucciones nuevas.";
  if (p.tipo === "pausar_campana") return "Campaña pausada.";
  if (p.tipo === "crear_campana") return `Campaña creada en borrador con ${r.destinatarios_agregados ?? 0} destinatarios pendientes. No se envió nada: para lanzarla pedímelo o hacelo desde Campañas.`;
  if (p.tipo === "asignar_linea_campana") return "Línea de la campaña actualizada.";
  if (p.tipo === "limite_campana") return r.limite_diario ? `Listo: la campaña envía como máximo ${r.limite_diario} mensajes por día.` : "Listo: la campaña quedó sin límite diario propio.";
  if (p.tipo === "lanzar_campana") return "Campaña lanzada: los envíos siguen el ritmo y el horario configurados. Podés pausarla cuando quieras.";
  if (p.tipo === "asignar_agente") return `Agente ${r.estado === "activa" ? "activado" : r.estado === "pausada" ? "pausado" : "apagado"}.`;
  return "Listo.";
}

export function TarjetaPropuesta({ p, alCambiar }: { p: Propuesta; alCambiar: (p: Propuesta) => void }) {
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nivel = nivelDeAccion(p.tipo, (p.detalle ?? {}) as Record<string, unknown>);
  const [entendido, setEntendido] = useState(false);
  const [pin, setPin] = useState("");
  const faltaConfirmacion = (nivel === "contacto" && !entendido) || (nivel === "pin" && pin.trim().length < 4);

  async function confirmar() {
    setOcupado(true);
    setError(null);
    try {
      // Las publicaciones se programan por tandas: se repite hasta terminar.
      for (let vuelta = 0; vuelta < 40; vuelta++) {
        const res = await fetch(`/api/asistente/acciones/${p.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmar_envio: nivel === "contacto" ? entendido : undefined, pin: nivel === "pin" ? pin : undefined }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error ?? "No se pudo confirmar.");
        const r = data.resultado ?? {};
        alCambiar({ ...p, estado: data.estado, resultado: r, avance: r.total ? { hechas: r.hechas, total: r.total } : null });
        if (!data.pendientes) break;
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
    }
  }
  async function descartar() {
    setOcupado(true);
    const res = await fetch(`/api/asistente/acciones/${p.id}`, { method: "DELETE" });
    setOcupado(false);
    if (res.ok) alCambiar({ ...p, estado: "descartada" });
  }
  async function deshacer() {
    setOcupado(true);
    const res = await fetch(`/api/asistente/acciones/${p.id}/deshacer`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setOcupado(false);
    if (res.ok) alCambiar({ ...p, resultado: { ...(p.resultado ?? {}), deshecho: true } });
    else setError(data?.error ?? "No se pudo deshacer.");
  }

  const hecho = textoResultado(p);
  return (
    <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">Propuesta</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-950">{p.titulo}</p>
      <p className="mt-1 text-sm text-slate-600">{p.resumen}</p>
      {p.tipo === "publicaciones" && Array.isArray(p.detalle?.piezas) && <VistaPiezas piezas={p.detalle.piezas} />}
      {p.avance && p.estado === "ejecutando" && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
          <div className="h-full rounded-full bg-gold-500 transition-all" style={{ width: `${Math.round((p.avance.hechas / Math.max(1, p.avance.total)) * 100)}%` }} />
        </div>
      )}
      {p.estado === "propuesta" && nivel === "contacto" && (
        <label className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
          <input type="checkbox" className="mt-0.5 h-4 w-4" checked={entendido} onChange={(e) => setEntendido(e.target.checked)} />
          <span>Revisé a quién, cuántas personas y desde qué línea: entiendo que al confirmar pueden empezar a salir mensajes reales.</span>
        </label>
      )}
      {p.estado === "propuesta" && nivel === "pin" && (
        <label className="mt-3 block text-xs font-medium text-slate-700">
          PIN para confirmar
          <input type="password" inputMode="numeric" autoComplete="off" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))} className="mt-1 block w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
      )}
      {p.estado === "propuesta" && (
        <div className="mt-3 flex gap-2">
          <button type="button" disabled={ocupado || faltaConfirmacion} onClick={confirmar} className="btn-gold-sm">
            {ocupado ? "Haciendo…" : "Confirmar"}
          </button>
          <button type="button" disabled={ocupado} onClick={descartar} className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
            Descartar
          </button>
        </div>
      )}
      {p.estado === "ejecutando" && <p className="mt-2 text-xs text-slate-600">{ocupado ? "Programando…" : "Quedó a medias: tocá para seguir."}</p>}
      {p.estado === "ejecutando" && !ocupado && (
        <button type="button" onClick={confirmar} className="btn-gold-sm mt-2">
          Seguir
        </button>
      )}
      {p.estado === "descartada" && <p className="mt-2 text-xs text-slate-500">Descartada: no se hizo nada.</p>}
      {(p.estado === "ejecutada" || p.estado === "error") && hecho && <p className={`mt-2 text-xs font-medium ${p.estado === "error" ? "text-red-700" : "text-emerald-700"}`}>{hecho}</p>}
      {p.estado === "ejecutada" && p.tipo === "cambio_agente" && !p.resultado?.deshecho && (
        <button type="button" disabled={ocupado} onClick={deshacer} className="mt-2 text-xs font-medium text-slate-700 underline">
          Deshacer el cambio
        </button>
      )}
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}

export function AsistentePanel({ slug }: { slug: SlugPerfil }) {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const [imagenes, setImagenes] = useState<{ mime: string; datos: string; vista: string }[]>([]);
  const archivo = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLDivElement>(null);
  const entrada = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const abrir = (e: Event) => {
      setAbierto(true);
      const t = (e as CustomEvent<string | null>).detail;
      if (t) setTexto(t);
      window.setTimeout(() => entrada.current?.focus(), 50);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    window.addEventListener(EVENTO, abrir);
    window.addEventListener("keydown", tecla);
    return () => {
      window.removeEventListener(EVENTO, abrir);
      window.removeEventListener("keydown", tecla);
    };
  }, []);

  useEffect(() => {
    lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: "smooth" });
  }, [mensajes, pensando]);

  async function adjuntar(files: FileList | null) {
    if (!files) return;
    const nuevas: { mime: string; datos: string; vista: string }[] = [];
    for (const f of Array.from(files).slice(0, 3 - imagenes.length)) {
      if (!f.type.startsWith("image/")) continue;
      try {
        const bmp = await createImageBitmap(f);
        const escala = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
        const c = document.createElement("canvas");
        c.width = Math.round(bmp.width * escala);
        c.height = Math.round(bmp.height * escala);
        c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
        const url = c.toDataURL("image/jpeg", 0.8);
        nuevas.push({ mime: "image/jpeg", datos: url.split(",")[1], vista: url });
      } catch {
        /* imagen ilegible: se ignora */
      }
    }
    setImagenes((x) => [...x, ...nuevas].slice(0, 3));
    if (archivo.current) archivo.current.value = "";
  }

  const enviar = useCallback(
    async (contenido: string) => {
      const limpio = contenido.trim();
      if ((!limpio && imagenes.length === 0) || pensando) return;
      const adjuntas = imagenes;
      const historial: Mensaje[] = [...mensajes, { rol: "usuario", texto: limpio || "Mirá esta imagen." }];
      setImagenes([]);
      setMensajes(historial);
      setTexto("");
      setPensando(true);
      try {
        const res = await fetch("/api/asistente", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ perfil: slug, mensajes: historial.filter((m) => !m.error).map((m) => ({ rol: m.rol, texto: m.texto })), imagenes: adjuntas.map((i) => ({ mime: i.mime, datos: i.datos })) }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error ?? "No pude responder.");
        setMensajes((m) => [...m, { rol: "asistente", texto: data.texto, propuestas: data.propuestas ?? [], enlaces: data.enlaces ?? [] }]);
      } catch (e) {
        setMensajes((m) => [...m, { rol: "asistente", texto: (e as Error).message, error: true }]);
      } finally {
        setPensando(false);
      }
    },
    [mensajes, pensando, slug, imagenes]
  );

  const actualizarPropuesta = (i: number, p: Propuesta) =>
    setMensajes((ms) => ms.map((m, k) => (k === i ? { ...m, propuestas: (m.propuestas ?? []).map((x) => (x.id === p.id ? p : x)) } : m)));

  if (!abierto) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-950/20 lg:hidden" aria-hidden="true" onClick={() => setAbierto(false)} />
      <aside
        role="dialog"
        aria-label="Asistente del panel"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl animate-fade-in"
      >
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold-500/15 text-gold-700">
              <Icono nombre="asistente" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-950">Asistente</p>
              <p className="text-xs text-slate-500">Preguntale o pedile algo con tus palabras</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {mensajes.length > 0 && (
              <button type="button" onClick={() => setMensajes([])} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
                Nueva charla
              </button>
            )}
            <button type="button" onClick={() => setAbierto(false)} className="tactil grid place-items-center rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Cerrar el asistente">
              <Icono nombre="cerrar" className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div ref={lista} className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-4">
          {mensajes.length === 0 && (
            <div>
              <p className="text-sm text-slate-700">Preguntame lo que quieras, como a cualquier IA, y también puedo operar el panel: armar campañas con bases, líneas y plantillas, programar publicaciones, ajustar bots y agentes, buscar captados o mirar una imagen que me adjuntes. Antes de cambiar algo, siempre te pido que confirmes; lo que puede enviar mensajes pide una confirmación reforzada.</p>
              <div className="mt-4 flex flex-col gap-2">
                {SUGERENCIAS.map((s) => (
                  <button key={s} type="button" onClick={() => enviar(s)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-slate-800 shadow-sm hover:border-slate-300">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {mensajes.map((m, i) => (
            <div key={i} className={m.rol === "usuario" ? "flex justify-end" : ""}>
              <div className={m.rol === "usuario" ? "max-w-[85%] rounded-2xl rounded-br-md bg-slate-900 px-3.5 py-2 text-sm text-white" : "max-w-full"}>
                <p className={`whitespace-pre-wrap text-sm ${m.rol === "usuario" ? "" : m.error ? "text-red-700" : "text-slate-800"}`}>{m.texto}</p>
                {(m.propuestas ?? []).map((p) => (
                  <TarjetaPropuesta key={p.id} p={p} alCambiar={(np) => actualizarPropuesta(i, np)} />
                ))}
                {(m.enlaces ?? []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.enlaces!.map((e) => (
                      <Link key={e.href} href={e.href} onClick={() => setAbierto(false)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:border-slate-300">
                        {e.texto} <Icono nombre="flecha" className="h-3.5 w-3.5" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {pensando && <p className="text-sm text-slate-500">Pensando…</p>}
        </div>

        <form
          className="border-t border-slate-100 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            enviar(texto);
          }}
        >
          {imagenes.length > 0 && (
            <div className="mb-2 flex gap-2">
              {imagenes.map((im, k) => (
                <div key={k} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={im.vista} alt="Imagen adjunta" className="h-14 w-14 rounded-lg object-cover" />
                  <button type="button" onClick={() => setImagenes((x) => x.filter((_, j) => j !== k))} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-slate-900 text-[11px] text-white" aria-label="Quitar imagen">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-2 focus-within:border-gold-500">
            <input ref={archivo} type="file" accept="image/*" multiple className="hidden" onChange={(e) => adjuntar(e.target.files)} />
            <button type="button" onClick={() => archivo.current?.click()} disabled={imagenes.length >= 3} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40" aria-label="Adjuntar una imagen" title="Adjuntar una imagen">
              <span aria-hidden="true" className="text-lg leading-none">+</span>
            </button>
            <label htmlFor="asistente-texto" className="sr-only">
              Pedido para el asistente
            </label>
            <textarea
              id="asistente-texto"
              ref={entrada}
              rows={2}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  enviar(texto);
                }
              }}
              placeholder="Ej.: programá 7 historias para esta semana"
              className="sin-anillo max-h-40 min-h-[2.5rem] flex-1 resize-none border-0 bg-transparent p-1 text-sm text-slate-900 shadow-none focus:ring-0"
            />
            <button type="submit" disabled={pensando || (!texto.trim() && imagenes.length === 0)} className="btn-gold-sm h-9" aria-label="Enviar">
              <Icono nombre="enviar" className="h-4 w-4" />
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
