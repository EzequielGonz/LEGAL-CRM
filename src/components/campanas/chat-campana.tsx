"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SlugPerfil } from "@/lib/marca";
import { TarjetaPropuesta, type Propuesta } from "@/components/asistente/asistente-panel";

/**
 * «Preparar con IA» dentro de Campañas (19/10): una charla en la misma
 * pantalla para armar la campaña. La IA mira las bases, las líneas y las
 * plantillas, recomienda según el tipo de base y deja la campaña como
 * propuesta en borrador. Nada se envía: lanzar es otro paso, con otra
 * confirmación. Acepta imágenes, PDF y archivos de texto como insumo.
 */
interface Mensaje {
  rol: "usuario" | "asistente";
  texto: string;
  adjuntos?: string[];
  propuestas?: Propuesta[];
  enlaces?: { href: string; texto: string }[];
  error?: boolean;
}

interface Adjunto {
  tipo: "imagen" | "pdf" | "texto";
  nombre: string;
  mime?: string;
  datos?: string;
  contenido?: string;
  vista?: string;
}

const SUGERENCIAS = [
  "Mostrame qué bases, líneas y plantillas tengo",
  "Quiero contactar a una de las bases cargadas: recomendame cuál conviene y con qué plantilla",
  "Armame una campaña con la base más nueva",
  "Tengo una idea de mensaje (la adjunto): ¿sirve como plantilla?",
];

const MAX_ADJUNTOS = 3;
const MAX_PDF_BYTES = 2_500_000;

function leerBase64(f: File): Promise<string> {
  return new Promise((ok, mal) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(",")[1] ?? "");
    r.onerror = () => mal(r.error);
    r.readAsDataURL(f);
  });
}

