"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Icono } from "@/components/ui/icono-seccion";
import { useDialogo } from "@/components/ui/use-dialogo";
import { TarjetaPropuesta, type Propuesta } from "@/components/asistente/asistente-panel";
import { BocetoCampanas } from "@/components/asistente/boceto-campanas";
import { MAX_ARCHIVOS, MAX_FILAS_ARCHIVO, repetidosEntreArchivos, resumirHoja, type ResumenArchivo } from "@/lib/asistente/general";

/**
 * Panel del asistente general (15/11): el diálogo grande al costado
 * (pantalla completa en el teléfono) que abre el botón de la pantalla de
 * Perfiles (asistente-general.tsx). Se carga recién al abrirlo. Además de imágenes y PDF, acepta planillas (Excel o CSV): se
 * leen en el navegador, al asistente le llega solo un resumen enmascarado y
 * las filas se guardan aparte para importarlas recién al confirmar.
 * Cerrar (también con Escape) no descarta nada: la charla y las propuestas
 * siguen ahí al volver a abrir.
 */

type EstadoArchivo = "leyendo" | "subiendo" | "revisar" | "listo" | "error";
const ETIQUETA: Record<EstadoArchivo, string> = { leyendo: "Leyendo…", subiendo: "Subiendo…", revisar: "Para revisar", listo: "Listo", error: "Error" };
const TONO: Record<EstadoArchivo, string> = {
  leyendo: "bg-slate-100 text-slate-700",
  subiendo: "bg-slate-100 text-slate-700",
  revisar: "bg-amber-100 text-amber-900",
  listo: "bg-emerald-100 text-emerald-900",
  error: "bg-red-100 text-red-800",
};

interface Planilla {
  clave: string;
  nombre: string;
  estado: EstadoArchivo;
  nota?: string;
  resumen?: ResumenArchivo;
}

interface Adjunto {
  mime: string;
  datos: string;
  vista: string | null;
  nombre: string;
}

interface Mensaje {
  rol: "usuario" | "asistente";
  texto: string;
  propuestas?: Propuesta[];
  enlaces?: { href: string; texto: string }[];
  error?: boolean;
}

const SUGERENCIAS = [
  "Resumen de los cuatro perfiles",
  "Te adjunto una planilla por perfil: armá las campañas",
  "¿Cómo vienen los bots de cada perfil?",
  "¿Qué captados falta derivar en todos los perfiles?",
];

const MAX_BYTES_ADJUNTOS = 3_400_000;
const esPlanilla = (f: File) => /\.(csv|xlsx|xls)$/i.test(f.name);

function leerComoDataUrl(f: Blob): Promise<string> {
  return new Promise((ok, mal) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => mal(r.error);
    r.readAsDataURL(f);
  });
}

async function imagenReducida(f: File): Promise<string> {
  const bmp = await createImageBitmap(f);
  const escala = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * escala);
  c.height = Math.round(bmp.height * escala);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.8);
}