export function ChatCampana({ slug, onCerrar }: { slug: SlugPerfil; onCerrar: () => void }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const archivo = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLDivElement>(null);

  useEffect(() => {
    lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: "smooth" });
  }, [mensajes, pensando]);

  async function adjuntar(files: FileList | null) {
    if (!files) return;
    setAviso(null);
    const nuevos: Adjunto[] = [];
    for (const f of Array.from(files).slice(0, MAX_ADJUNTOS - adjuntos.length)) {
      try {
        if (f.type.startsWith("image/")) {
          const bmp = await createImageBitmap(f);
          const escala = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
          const c = document.createElement("canvas");
          c.width = Math.round(bmp.width * escala);
          c.height = Math.round(bmp.height * escala);
          c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
          const url = c.toDataURL("image/jpeg", 0.8);
          nuevos.push({ tipo: "imagen", nombre: f.name, mime: "image/jpeg", datos: url.split(",")[1], vista: url });
        } else if (f.type === "application/pdf" || /\.pdf$/i.test(f.name)) {
          if (f.size > MAX_PDF_BYTES) {
            setAviso(`«${f.name}» pesa demasiado (máximo 2,5 MB).`);
            continue;
          }
          nuevos.push({ tipo: "pdf", nombre: f.name, mime: "application/pdf", datos: await leerBase64(f) });
        } else if (/\.(csv|txt|md)$/i.test(f.name) || f.type.startsWith("text/")) {
          nuevos.push({ tipo: "texto", nombre: f.name, contenido: (await f.text()).slice(0, 40000) });
        } else {
          setAviso(`«${f.name}» no se puede leer: usá imágenes, PDF, CSV o texto.`);
        }
      } catch {
        setAviso(`No pude leer «${f.name}».`);
      }
    }
    setAdjuntos((x) => [...x, ...nuevos].slice(0, MAX_ADJUNTOS));
    if (archivo.current) archivo.current.value = "";
  }

  const enviar = useCallback(
    async (contenido: string) => {
      const limpio = contenido.trim();
      if ((!limpio && adjuntos.length === 0) || pensando) return;
      const enviados = adjuntos;
      const historial: Mensaje[] = [...mensajes, { rol: "usuario", texto: limpio || "Mirá lo que adjunté.", adjuntos: enviados.map((a) => a.nombre) }];
      setAdjuntos([]);
      setMensajes(historial);
      setTexto("");
      setPensando(true);
      try {
        const res = await fetch("/api/asistente", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            perfil: slug,
            modo: "campanas",
            mensajes: historial.filter((m) => !m.error).map((m) => ({ rol: m.rol, texto: m.texto })),
            imagenes: enviados.filter((a) => a.tipo !== "texto").map((a) => ({ mime: a.mime, datos: a.datos })),
            textos: enviados.filter((a) => a.tipo === "texto").map((a) => ({ nombre: a.nombre, contenido: a.contenido })),
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
    [mensajes, pensando, slug, adjuntos]
  );

  const actualizarPropuesta = (i: number, p: Propuesta) =>
    setMensajes((ms) => ms.map((m, k) => (k === i ? { ...m, propuestas: (m.propuestas ?? []).map((x) => (x.id === p.id ? p : x)) } : m)));

  return (
    <section aria-label="Preparar la campaña con IA" className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Preparar con IA</h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Contame qué querés lograr o adjuntá ideas. Miro tus bases, líneas y plantillas, te recomiendo según el tipo de base y dejo la campaña lista en borrador. No se envía nada sin tu confirmación.
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          {mensajes.length > 0 && (
            <button type="button" onClick={() => setMensajes([])} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
              Empezar de nuevo
            </button>
          )}
          <button type="button" onClick={onCerrar} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
            Cerrar
          </button>
        </div>
      </header>

      <div ref={lista} className="max-h-[32rem] min-h-[10rem] space-y-4 overflow-y-auto bg-slate-50 px-5 py-4">
        {mensajes.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGERENCIAS.map((s) => (
              <button key={s} type="button" onClick={() => enviar(s)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-800 shadow-sm hover:border-slate-300">
                {s}
              </button>
            ))}
          </div>
        )}
        {mensajes.map((m, i) => (
          <div key={i} className={m.rol === "usuario" ? "flex justify-end" : ""}>
            <div className={m.rol === "usuario" ? "max-w-[85%] rounded-2xl rounded-br-md bg-slate-900 px-3.5 py-2 text-sm text-white" : "max-w-full"}>
              <p className={`whitespace-pre-wrap text-sm ${m.rol === "usuario" ? "" : m.error ? "text-red-700" : "text-slate-800"}`}>{m.texto}</p>
              {(m.adjuntos ?? []).length > 0 && <p className="mt-1 text-xs opacity-75">Adjuntos: {m.adjuntos!.join(", ")}</p>}
              {(m.propuestas ?? []).map((p) => (
                <TarjetaPropuesta key={p.id} p={p} alCambiar={(np) => actualizarPropuesta(i, np)} />
              ))}
              {(m.enlaces ?? []).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.enlaces!.map((e) => (
                    <Link key={e.href} href={e.href} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:border-slate-300">
                      {e.texto}
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
        {adjuntos.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {adjuntos.map((a, k) => (
              <span key={k} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
                {a.vista ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.vista} alt="" className="h-8 w-8 rounded object-cover" />
                ) : null}
                {a.nombre}
                <button type="button" onClick={() => setAdjuntos((x) => x.filter((_, j) => j !== k))} className="text-slate-500 hover:text-slate-900" aria-label={`Quitar ${a.nombre}`}>
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        {aviso && <p role="alert" className="mb-2 text-xs text-red-700">{aviso}</p>}
        <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-2 focus-within:border-gold-500">
          <input ref={archivo} type="file" accept="image/*,.pdf,.csv,.txt,.md,text/plain,text/csv" multiple className="hidden" onChange={(e) => adjuntar(e.target.files)} />
          <button type="button" onClick={() => archivo.current?.click()} disabled={adjuntos.length >= MAX_ADJUNTOS} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40" aria-label="Adjuntar un archivo" title="Adjuntar imagen, PDF, CSV o texto">
            <span aria-hidden="true" className="text-lg leading-none">+</span>
          </button>
          <label htmlFor="chat-campana-texto" className="sr-only">
            Mensaje para la IA de campañas
          </label>
          <textarea
            id="chat-campana-texto"
            rows={2}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar(texto);
              }
            }}
            placeholder="Ej.: quiero contactar a la base de accidentes de tránsito esta semana"
            className="sin-anillo max-h-40 min-h-[2.5rem] flex-1 resize-none border-0 bg-transparent p-1 text-sm text-slate-900 shadow-none focus:ring-0"
          />
          <button type="submit" disabled={pensando || (!texto.trim() && adjuntos.length === 0)} className="btn-gold-sm h-9">
            Enviar
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          No adjuntes bases con datos de personas: para eso está Bases. Lo que adjuntes se lee para ayudarte y no se guarda en el CRM.
        </p>
      </form>
    </section>
  );
}