export function PanelAsistenteGeneral({ abierto, alCerrar, alTenerCharla }: { abierto: boolean; alCerrar: () => void; alTenerCharla: (hay: boolean) => void }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
  const [planillas, setPlanillas] = useState<Planilla[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  // Teléfonos de cada planilla para contar repetidos entre archivos. Nunca salen del navegador.
  const telefonos = useRef(new Map<string, Set<string>>());
  const archivo = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLDivElement>(null);
  const entrada = useRef<HTMLTextAreaElement>(null);
  const cerrar = alCerrar;
  const dialogoRef = useDialogo<HTMLElement>(abierto, cerrar);

  useEffect(() => {
    if (abierto) window.setTimeout(() => entrada.current?.focus(), 50);
  }, [abierto]);
  useEffect(() => {
    alTenerCharla(mensajes.length > 0);
  }, [mensajes.length, alTenerCharla]);
  useEffect(() => {
    lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: "smooth" });
  }, [mensajes, pensando]);

  const actualizarPlanilla = (clave: string, cambio: Partial<Planilla>) => setPlanillas((ps) => ps.map((p) => (p.clave === clave ? { ...p, ...cambio } : p)));

  async function subirFilas(archivoNombre: string, hoja: string | null, filas: Record<string, unknown>[]): Promise<string> {
    const res = await fetch("/api/asistente/general/archivos", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.id) throw new Error(data?.error ?? "No se pudo preparar la subida.");
    const { createClient } = await import("@/lib/supabase/client");
    const cuerpo = new Blob([JSON.stringify({ archivo: archivoNombre, hoja, filas })], { type: "application/json" });
    const { error } = await createClient().storage.from("bases-originales").uploadToSignedUrl(data.path, data.token, cuerpo, { contentType: "application/json" });
    if (error) throw new Error("No se pudo subir la planilla. Probá de nuevo.");
    return data.id as string;
  }

  async function leerPlanilla(f: File) {
    const base = `${f.name}-${Date.now()}`;
    setPlanillas((ps) => [...ps, { clave: base, nombre: f.name, estado: "leyendo" }]);
    try {
      const { leerTodasLasHojas } = await import("@/lib/bases/parse-file");
      const hojas = await leerTodasLasHojas(f);
      const conDatos = hojas.filter((h) => h.filas.length > 0);
      if (!conDatos.length) {
        actualizarPlanilla(base, { estado: "error", nota: "No tiene filas con datos." });
        return;
      }
      const resumenHojas = hojas.map((h) => ({ nombre: h.nombre ?? "CSV", filas: h.filas.length }));
      // Cada hoja con datos es una planilla aparte (un Excel puede traer una hoja por perfil).
      setPlanillas((ps) => ps.filter((p) => p.clave !== base));
      for (const [i, h] of conDatos.entries()) {
        const clave = `${base}-${i}`;
        const nombre = h.nombre && hojas.length > 1 ? `${f.name} › ${h.nombre}` : f.name;
        setPlanillas((ps) => [...ps, { clave, nombre, estado: "leyendo" }]);
        if (h.filas.length > MAX_FILAS_ARCHIVO) {
          actualizarPlanilla(clave, { estado: "error", nota: `Tiene ${h.filas.length.toLocaleString("es-AR")} filas: el máximo es ${MAX_FILAS_ARCHIVO.toLocaleString("es-AR")}. Dividila en archivos más chicos.` });
          continue;
        }
        const { resumen, telefonos: tels } = resumirHoja(f.name, h.nombre, resumenHojas, h.filas);
        actualizarPlanilla(clave, { estado: "subiendo" });
        const id = await subirFilas(f.name, h.nombre, h.filas);
        telefonos.current.set(id, tels);
        const sinTelefono = !resumen.columna_telefono;
        actualizarPlanilla(clave, {
          estado: sinTelefono ? "revisar" : "listo",
          nota: sinTelefono ? "No se reconoce una columna de teléfono: así no se puede importar." : `${resumen.filas.toLocaleString("es-AR")} filas${resumen.partes > 1 ? ` · se divide en ${resumen.partes} bases` : ""}`,
          resumen: { ...resumen, id, repetidos_con_otros: [] },
        });
      }
    } catch (e) {
      setPlanillas((ps) => ps.map((p) => (p.clave.startsWith(base) && p.estado !== "listo" && p.estado !== "revisar" ? { ...p, estado: "error", nota: (e as Error).message || "No se pudo leer." } : p)));
    }
  }

  async function adjuntar(files: FileList | null) {
    if (!files) return;
    setAviso(null);
    for (const f of Array.from(files)) {
      if (esPlanilla(f)) {
        if (planillas.length >= MAX_ARCHIVOS) {
          setAviso(`Podés adjuntar hasta ${MAX_ARCHIVOS} planillas por charla.`);
          continue;
        }
        void leerPlanilla(f);
        continue;
      }
      try {
        if (f.type.startsWith("image/")) {
          const url = await imagenReducida(f);
          setAdjuntos((x) => [...x, { mime: "image/jpeg", datos: url.split(",")[1], vista: url, nombre: f.name }].slice(0, 3));
        } else if (f.type === "application/pdf") {
          if (f.size > MAX_BYTES_ADJUNTOS) {
            setAviso(`«${f.name}» pesa demasiado (máximo 3 MB).`);
            continue;
          }
          const url = await leerComoDataUrl(f);
          setAdjuntos((x) => [...x, { mime: "application/pdf", datos: url.split(",")[1], vista: null, nombre: f.name }].slice(0, 3));
        } else {
          setAviso(`«${f.name}» no es una imagen, un PDF ni una planilla (Excel o CSV).`);
        }
      } catch {
        setAviso(`No se pudo leer «${f.name}».`);
      }
    }
    if (archivo.current) archivo.current.value = "";
  }

  /** Resúmenes listos, con los repetidos entre planillas calculados acá. */
  function resumenesListos(): ResumenArchivo[] {
    const listas = planillas.filter((p) => p.resumen && (p.estado === "listo" || p.estado === "revisar")).map((p) => p.resumen!);
    const cruces = repetidosEntreArchivos(listas.map((r) => ({ nombre: r.nombre, telefonos: telefonos.current.get(r.id) ?? new Set<string>() })));
    return listas.map((r, i) => ({ ...r, repetidos_con_otros: cruces[i] }));
  }

  const leyendo = planillas.some((p) => p.estado === "leyendo" || p.estado === "subiendo");

  const enviar = useCallback(
    async (contenido: string) => {
      const limpio = contenido.trim();
      if ((!limpio && adjuntos.length === 0) || pensando || leyendo) return;
      const enviados = adjuntos;
      const historial: Mensaje[] = [...mensajes, { rol: "usuario", texto: limpio || "Mirá lo que te adjunto." }];
      setAdjuntos([]);
      setMensajes(historial);
      setTexto("");
      setPensando(true);
      try {
        const res = await fetch("/api/asistente/general", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mensajes: historial.filter((m) => !m.error).map((m) => ({ rol: m.rol, texto: m.texto })),
            imagenes: enviados.map((i) => ({ mime: i.mime, datos: i.datos })),
            archivos: resumenesListos(),
          }),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mensajes, pensando, adjuntos, planillas, leyendo]
  );

  const actualizarPropuesta = (i: number, p: Propuesta) =>
    setMensajes((ms) => ms.map((m, k) => (k === i ? { ...m, propuestas: (m.propuestas ?? []).map((x) => (x.id === p.id ? p : x)) } : m)));

  // Cerrado no muestra nada, pero sigue montado: la charla y las propuestas quedan para cuando se vuelva a abrir.
  return (
    <>

      {abierto &&
        createPortal(
        <div data-portal-dialogo="" className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-950/40" aria-hidden="true" onClick={cerrar} />
          <aside
            ref={dialogoRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="asistente-general-dialogo"
            tabIndex={-1}
            data-asistente=""
            className="absolute inset-0 flex flex-col bg-white text-slate-900 shadow-2xl outline-none animate-fade-in sm:left-auto sm:w-full sm:max-w-3xl sm:border-l sm:border-slate-200"
          >
            <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-700">
                  <Icono nombre="asistente" className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p id="asistente-general-dialogo" className="text-sm font-semibold text-slate-950">
                    Asistente general
                  </p>
                  <p className="truncate text-xs text-slate-600">Los cuatro perfiles · nada cambia sin tu confirmación</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {(mensajes.length > 0 || planillas.length > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMensajes([]);
                      setPlanillas([]);
                      setAdjuntos([]);
                      telefonos.current.clear();
                    }}
                    className="tactil rounded-lg px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Nueva charla
                  </button>
                )}
                <button type="button" onClick={cerrar} className="tactil grid place-items-center rounded-lg text-slate-700 hover:bg-slate-100" aria-label="Cerrar el asistente general">
                  <Icono nombre="cerrar" className="h-5 w-5" />
                </button>
              </div>
            </header>

            <div ref={lista} role="log" aria-live="polite" aria-label="Conversación con el asistente general" tabIndex={0} className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-4">
              {mensajes.length === 0 && (
                <div>
                  <p className="text-sm text-slate-700">
                    Preguntame lo que quieras, como a cualquier IA, y también puedo operar los cuatro perfiles. Adjuntá planillas (Excel o CSV), por ejemplo una por perfil: te digo a qué perfil va cada una, cuántas personas hay para contactar y te armo un boceto de campaña por perfil para que lo revises. Yo solo veo un resumen de cada planilla, con los teléfonos ocultos.
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    {SUGERENCIAS.map((s) => (
                      <button key={s} type="button" onClick={() => (s.startsWith("Te adjunto") ? (setTexto(s), archivo.current?.click()) : enviar(s))} className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-slate-800 shadow-sm hover:border-slate-300">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {mensajes.map((m, i) => {
                const planes = (m.propuestas ?? []).filter((p) => p.tipo === "plan_campanas");
                const otras = (m.propuestas ?? []).filter((p) => p.tipo !== "plan_campanas");
                return (
                  <div key={i} className={m.rol === "usuario" ? "flex justify-end" : ""}>
                    <div className={m.rol === "usuario" ? "max-w-[85%] rounded-2xl rounded-br-md bg-slate-900 px-3.5 py-2 text-sm text-white" : "max-w-full"}>
                      <p className={`whitespace-pre-wrap text-sm ${m.rol === "usuario" ? "" : m.error ? "text-red-700" : "text-slate-800"}`}>{m.texto}</p>
                      {planes.length > 0 && <BocetoCampanas propuestas={planes} alCambiar={(np) => actualizarPropuesta(i, np)} />}
                      {otras.map((p) => (
                        <TarjetaPropuesta key={p.id} p={p} alCambiar={(np) => actualizarPropuesta(i, np)} />
                      ))}
                      {(m.enlaces ?? []).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {m.enlaces!.map((e) => (
                            <Link prefetch={false} key={e.href} href={e.href} onClick={cerrar} className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 hover:border-slate-300">
                              {e.texto} <Icono nombre="flecha" className="h-3.5 w-3.5" />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {pensando && (
                <p role="status" className="text-sm text-slate-600">
                  Pensando…
                </p>
              )}
            </div>

            <form
              className="border-t border-slate-100 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                enviar(texto);
              }}
            >
              {planillas.length > 0 && (
                <ul aria-label="Planillas adjuntas" className="mb-2 flex flex-wrap gap-2">
                  {planillas.map((p) => (
                    <li key={p.clave} className="flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-white py-1 pl-2.5 pr-1 text-xs text-slate-800">
                      <span className="min-w-0">
                        <span className="block max-w-[14rem] truncate font-medium" title={p.nombre}>
                          {p.nombre}
                        </span>
                        {p.nota && <span className="block max-w-[14rem] truncate text-slate-600" title={p.nota}>{p.nota}</span>}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 font-medium ${TONO[p.estado]}`}>{ETIQUETA[p.estado]}</span>
                      {p.estado !== "leyendo" && p.estado !== "subiendo" && (
                        <button
                          type="button"
                          onClick={() => {
                            if (p.resumen) telefonos.current.delete(p.resumen.id);
                            setPlanillas((ps) => ps.filter((x) => x.clave !== p.clave));
                          }}
                          className="tactil grid place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
                          aria-label={`Quitar ${p.nombre} de la charla`}
                        >
                          <Icono nombre="cerrar" className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {adjuntos.length > 0 && (
                <ul aria-label="Imágenes y PDF adjuntos" className="mb-2 flex flex-wrap gap-2">
                  {adjuntos.map((a, k) => (
                    <li key={k} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white py-1 pl-1 pr-1 text-xs text-slate-800">
                      {a.vista ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.vista} alt="" className="h-10 w-10 rounded-md object-cover" />
                      ) : (
                        <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-md bg-slate-100 font-semibold text-slate-700">
                          PDF
                        </span>
                      )}
                      <span className="max-w-[10rem] truncate">{a.nombre}</span>
                      <button type="button" onClick={() => setAdjuntos((x) => x.filter((_, j) => j !== k))} className="tactil grid place-items-center rounded-lg text-slate-600 hover:bg-slate-100" aria-label={`Quitar ${a.nombre}`}>
                        <Icono nombre="cerrar" className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {aviso && (
                <p role="alert" className="mb-2 text-sm text-red-700">
                  {aviso}
                </p>
              )}
              <p role="status" aria-live="polite" className="sr-only">
                {leyendo ? "Leyendo y subiendo planillas…" : ""}
              </p>
              <div className="flex items-end gap-2 rounded-xl border border-slate-300 bg-white p-2 focus-within:border-slate-900">
                <input
                  ref={archivo}
                  type="file"
                  accept="image/*,application/pdf,.csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  multiple
                  tabIndex={-1}
                  aria-hidden="true"
                  className="hidden"
                  onChange={(e) => adjuntar(e.target.files)}
                />
                <button type="button" onClick={() => archivo.current?.click()} className="tactil grid shrink-0 place-items-center rounded-lg text-slate-700 hover:bg-slate-100" aria-label="Adjuntar planillas, imágenes o PDF" title="Adjuntar planillas (Excel o CSV), imágenes o PDF">
                  <span aria-hidden="true" className="text-xl leading-none">
                    +
                  </span>
                </button>
                <label htmlFor="asistente-general-texto" className="sr-only">
                  Pedido para el asistente general
                </label>
                <textarea
                  id="asistente-general-texto"
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
                  placeholder="Ej.: con estas planillas armá una campaña por perfil"
                  className="sin-anillo max-h-40 min-h-[2.75rem] flex-1 resize-none border-0 bg-transparent p-1 text-sm text-slate-900 shadow-none focus:ring-0"
                />
                <button type="submit" disabled={pensando || leyendo || (!texto.trim() && adjuntos.length === 0)} className="btn-gold-sm tactil" aria-label={leyendo ? "Esperá a que terminen de subir las planillas" : "Enviar"}>
                  <Icono nombre="enviar" className="h-4 w-4" />
                </button>
              </div>
            </form>
          </aside>
        </div>,
          document.body
        )}
    </>
  );
}
